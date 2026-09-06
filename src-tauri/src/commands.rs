use crate::password::generate_password;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, Runtime};

/// State to manage clipboard clearing
#[derive(Clone)]
pub struct ClipboardState {
    last_copied_text: Arc<Mutex<Option<String>>>,
}

impl ClipboardState {
    pub fn new() -> Self {
        ClipboardState {
            last_copied_text: Arc::new(Mutex::new(None)),
        }
    }
}

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

/// Copy text to clipboard and schedule clearing after 60 seconds
#[tauri::command]
pub fn copy_to_clipboard<R: Runtime>(
    app: AppHandle<R>,
    text: String,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;

    // Store the text we're copying
    let state = app.state::<ClipboardState>();
    {
        let mut last_text = state.last_copied_text.lock().map_err(|e| e.to_string())?;
        *last_text = Some(text.clone());
    }

    // Write to clipboard
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())?;

    // Schedule clipboard clearing after 60 seconds
    let app_clone = app.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(60)).await;

        let state = app_clone.state::<ClipboardState>();
        let last_text_guard = state.last_copied_text.lock().ok();

        // Check if the clipboard still contains our text
        if let Some(last_text) = last_text_guard.as_ref().and_then(|g| g.clone()) {
            let current_clipboard = app_clone.clipboard().read_text().ok();

            // Only clear if the clipboard still has our text (user didn't copy something else)
            if current_clipboard == Some(last_text) {
                let _ = app_clone.clipboard().clear();
                let mut last_text_mut = state.last_copied_text.lock().ok();
                if let Some(lt) = last_text_mut.as_mut() {
                    *lt = None;
                }
                println!("[Clipboard] Cleared after 60 seconds");
            } else {
                println!("[Clipboard] Not cleared - user copied different content");
            }
        }
    });

    Ok(())
}
