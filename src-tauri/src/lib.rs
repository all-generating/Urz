mod commands;
mod models;
mod password;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(commands::ClipboardState::new())
        .invoke_handler(tauri::generate_handler![
            commands::generate_password_cmd,
            commands::copy_to_clipboard
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
