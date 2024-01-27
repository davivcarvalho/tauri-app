
#[tauri::command]
pub fn set_success_tray(app: tauri::AppHandle) {
    app.tray_handle()
        .set_icon(tauri::Icon::Raw(
            include_bytes!("../icons/access-point.png").to_vec(),
        ))
        .unwrap();
}

#[tauri::command]
pub fn set_fail_tray(app: tauri::AppHandle) {
    app.tray_handle()
        .set_icon(tauri::Icon::Raw(
            include_bytes!("../icons/access-point-off.png").to_vec(),
        ))
        .unwrap();
}

