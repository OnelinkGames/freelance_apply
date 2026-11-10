mod commands;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: include_str!("../migrations/0001_initial.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:freelance.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::env::read_env_config,
            commands::env::mask_api_key,
            commands::fs::get_app_data_dir,
            commands::fs::write_markdown_file,
            commands::fs::read_markdown_file,
            commands::fs::ensure_project_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
