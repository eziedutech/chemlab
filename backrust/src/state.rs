use std::sync::Arc;

use crate::cache::ReportCache;
use crate::llm_client::LlmClient;
use crate::rate_limit::RateLimiter;

/// Everything the handlers share. Cloning is cheap: it is all behind an Arc.
#[derive(Clone)]
pub struct AppState {
    pub llm: Arc<LlmClient>,
    pub cache: Arc<ReportCache>,
    pub limiter: Arc<RateLimiter>,
}

impl AppState {
    pub fn new() -> Self {
        let llm = LlmClient::new();
        if llm.is_configured() {
            tracing::info!(
                "provider configured, model {}",
                llm.model().unwrap_or("unknown")
            );
        } else {
            tracing::warn!(
                "LLM_BASE_URL, LLM_MODEL or LLM_API_KEY is missing: lab reports will use the fallback text"
            );
        }

        Self {
            llm: Arc::new(llm),
            cache: Arc::new(ReportCache::default()),
            limiter: Arc::new(RateLimiter::default()),
        }
    }
}
