mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use serde::{Deserialize, Serialize};
use serde_json::{Value};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub async fn run() -> Result<JsValue, JsValue> {
    let res = reqwest::Client::new()
        .get("https://api.github.com/repos/rustwasm/wasm-bindgen/branches/master")
        .send()
        .await?;

    let text = res.text().await?;
    // Parse the string of data into serde_json::Value.
    let v: Value = serde_json::from_str(&text).unwrap();

    Ok(JsValue::from_serde(&v).unwrap())
}
