mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            system::secure_get,
            system::secure_set,
            system::secure_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ish maydoni");
}
