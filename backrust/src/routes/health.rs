use axum::extract::State;
use axum::Json;
use serde::Serialize;

use crate::state::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub version: &'static str,
    /// How many providers are configured. Zero means lab reports come from the
    /// prepared text, which is a healthy state, not a broken one.
    pub providers: usize,
}

/// GET /health
///
/// Used by the Dokploy healthcheck and by the local smoke test.
/// It never touches the LLM provider, so it stays fast and always answers 200.
pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
        providers: state.llm.provider_count(),
    })
}
