use std::collections::hash_map::DefaultHasher;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;

use crate::models::LabReportResponse;

/// Largest number of reports kept in memory. Well beyond anything a judging
/// session will produce, and small enough that the process cannot grow without
/// bound if someone hammers the endpoint.
const CAPACITY: usize = 256;

/// In memory cache of generated lab reports.
///
/// Two reasons it exists: a repeated request comes back instantly during a
/// demo, and the provider is not billed twice for the same question.
#[derive(Default)]
pub struct ReportCache {
    entries: Mutex<HashMap<u64, LabReportResponse>>,
}

impl ReportCache {
    pub fn key(topic: &str, lang: &str, observations: &str, conclusion: &str) -> u64 {
        let mut hasher = DefaultHasher::new();
        topic.hash(&mut hasher);
        lang.hash(&mut hasher);
        observations.trim().hash(&mut hasher);
        conclusion.trim().hash(&mut hasher);
        hasher.finish()
    }

    pub fn get(&self, key: u64) -> Option<LabReportResponse> {
        let entries = self.entries.lock().ok()?;
        entries.get(&key).cloned()
    }

    pub fn put(&self, key: u64, value: LabReportResponse) {
        let Ok(mut entries) = self.entries.lock() else {
            return;
        };
        // Nothing here needs recency tracking: the whole point is a demo that
        // repeats a handful of requests, so clearing on overflow is enough.
        if entries.len() >= CAPACITY {
            entries.clear();
        }
        entries.insert(key, value);
    }
}
