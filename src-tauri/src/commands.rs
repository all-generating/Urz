use crate::password::generate_password;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, Runtime};
use futures_timer::Delay;
use std::time::Duration;

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

    Ok(crate::models::GenerateResponse {
        password: generated,
    })
}

/// Copy text to clipboard and schedule clearing after 60 seconds
#[tauri::command]
pub fn copy_to_clipboard<R: Runtime>(app: AppHandle<R>, text: String) -> Result<(), String> {
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
        // Wait for 60 seconds using futures_timer which is compatible with async-std
        Delay::new(Duration::from_secs(60)).await;

        let state = app_clone.state::<ClipboardState>();

        // Get the text we stored, releasing the lock immediately
        let stored_text = {
            let last_text_guard = state.last_copied_text.lock().ok();
            last_text_guard.and_then(|g| g.clone())
        };

        // If no stored text, nothing to clear
        let last_text = match stored_text {
            Some(text) => text,
            None => {
                println!("[Clipboard] No stored text to check");
                return;
            }
        };

        // Safely check clipboard contents
        // We need to handle cases where clipboard contains non-text data (images, files)
        let should_clear = {
            let clipboard = app_clone.clipboard();
            // Try to read as text - if it fails or doesn't match, don't clear
            match clipboard.read_text() {
                Ok(current_text) => current_text == last_text,
                Err(_) => {
                    // Clipboard contains non-text data (image, file, etc.) or is empty
                    // Don't clear in this case
                    false
                }
            }
        };

        if should_clear {
            // Clear our stored text first
            {
                let mut last_text_guard = state.last_copied_text.lock().unwrap_or_else(|e| e.into_inner());
                *last_text_guard = None;
            }

            // Then clear the clipboard
            let clipboard = app_clone.clipboard();
            if let Err(e) = clipboard.clear() {
                eprintln!("[Clipboard] Failed to clear: {}", e);
            } else {
                println!("[Clipboard] Cleared after 60 seconds");
            }
        } else {
            println!("[Clipboard] Not cleared - user copied different content or non-text data");
        }
    });

    Ok(())
}
