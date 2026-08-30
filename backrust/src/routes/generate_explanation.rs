use axum::{extract::State, Json};

use crate::explanations;
use crate::models::{normalize_topic, ExplanationRequest, ExplanationResponse, Lang, Source};
use crate::state::AppState;

/// POST /api/generate-explanation
///
/// Served entirely from text written and checked ahead of time. No language
/// model runs here: the answer is instant, identical every time, and free,
/// which is what lets the demo be repeated as often as the judges like.
pub async fn generate_explanation(
    State(_state): State<AppState>,
    Json(request): Json<ExplanationRequest>,
) -> Json<ExplanationResponse> {
    let topic = normalize_topic(&request.topic);
    let lang = Lang::parse(request.lang.as_deref());

    match explanations::lookup(&topic, request.step_number, lang) {
        Some(step) => {
            let step_number = request
                .step_number
                .max(1)
                .min(step.total_steps);

            Json(ExplanationResponse {
                explanation: step.text,
                step_number,
                total_steps: step.total_steps,
                title: step.title,
                diagram_svg_hint: step.diagram,
                source: Source::Static,
            })
        }
        None => {
            // An unknown topic still gets a usable answer, and a list of what
            // does exist, rather than an error the agent cannot act on.
            let known = explanations::topics().join(", ");
            let explanation = match lang {
                Lang::Id => format!(
                    "Topik \"{}\" belum tersedia. Topik yang bisa dijelaskan: {known}.",
                    request.topic
                ),
                Lang::En => format!(
                    "The topic \"{}\" is not available. Topics that can be explained: {known}.",
                    request.topic
                ),
            };

            Json(ExplanationResponse {
                explanation,
                step_number: request.step_number.max(1),
                total_steps: 0,
                title: match lang {
                    Lang::Id => "Topik tidak dikenal".to_string(),
                    Lang::En => "Unknown topic".to_string(),
                },
                diagram_svg_hint: None,
                source: Source::Fallback,
            })
        }
    }
}
