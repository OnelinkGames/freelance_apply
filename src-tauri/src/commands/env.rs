use serde::Serialize;
use std::collections::HashMap;
use std::path::PathBuf;

#[derive(Serialize)]
pub struct EnvConfig {
    pub openai_api_key: Option<String>,
    pub openai_model: String,
    pub anthropic_api_key: Option<String>,
    pub google_api_key: Option<String>,
    pub deepseek_api_key: Option<String>,
    pub provider: String,
}

fn find_env_path() -> Option<PathBuf> {
    let candidates = [
        PathBuf::from(".env"),
        PathBuf::from("../.env"),
        PathBuf::from("../../.env"),
    ];

    for path in candidates {
        if path.exists() {
            return Some(path);
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        let mut dir = cwd.as_path();
        for _ in 0..5 {
            let candidate = dir.join(".env");
            if candidate.exists() {
                return Some(candidate);
            }
            dir = dir.parent()?;
        }
    }

    None
}

fn load_env_file() -> HashMap<String, String> {
    let mut map = HashMap::new();

    if let Some(path) = find_env_path() {
        if dotenvy::from_path(&path).is_ok() {
            if let Ok(iter) = dotenvy::from_path_iter(&path) {
                for item in iter.flatten() {
                    map.insert(item.0, item.1);
                }
            }
        }
    }

    for (key, value) in std::env::vars() {
        map.entry(key).or_insert(value);
    }

    map
}

#[tauri::command]
pub fn read_env_config() -> EnvConfig {
    let env = load_env_file();

    EnvConfig {
        openai_api_key: env.get("OPENAI_API_KEY").cloned().filter(|v| !v.is_empty()),
        openai_model: env
            .get("OPENAI_MODEL")
            .cloned()
            .unwrap_or_else(|| "gpt-4.1".to_string()),
        anthropic_api_key: env
            .get("ANTHROPIC_API_KEY")
            .cloned()
            .filter(|v| !v.is_empty()),
        google_api_key: env
            .get("GOOGLE_API_KEY")
            .cloned()
            .filter(|v| !v.is_empty()),
        deepseek_api_key: env
            .get("DEEPSEEK_API_KEY")
            .cloned()
            .filter(|v| !v.is_empty()),
        provider: env
            .get("AI_PROVIDER")
            .cloned()
            .unwrap_or_else(|| "openai".to_string()),
    }
}

#[tauri::command]
pub fn mask_api_key(key: String) -> String {
    if key.len() <= 8 {
        return "*".repeat(key.len());
    }

    format!("{}...{}", &key[..4], &key[key.len() - 4..])
}
