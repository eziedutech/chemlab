use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use serde_json::json;

/// Lab reports are short by design, and this is also the cost ceiling on the
/// only endpoint that spends anything.
const MAX_TOKENS: u32 = 600;
const TIMEOUT: Duration = Duration::from_secs(20);

/// Suffixes scanned for provider credentials, in the order they are tried.
/// `LLM_BASE_URL` is the first provider, `LLM_BASE_URL_2` the next, and so on.
const SUFFIXES: [&str; 5] = ["", "_2", "_3", "_4", "_5"];

/// One provider.
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
    fn from_suffix(suffix: &str) -> Option<Self> {
        let base_url = std::env::var(format!("LLM_BASE_URL{suffix}")).ok()?;
        let model = std::env::var(format!("LLM_MODEL{suffix}")).ok()?;
        let api_key = std::env::var(format!("LLM_API_KEY{suffix}")).ok()?;

        if base_url.trim().is_empty() || model.trim().is_empty() || api_key.trim().is_empty() {
            return None;
        }

        Some(Self {
            base_url: base_url.trim().trim_end_matches('/').to_string(),
            model: model.trim().to_string(),
            api_key: api_key.trim().to_string(),
        })
    }

    /// Every provider configured, in the order they should be tried.
    pub fn all_from_env() -> Vec<Self> {
        SUFFIXES
            .iter()
            .filter_map(|suffix| Self::from_suffix(suffix))
            .collect()
    }
}

pub struct LlmClient {
    http: Client,
    providers: Vec<LlmConfig>,
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

/// A completion, and which provider produced it.
pub struct Completion {
    pub text: String,
    pub model: String,
}

impl LlmClient {
    pub fn new() -> Self {
        let http = Client::builder()
            .timeout(TIMEOUT)
            .build()
            .unwrap_or_else(|_| Client::new());

        Self {
            http,
            providers: LlmConfig::all_from_env(),
        }
    }

    pub fn is_configured(&self) -> bool {
        !self.providers.is_empty()
    }

    pub fn provider_count(&self) -> usize {
        self.providers.len()
    }

    pub fn models(&self) -> Vec<String> {
        self.providers
            .iter()
            .map(|provider| provider.model.clone())
            .collect()
    }

    /// Ask for one completion, trying each provider in turn.
    ///
    /// A provider that is out of quota, unreachable, or slow is passed over for
    /// the next one, which is the point of configuring more than one: judging
    /// runs for three weeks and a single exhausted account should not take the
    /// feature down. When every provider fails the caller answers with the
    /// prepared fallback text, so this can never become a 500.
    pub async fn complete(&self, system: &str, user: &str) -> Result<Completion, String> {
        if self.providers.is_empty() {
            return Err("no provider configured".to_string());
        }

        let mut failures = Vec::new();

        for (index, provider) in self.providers.iter().enumerate() {
            match self.call(provider, system, user).await {
                Ok(text) => {
                    if index > 0 {
                        tracing::warn!(
                            "provider {} answered after {} earlier failure(s)",
                            index + 1,
                            index
                        );
                    }
                    return Ok(Completion {
                        text,
                        model: provider.model.clone(),
                    });
                }
                Err(error) => {
                    tracing::warn!("provider {} failed: {error}", index + 1);
                    failures.push(format!("provider {}: {error}", index + 1));
                }
            }
        }

        Err(failures.join("; "))
    }

    async fn call(
        &self,
        provider: &LlmConfig,
        system: &str,
        user: &str,
    ) -> Result<String, String> {
        let url = format!("{}/chat/completions", provider.base_url);
        let body = json!({
            "model": provider.model,
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
            .bearer_auth(&provider.api_key)
            .json(&body)
            .send()
            .await
            .map_err(|error| format!("request failed: {error}"))?;

        let status = response.status();
        if !status.is_success() {
            return Err(format!("answered {status}"));
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
            return Err("returned an empty answer".to_string());
        }

        Ok(text)
    }
}
