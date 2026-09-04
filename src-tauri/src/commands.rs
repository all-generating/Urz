use crate::models::{GenerateRequest, GenerateResponse};
use crate::password::generate_password;

/// Generate a deterministic password based on input parameters
#[tauri::command]
pub fn generate_password_cmd(req: GenerateRequest) -> Result<GenerateResponse, String> {
    let password = generate_password(&req.password, &req.salt, req.length, req.use_symbols);
    
    if password.is_empty() && !req.password.is_empty() {
        return Err("Invalid length. Must be between 6 and 64.".to_string());
    }
    
    Ok(GenerateResponse { password })
}

/// Copy text to clipboard
#[tauri::command]
pub fn copy_to_clipboard<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    text: String,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}
