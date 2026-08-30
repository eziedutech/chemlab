use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

/// Requests one client may make inside the window.
const MAX_REQUESTS: usize = 12;
const WINDOW: Duration = Duration::from_secs(600);

/// A small per client limiter on the one endpoint that costs money.
///
/// This is not a defence against a determined attacker. It exists so that a
/// runaway loop or a curious bot cannot drain the provider credit that has to
/// last until judging closes.
#[derive(Default)]
pub struct RateLimiter {
    hits: Mutex<HashMap<String, Vec<Instant>>>,
}

impl RateLimiter {
    pub fn check(&self, client: &str) -> bool {
        let Ok(mut hits) = self.hits.lock() else {
            // If the lock is poisoned, let the request through: a broken
            // limiter must not take the endpoint down with it.
            return true;
        };

        let now = Instant::now();
        let entry = hits.entry(client.to_string()).or_default();
        entry.retain(|seen| now.duration_since(*seen) < WINDOW);

        if entry.len() >= MAX_REQUESTS {
            return false;
        }

        entry.push(now);

        // Keep the table from growing forever on a long lived process.
        if hits.len() > 4096 {
            hits.retain(|_, seen| seen.iter().any(|at| now.duration_since(*at) < WINDOW));
        }

        true
    }
}
