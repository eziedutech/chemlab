use crate::models::{Lang, LabReportRequest, LabReportResponse, Source};

/// Learning points per topic, written ahead of time.
fn learning_points(topic: &str, lang: Lang) -> Vec<String> {
    let points: &[(&str, &str)] = match topic {
        "asam_basa" => &[
            (
                "Asam dan basa bereaksi menghasilkan gas karbon dioksida, air, dan garam.",
                "An acid and a base react to produce carbon dioxide gas, water, and a salt.",
            ),
            (
                "Gelembung adalah bukti terbentuknya gas, bukan sekadar udara yang terperangkap.",
                "The bubbles are evidence that a gas formed, not just trapped air.",
            ),
            (
                "Suhu yang turun menandakan reaksi ini endoterm, yaitu menyerap kalor.",
                "A falling temperature shows the reaction is endothermic: it absorbs heat.",
            ),
        ],
        "elektrolit" => &[
            (
                "Larutan menghantarkan listrik kalau mengandung ion yang bebas bergerak.",
                "A solution conducts electricity when it contains freely moving ions.",
            ),
            (
                "Senyawa ion seperti garam dapur terurai sempurna, jadi tergolong elektrolit kuat.",
                "Ionic compounds such as table salt separate completely, making them strong electrolytes.",
            ),
            (
                "Gula larut sebagai molekul utuh, tidak menghasilkan ion, sehingga lampu tetap mati.",
                "Sugar dissolves as whole molecules and produces no ions, so the lamp stays dark.",
            ),
        ],
        "massa_jenis" => &[
            (
                "Benda mengapung kalau massa jenisnya lebih kecil daripada massa jenis zat cair.",
                "An object floats when its density is lower than the density of the liquid.",
            ),
            (
                "Gaya apung sama dengan berat zat cair yang dipindahkan benda.",
                "The buoyant force equals the weight of the liquid the object pushes aside.",
            ),
            (
                "Melarutkan garam menaikkan massa jenis air, dan itu yang mengubah hasil percobaan.",
                "Dissolving salt raises the density of the water, and that is what changes the outcome.",
            ),
        ],
        _ => &[(
            "Catat apa yang diamati sebelum menarik kesimpulan.",
            "Record what was observed before drawing a conclusion.",
        )],
    };

    points
        .iter()
        .map(|(indonesian, english)| match lang {
            Lang::Id => indonesian.to_string(),
            Lang::En => english.to_string(),
        })
        .collect()
}

fn topic_label(topic: &str, lang: Lang) -> String {
    let (indonesian, english) = match topic {
        "asam_basa" => ("Reaksi asam dan basa", "Acid and base reaction"),
        "elektrolit" => (
            "Larutan elektrolit dan non-elektrolit",
            "Electrolyte and non electrolyte solutions",
        ),
        "massa_jenis" => ("Massa jenis dan gaya apung", "Density and buoyancy"),
        other => (other, other),
    };

    match lang {
        Lang::Id => indonesian.to_string(),
        Lang::En => english.to_string(),
    }
}

/// A complete lab report assembled without the provider.
///
/// Used when the provider is unreachable, unconfigured, or out of quota. It is
/// built from what the student actually did, so it is a real report rather than
/// an apology, and the caller still receives HTTP 200 with source "fallback".
pub fn lab_report(request: &LabReportRequest, lang: Lang) -> LabReportResponse {
    let topic = topic_label(&request.topic, lang);
    let observations = request.observations.trim();
    let conclusion = request
        .conclusion_draft
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    let formatted_report = match lang {
        Lang::Id => {
            let mut report = format!(
                "LAPORAN PENGAMATAN\n\nTopik: {topic}\n\nPengamatan\n{observations}\n"
            );
            if let Some(conclusion) = conclusion {
                report.push_str(&format!("\nKesimpulan\n{conclusion}\n"));
            }
            report.push_str("\nCatatan\nLaporan ini disusun dari data pengamatan yang tercatat selama simulasi.");
            report
        }
        Lang::En => {
            let mut report =
                format!("OBSERVATION REPORT\n\nTopic: {topic}\n\nObservations\n{observations}\n");
            if let Some(conclusion) = conclusion {
                report.push_str(&format!("\nConclusion\n{conclusion}\n"));
            }
            report.push_str(
                "\nNote\nThis report was assembled from the observations recorded during the simulation.",
            );
            report
        }
    };

    LabReportResponse {
        formatted_report,
        learning_points: learning_points(&request.topic, lang),
        source: Source::Fallback,
    }
}

/// Prompt sent to the provider when it is available.
pub fn report_prompt(request: &LabReportRequest, lang: Lang) -> (String, String) {
    let language = match lang {
        Lang::Id => "Bahasa Indonesia",
        Lang::En => "English",
    };

    let system = format!(
        "You write short observation reports for secondary school science students. \
         Answer in {language}. Use only the observations you are given: never invent \
         measurements, reactions, or results. Keep it under 200 words, structured as \
         a title, an observations section, and a conclusion. Plain text only."
    );

    let conclusion = request
        .conclusion_draft
        .as_deref()
        .unwrap_or("(the student did not draft one)");

    let user = format!(
        "Topic: {topic}\nObservations recorded during the experiment:\n{observations}\n\nStudent's draft conclusion:\n{conclusion}",
        topic = topic_label(&request.topic, lang),
        observations = request.observations.trim(),
    );

    (system, user)
}
