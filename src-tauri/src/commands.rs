use crate::password::generate_password;

/// Generate a deterministic password based on input parameters
#[tauri::command]
pub fn generate_password_cmd(
    password: String,
    salt: String,
    length: usize,
    use_symbols: bool,
) -> Result<crate::models::GenerateResponse, String> {
    let generated = generate_password(&password, &salt, length, use_symbols);
    
    if generated.is_empty() && !password.is_empty() {
        return Err("Invalid length. Must be between 6 and 64.".to_string());
    }
    
    Ok(crate::models::GenerateResponse { password: generated })
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
