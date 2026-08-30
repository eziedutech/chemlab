use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

/// Lab reports are short by design, and this is also the cost ceiling on the
/// only endpoint that spends anything.
const MAX_TOKENS: u32 = 600;
const TIMEOUT: Duration = Duration::from_secs(20);

/// Configuration for whichever provider is in use.
///
/// Deliberately not an OpenAI SDK: any endpoint that speaks the OpenAI chat
/// completions shape works, so moving between providers is an environment
/// change rather than a code change.
#[derive(Clone, Debug)]
pub struct LlmConfig {
    pub base_url: String,
    pub model: String,
    pub api_key: String,
}

impl LlmConfig {
    pub fn from_env() -> Option<Self> {
        let base_url = std::env::var("LLM_BASE_URL").ok()?;
        let model = std::env::var("LLM_MODEL").ok()?;
        let api_key = std::env::var("LLM_API_KEY").ok()?;

        if base_url.trim().is_empty() || model.trim().is_empty() || api_key.trim().is_empty() {
            return None;
        }

        Some(Self {
            base_url: base_url.trim().trim_end_matches('/').to_string(),
            model: model.trim().to_string(),
            api_key: api_key.trim().to_string(),
        })
    }
}

pub struct LlmClient {
    http: Client,
    config: Option<LlmConfig>,
}

#[derive(Debug, Deserialize)]
struct ChatResponse {
    choices: Vec<Choice>,
}

#[derive(Debug, Deserialize)]
struct Choice {
    message: ChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChoiceMessage {
    #[serde(default)]
    content: String,
}

impl LlmClient {
    pub fn new() -> Self {
        let http = Client::builder()
            .timeout(TIMEOUT)
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            http,
            config: LlmConfig::from_env(),
        }
    }

    pub fn is_configured(&self) -> bool {
        self.config.is_some()
    }

    pub fn model(&self) -> Option<&str> {
        self.config.as_ref().map(|config| config.model.as_str())
    }

    /// Ask the provider for one completion.
    ///
    /// Every failure path returns Err and the caller answers with the prepared
    /// fallback text, so a provider outage or an exhausted quota can never turn
    /// into a 500 for the client.
    pub async fn complete(&self, system: &str, user: &str) -> Result<String, String> {
        let Some(config) = self.config.as_ref() else {
            return Err("no provider configured".to_string());
        };

        let url = format!("{}/chat/completions", config.base_url);
        let body = json!({
            "model": config.model,
            "max_tokens": MAX_TOKENS,
            "temperature": 0.4,
            "messages": [
                { "role": "system", "content": system },
                { "role": "user", "content": user },
            ],
        });

        let response = self
            .http
            .post(&url)
            .bearer_auth(&config.api_key)
            .json(&body)
            .send()
            .await
            .map_err(|error| format!("request failed: {error}"))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("provider answered {status}"));
        }

        let parsed: ChatResponse = response
            .json()
            .await
            .map_err(|error| format!("could not read the answer: {error}"))?;

        let text = parsed
            .choices
            .first()
            .map(|choice| choice.message.content.trim().to_string())
            .unwrap_or_default();

        if text.is_empty() {
            return Err("the provider returned an empty answer".to_string());
        }

        Ok(text)
    }
}
