#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct UploadBlobPayload {
    upload_url: String,
    client_token: String,
    content_type: String,
    access: String,
    api_version: String,
    timeout_ms: Option<u64>,
    bytes: Vec<u8>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CacheImagePayload {
    item_id: String,
    download_url: String,
    token: String,
    file_name: String,
    mime_type: String,
    timeout_ms: Option<u64>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CachedImageRecord {
    item_id: String,
    saved_path: String,
    downloaded_at: String,
    mime_type: String,
    original_name: String,
}

fn current_timestamp() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn app_image_cache_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|error| format!("Failed to locate app cache dir: {error}"))?;

    Ok(cache_dir.join("timeline-images"))
}

fn cache_index_path(root: &Path) -> PathBuf {
    root.join("index.json")
}

fn ensure_cache_dir(root: &Path) -> Result<(), String> {
    fs::create_dir_all(root).map_err(|error| format!("Failed to create cache directory: {error}"))
}

fn read_cache_index(root: &Path) -> Result<HashMap<String, CachedImageRecord>, String> {
    let index_path = cache_index_path(root);
    if !index_path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(&index_path)
        .map_err(|error| format!("Failed to read cache index: {error}"))?;

    serde_json::from_str::<HashMap<String, CachedImageRecord>>(&content)
        .map_err(|error| format!("Failed to parse cache index: {error}"))
}

fn write_cache_index(root: &Path, records: &HashMap<String, CachedImageRecord>) -> Result<(), String> {
    let index_path = cache_index_path(root);
    let content = serde_json::to_string_pretty(records)
        .map_err(|error| format!("Failed to serialize cache index: {error}"))?;

    fs::write(index_path, content).map_err(|error| format!("Failed to write cache index: {error}"))
}

fn detect_extension(file_name: &str, mime_type: &str) -> String {
    if let Some(extension) = Path::new(file_name).extension().and_then(|value| value.to_str()) {
        if !extension.is_empty() {
            return format!(".{extension}");
        }
    }

    match mime_type {
        "image/png" => ".png".to_string(),
        "image/jpeg" => ".jpg".to_string(),
        "image/webp" => ".webp".to_string(),
        "image/gif" => ".gif".to_string(),
        "image/svg+xml" => ".svg".to_string(),
        "image/bmp" => ".bmp".to_string(),
        "image/x-icon" => ".ico".to_string(),
        _ => String::new(),
    }
}

#[tauri::command]
async fn upload_blob(payload: UploadBlobPayload) -> Result<(), String> {
    let timeout = Duration::from_millis(payload.timeout_ms.unwrap_or(30_000));
    let content_length = payload.bytes.len();

    let client = reqwest::Client::builder()
        .timeout(timeout)
        .build()
        .map_err(|error| format!("Failed to create upload client: {error}"))?;

    let response = client
        .put(payload.upload_url)
        .header("authorization", format!("Bearer {}", payload.client_token))
        .header("x-api-version", payload.api_version)
        .header("x-content-length", content_length.to_string())
        .header("x-vercel-blob-access", payload.access)
        .header("x-content-type", payload.content_type)
        .header("content-type", "application/octet-stream")
        .body(payload.bytes)
        .send()
        .await
        .map_err(|error| format!("Native upload request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error response.".to_string());

        return Err(format!("Native upload failed with status {status}: {body}"));
    }

    Ok(())
}

#[tauri::command]
async fn cache_image_download(app: AppHandle, payload: CacheImagePayload) -> Result<CachedImageRecord, String> {
    let timeout = Duration::from_millis(payload.timeout_ms.unwrap_or(30_000));
    let client = reqwest::Client::builder()
        .timeout(timeout)
        .build()
        .map_err(|error| format!("Failed to create download client: {error}"))?;

    let response = client
        .get(&payload.download_url)
        .header("authorization", format!("Bearer {}", payload.token))
        .send()
        .await
        .map_err(|error| format!("Image download request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "Unable to read error response.".to_string());

        return Err(format!("Image download failed with status {status}: {body}"));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read image bytes: {error}"))?;

    let cache_dir = app_image_cache_dir(&app)?;
    ensure_cache_dir(&cache_dir)?;

    let extension = detect_extension(&payload.file_name, &payload.mime_type);
    let file_path = cache_dir.join(format!("{}{}", payload.item_id, extension));

    fs::write(&file_path, &bytes).map_err(|error| format!("Failed to save image cache file: {error}"))?;

    let mut index = read_cache_index(&cache_dir)?;
    let record = CachedImageRecord {
        item_id: payload.item_id.clone(),
        saved_path: file_path.to_string_lossy().to_string(),
        downloaded_at: current_timestamp(),
        mime_type: payload.mime_type,
        original_name: payload.file_name,
    };

    index.insert(payload.item_id, record.clone());
    write_cache_index(&cache_dir, &index)?;

    Ok(record)
}

#[tauri::command]
fn list_cached_images(app: AppHandle) -> Result<Vec<CachedImageRecord>, String> {
    let cache_dir = app_image_cache_dir(&app)?;
    ensure_cache_dir(&cache_dir)?;

    let mut index = read_cache_index(&cache_dir)?;
    index.retain(|_, record| Path::new(&record.saved_path).exists());
    write_cache_index(&cache_dir, &index)?;

    Ok(index.into_values().collect())
}

#[tauri::command]
fn remove_cached_image(app: AppHandle, item_id: String) -> Result<(), String> {
    let cache_dir = app_image_cache_dir(&app)?;
    ensure_cache_dir(&cache_dir)?;

    let mut index = read_cache_index(&cache_dir)?;
    if let Some(record) = index.remove(&item_id) {
        if Path::new(&record.saved_path).exists() {
            fs::remove_file(&record.saved_path)
                .map_err(|error| format!("Failed to remove cached image file: {error}"))?;
        }
    }

    write_cache_index(&cache_dir, &index)?;
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            upload_blob,
            cache_image_download,
            list_cached_images,
            remove_cached_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
