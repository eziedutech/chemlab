use serde::{Deserialize, Serialize};

/// Where a piece of text came from. Exposed to the client on purpose: a judge
/// should be able to see when the language model was really used, when a cached
/// answer came back, and when the static fallback stepped in.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Source {
    /// Written ahead of time, checked by a human, and shipped with the binary.
    Static,
    /// Generated earlier in this process for the same request.
    Cache,
    /// Generated just now by the configured provider.
    Llm,
    /// The provider was unavailable, so a prepared text was used instead.
    Fallback,
}

#[derive(Debug, Deserialize)]
pub struct ExplanationRequest {
    /// Accepted because the documented request shape carries it. The answer
    /// depends on the topic and the step alone, so it is not read.
    #[serde(default)]
    #[allow(dead_code)]
    pub subject: Option<String>,
    pub topic: String,
    pub step_number: u32,
    /// Same: part of the request contract, deliberately unused, because the
    /// explanations are fixed text rather than something generated from it.
    #[serde(default)]
    #[allow(dead_code)]
    pub reaction_context: Option<String>,
    #[serde(default)]
    pub lang: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ExplanationResponse {
    pub explanation: String,
    pub step_number: u32,
    pub total_steps: u32,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diagram_svg_hint: Option<String>,
    pub source: Source,
}

#[derive(Debug, Deserialize)]
pub struct LabReportRequest {
    pub topic: String,
    pub observations: String,
    #[serde(default)]
    pub conclusion_draft: Option<String>,
    #[serde(default)]
    pub lang: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct LabReportResponse {
    pub formatted_report: String,
    pub learning_points: Vec<String>,
    pub source: Source,
}

/// Language of the answer. Anything unrecognised is treated as Indonesian,
/// which is the default the app itself uses.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Lang {
    Id,
    En,
}

impl Lang {
    pub fn parse(raw: Option<&str>) -> Self {
        match raw.map(|value| value.trim().to_ascii_lowercase()) {
            Some(value) if value.starts_with("en") => Lang::En,
            _ => Lang::Id,
        }
    }

    pub fn key(self) -> &'static str {
        match self {
            Lang::Id => "id",
            Lang::En => "en",
        }
    }
}

/// Fold whatever the client sent onto one of the three topic keys.
pub fn normalize_topic(raw: &str) -> String {
    raw.trim()
        .to_ascii_lowercase()
        .replace([' ', '-'], "_")
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_')
        .collect()
}
