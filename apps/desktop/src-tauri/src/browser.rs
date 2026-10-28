//! Internal browser: every tab is its own child webview placed over the React viewport element.
//!
//! Security: only http(s) (and about:blank) may be loaded; tab webviews have no IPC capability
//! (see capabilities/default.json, which targets the `main` webview only).

use serde::{Deserialize, Serialize};
use tauri::webview::{NewWindowResponse, PageLoadEvent};
use tauri::{AppHandle, Emitter, LogicalPosition, LogicalSize, Manager, Url, WebviewBuilder, WebviewUrl};

const MAIN_WINDOW: &str = "main";
const LABEL_PREFIX: &str = "tab-";

#[derive(Deserialize, Clone, Copy, Debug)]
pub struct Bounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Serialize, Clone)]
struct PageEvent {
    id: String,
    url: String,
    loading: bool,
}

#[derive(Serialize, Clone)]
struct TitleEvent {
    id: String,
    title: String,
    unread: u32,
}

#[derive(Serialize, Clone)]
struct NewTabEvent {
    opener: String,
    url: String,
}

/// Tab ids come from the UI; they become webview labels, so keep them to a safe alphabet.
pub fn valid_tab_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 40 && id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

pub fn label_for(id: &str) -> Result<String, String> {
    if valid_tab_id(id) {
        Ok(format!("{LABEL_PREFIX}{id}"))
    } else {
        Err("invalid tab id".into())
    }
}

/// Only web pages may be opened in a tab. `file:`, `javascript:`, `data:`, custom schemes are refused.
pub fn is_allowed_url(url: &Url) -> bool {
    matches!(url.scheme(), "http" | "https") || url.as_str() == "about:blank"
}

fn parse_allowed(raw: &str) -> Result<Url, String> {
    let url = Url::parse(raw).map_err(|e| format!("invalid url: {e}"))?;
    if is_allowed_url(&url) {
        Ok(url)
    } else {
        Err("only http and https addresses can be opened".into())
    }
}

/// Unread counter from a page title such as "(12) Telegram" or "(3) WhatsApp". Zero when absent.
pub fn parse_unread(title: &str) -> u32 {
    let t = title.trim_start();
    let Some(rest) = t.strip_prefix('(') else { return 0 };
    let Some(end) = rest.find(')') else { return 0 };
    let inner = rest[..end].trim().trim_end_matches('+');
    inner.parse::<u32>().unwrap_or(0)
}

fn main_window(app: &AppHandle) -> Result<tauri::Window, String> {
    app.get_window(MAIN_WINDOW).ok_or_else(|| "main window not found".to_string())
}

fn place(wv: &tauri::Webview, b: Bounds) -> Result<(), String> {
    wv.set_position(LogicalPosition::new(b.x, b.y)).map_err(|e| e.to_string())?;
    wv.set_size(LogicalSize::new(b.width.max(1.0), b.height.max(1.0))).map_err(|e| e.to_string())
}

fn hide_others(app: &AppHandle, keep: &str) {
    for (label, wv) in app.webviews() {
        if label.starts_with(LABEL_PREFIX) && label != keep {
            let _ = wv.hide();
        }
    }
}

