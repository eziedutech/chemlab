use std::net::SocketAddr;

use axum::extract::{ConnectInfo, State};
use axum::http::HeaderMap;
use axum::Json;

use crate::cache::ReportCache;
use crate::fallback;
use crate::models::{normalize_topic, Lang, LabReportRequest, LabReportResponse, Source};
use crate::state::AppState;

/// POST /api/generate-lab-report
///
/// The one endpoint that calls the provider at runtime, because a report
/// depends on what the student actually did in that session and cannot be
/// prepared in advance.
///
/// It never answers 500. A missing key, a timeout, an exhausted quota, or a
/// provider outage all fall through to a report assembled from the student's
/// own observations, returned with 200 and source "fallback". The server has to
/// look healthy for as long as judging is open.
pub async fn generate_lab_report(
    State(state): State<AppState>,
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    Json(request): Json<LabReportRequest>,
) -> Json<LabReportResponse> {
    let lang = Lang::parse(request.lang.as_deref());
    let normalized = LabReportRequest {
        topic: normalize_topic(&request.topic),
        observations: request.observations.clone(),
        conclusion_draft: request.conclusion_draft.clone(),
        lang: request.lang.clone(),
    };

    if normalized.observations.trim().is_empty() {
        return Json(LabReportResponse {
            formatted_report: match lang {
                Lang::Id => "Belum ada pengamatan yang bisa dilaporkan. Jalankan percobaannya lebih dulu.".to_string(),
                Lang::En => "There are no observations to report yet. Run the experiment first.".to_string(),
            },
            learning_points: Vec::new(),
            source: Source::Fallback,
        });
    }

    let key = ReportCache::key(
        &normalized.topic,
        lang.key(),
        &normalized.observations,
        normalized.conclusion_draft.as_deref().unwrap_or(""),
    );

    if let Some(mut cached) = state.cache.get(key) {
        cached.source = Source::Cache;
        return Json(cached);
    }

    // Only the paid path is limited, and only per client.
    let client = client_id(&headers, peer);
    if !state.limiter.check(&client) {
        tracing::warn!("rate limit reached for {client}, answering from the fallback");
        return Json(fallback::lab_report(&normalized, lang));
    }

    if !state.llm.is_configured() {
        tracing::info!("no provider configured, answering from the fallback");
        return Json(fallback::lab_report(&normalized, lang));
    }

    let (system, user) = fallback::report_prompt(&normalized, lang);
    match state.llm.complete(&system, &user).await {
        Ok(text) => {
            let response = LabReportResponse {
                formatted_report: text,
                learning_points: fallback::lab_report(&normalized, lang).learning_points,
                source: Source::Llm,
            };
            state.cache.put(key, response.clone());
            Json(response)
        }
        Err(error) => {
            tracing::warn!("provider call failed ({error}), answering from the fallback");
            Json(fallback::lab_report(&normalized, lang))
        }
    }
}

/// Who to count this request against.
///
/// Behind the production reverse proxy every request arrives from the proxy
/// itself, so the forwarded address is used when it is present.
fn client_id(headers: &HeaderMap, peer: SocketAddr) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| peer.ip().to_string())
}
