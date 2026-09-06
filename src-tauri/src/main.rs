#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod password;

use commands::{copy_to_clipboard, generate_password_cmd, ClipboardState};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(ClipboardState::new())
        .invoke_handler(tauri::generate_handler![
            generate_password_cmd,
            copy_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