/// Async so that creating a webview never blocks the main thread's event loop (Windows deadlock).
#[tauri::command]
pub async fn browser_show(app: AppHandle, id: String, url: String, bounds: Bounds) -> Result<(), String> {
    let label = label_for(&id)?;
    hide_others(&app, &label);

    if let Some(wv) = app.get_webview(&label) {
        place(&wv, bounds)?;
        return wv.show().map_err(|e| e.to_string());
    }

    let target = parse_allowed(&url)?;
    let window = main_window(&app)?;

    let page_app = app.clone();
    let page_id = id.clone();
    let title_app = app.clone();
    let title_id = id.clone();
    let tab_app = app.clone();
    let tab_id = id.clone();

    let builder = WebviewBuilder::new(&label, WebviewUrl::External(target))
        .on_navigation(|url| is_allowed_url(url))
        .on_page_load(move |_wv, payload| {
            let _ = page_app.emit(
                "browser://page",
                PageEvent {
                    id: page_id.clone(),
                    url: payload.url().to_string(),
                    loading: matches!(payload.event(), PageLoadEvent::Started),
                },
            );
        })
        .on_document_title_changed(move |_wv, title| {
            let unread = parse_unread(&title);
            let _ = title_app.emit("browser://title", TitleEvent { id: title_id.clone(), title, unread });
        })
        // target=_blank / window.open: open as a new tab of ours instead of a real window
        .on_new_window(move |url, _features| {
            if is_allowed_url(&url) {
                let _ = tab_app.emit("browser://new-tab", NewTabEvent { opener: tab_id.clone(), url: url.to_string() });
            }
            NewWindowResponse::Deny
        });

    let webview = window
        .add_child(
            builder,
            LogicalPosition::new(bounds.x, bounds.y),
            LogicalSize::new(bounds.width.max(1.0), bounds.height.max(1.0)),
        )
        .map_err(|e| e.to_string())?;
    webview.show().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_hide(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview(&label_for(&id)?) {
        wv.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn browser_hide_all(app: AppHandle) -> Result<(), String> {
    hide_others(&app, "");
    Ok(())
}

#[tauri::command]
pub async fn browser_navigate(app: AppHandle, id: String, url: String) -> Result<(), String> {
    let target = parse_allowed(&url)?;
    match app.get_webview(&label_for(&id)?) {
        Some(wv) => wv.navigate(target).map_err(|e| e.to_string()),
        None => Err("tab is not open".into()),
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum HistoryAction {
    Back,
    Forward,
    Reload,
}

#[tauri::command]
pub async fn browser_history(app: AppHandle, id: String, action: HistoryAction) -> Result<(), String> {
    let Some(wv) = app.get_webview(&label_for(&id)?) else { return Ok(()) };
    match action {
        HistoryAction::Back => wv.eval("history.back()"),
        HistoryAction::Forward => wv.eval("history.forward()"),
        HistoryAction::Reload => wv.reload(),
    }
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn browser_close(app: AppHandle, id: String) -> Result<(), String> {
    if let Some(wv) = app.get_webview(&label_for(&id)?) {
        wv.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn url(s: &str) -> Url {
        Url::parse(s).unwrap()
    }

    #[test]
    fn allows_only_web_schemes() {
        assert!(is_allowed_url(&url("https://web.telegram.org/a/")));
        assert!(is_allowed_url(&url("http://example.com")));
        assert!(is_allowed_url(&url("about:blank")));
        assert!(!is_allowed_url(&url("file:///etc/passwd")));
        assert!(!is_allowed_url(&url("javascript:alert(1)")));
        assert!(!is_allowed_url(&url("data:text/html,<b>x</b>")));
        assert!(!is_allowed_url(&url("ftp://example.com/file")));
        assert!(!is_allowed_url(&url("tauri://localhost/index.html")));
        assert!(!is_allowed_url(&url("chrome://settings")));
    }

    #[test]
    fn parse_allowed_rejects_bad_input() {
        assert!(parse_allowed("https://lex.uz/").is_ok());
        assert!(parse_allowed("file:///C:/Windows/win.ini").is_err());
        assert!(parse_allowed("not a url").is_err());
    }

    #[test]
    fn reads_unread_count_from_title() {
        assert_eq!(parse_unread("(12) Telegram"), 12);
        assert_eq!(parse_unread("  (3) WhatsApp"), 3);
        assert_eq!(parse_unread("(99+) Telegram"), 99);
        assert_eq!(parse_unread("Telegram"), 0);
        assert_eq!(parse_unread("Telegram (5)"), 0);
        assert_eq!(parse_unread("(abc) Telegram"), 0);
        assert_eq!(parse_unread("(12 Telegram"), 0);
        assert_eq!(parse_unread(""), 0);
    }

    #[test]
    fn tab_ids_become_safe_labels() {
        assert_eq!(label_for("t12").unwrap(), "tab-t12");
        assert!(label_for("").is_err());
        assert!(label_for("main").is_ok()); // prefixed, so it can never collide with the "main" webview
        assert_eq!(label_for("main").unwrap(), "tab-main");
        assert!(label_for("a/b").is_err());
        assert!(label_for("a b").is_err());
        assert!(label_for(&"x".repeat(41)).is_err());
    }
}
