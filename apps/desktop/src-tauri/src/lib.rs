mod browser;
mod system;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // One instance only: a second launch brings the first window to the front.
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.unminimize();
                let _ = win.show();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());

    builder
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            system::secure_get,
            system::secure_set,
            system::secure_delete,
            system::autostart_get,
            system::autostart_set,
            browser::browser_show,
            browser::browser_hide,
            browser::browser_hide_all,
            browser::browser_navigate,
            browser::browser_history,
            browser::browser_close
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ish maydoni");
}
