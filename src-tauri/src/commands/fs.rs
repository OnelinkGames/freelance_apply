use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
pub fn get_app_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_markdown_file(app: tauri::AppHandle, project_id: String, filename: String, content: String) -> Result<String, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let project_dir = base.join("projects").join(&project_id);
    fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

    let file_path = project_dir.join(&filename);
    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_markdown_file(app: tauri::AppHandle, project_id: String, filename: String) -> Result<String, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let file_path = base.join("projects").join(project_id).join(filename);
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ensure_project_dir(app: tauri::AppHandle, project_id: String) -> Result<String, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;

    let project_dir = base.join("projects").join(&project_id);
    fs::create_dir_all(&project_dir).map_err(|e| e.to_string())?;

    Ok(project_dir.to_string_lossy().to_string())
}
