// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu};

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn set_success_tray(app: tauri::AppHandle) {
    app.tray_handle()
        .set_icon(tauri::Icon::Raw(
            include_bytes!("../icons/access-point.png").to_vec(),
        ))
        .unwrap();
}

#[tauri::command]
fn set_fail_tray(app: tauri::AppHandle) {
    app.tray_handle()
        .set_icon(tauri::Icon::Raw(
            include_bytes!("../icons/access-point-off.png").to_vec(),
        ))
        .unwrap();
}

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Fechar");
    let show = CustomMenuItem::new("show".to_string(), "Abrir");
    let tray_menu = SystemTrayMenu::new().add_item(show).add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .on_window_event(|event| match event.event() {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "show" => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![set_success_tray, set_fail_tray])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
