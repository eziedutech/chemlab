use std::collections::HashMap;
use std::sync::OnceLock;

use serde::Deserialize;

use crate::models::Lang;

/// The pre written explanations, embedded in the binary at build time.
///
/// explain_reaction_step deliberately never calls a language model: the content
/// is fixed, three topics of four steps in two languages, so it is written and
/// checked once, answers instantly, and cannot burn credit while judging is
/// still open.
const RAW: &str = include_str!("../data/explanations.json");

#[derive(Debug, Deserialize)]
struct Document {
    topics: HashMap<String, TopicEntry>,
}

#[derive(Debug, Deserialize)]
struct TopicEntry {
    total_steps: u32,
    steps: Vec<StepEntry>,
}

#[derive(Debug, Deserialize)]
struct StepEntry {
    title_id: String,
    title_en: String,
    id: String,
    en: String,
    #[serde(default)]
    diagram: Option<String>,
}

pub struct Step {
    pub title: String,
    pub text: String,
    pub diagram: Option<String>,
    pub total_steps: u32,
}

static DOCUMENT: OnceLock<Document> = OnceLock::new();

fn document() -> &'static Document {
    DOCUMENT.get_or_init(|| {
        serde_json::from_str(RAW).expect("explanations.json is malformed, this is a build error")
    })
}

pub fn topics() -> Vec<String> {
    let mut names: Vec<String> = document().topics.keys().cloned().collect();
    names.sort();
    names
}

/// Look up one step. The step number is clamped into range rather than
/// rejected, because an agent asking for step 9 of 4 still deserves an answer.
pub fn lookup(topic: &str, step_number: u32, lang: Lang) -> Option<Step> {
    let entry = document().topics.get(topic)?;
    let index = (step_number.max(1).min(entry.total_steps) - 1) as usize;
    let step = entry.steps.get(index)?;

    Some(Step {
        title: match lang {
            Lang::Id => step.title_id.clone(),
            Lang::En => step.title_en.clone(),
        },
        text: match lang {
            Lang::Id => step.id.clone(),
            Lang::En => step.en.clone(),
        },
        diagram: step.diagram.clone(),
        total_steps: entry.total_steps,
    })
}
