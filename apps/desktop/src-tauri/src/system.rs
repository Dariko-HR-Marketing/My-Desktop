//! Secure storage for the session token. Backed by the OS credential store, never by files or localStorage.

const SERVICE: &str = "uz.ishmaydoni.app";

fn entry(key: &str) -> Result<keyring::Entry, String> {
    keyring::Entry::new(SERVICE, key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secure_get(key: String) -> Result<Option<String>, String> {
    match entry(&key)?.get_password() {
        Ok(v) => Ok(Some(v)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn secure_set(key: String, value: String) -> Result<(), String> {
    entry(&key)?.set_password(&value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn secure_delete(key: String) -> Result<(), String> {
    match entry(&key)?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
