mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use serde::{Deserialize, Serialize};
use serde_json::{Value};
use wasm_bindgen::prelude::*;
// use std::error::Error;
//
// use std::collections::HashMap;
//
// type Record = HashMap<String, String>;
//
// #[wasm_bindgen]
// #[derive(Serialize)]
// pub struct Chunk {
//     url: String,
//     map: Vec<Record>,
// }
//
// #[wasm_bindgen]
// pub async fn run(url: String) -> Result<JsValue, JsValue> {
//     let res = reqwest::Client::new()
//         .get(&url)
//         .send()
//         .await?;
//
//     let text = res.text().await?;
//
//     let map = read(&text).unwrap();
//
//     let chunk = Chunk {
//         map,
//         url
//     };
//
//     Ok(JsValue::from_serde(&chunk).unwrap())
// }
//
// fn read(input: &str) -> Result<Vec<Record>, Box<dyn Error>> {
//     let mut rdr = csv::Reader::from_reader(input.as_bytes());
//     let mut data: Vec<Record> = vec![];
//     for result in rdr.deserialize() {
//         let record: Record = result?;
//         data.push(record);
//     }
//     Ok(data)
// }

#[wasm_bindgen]
pub struct Dataworker {
    width: u32,
    height: u32,
    data: Vec<u32>,
}


#[wasm_bindgen]
impl Dataworker {
    pub fn new() -> Dataworker {
        let width = 64;
        let height = 64;

        let data = (0..width * height)
            .map(|i| i * 2)
            .collect();

        Dataworker {
            width,
            height,
            data,
        }
    }

    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    pub fn data(&self) -> *const u32 {
        self.data.as_ptr()
    }

    pub fn reset(&mut self) -> () {
        for num in &mut self.data { *num *= 2 }
    }

    pub async fn getData(&self, url: &str) -> Result<JsValue, JsValue> {
        let res = reqwest::Client::new()
            .get(url)
            .send()
            .await?;

        let text = res.text().await?;
        // Parse the string of data into serde_json::Value.
        let v: Value = serde_json::from_str(&text).unwrap();

        Ok(JsValue::from_serde(&v).unwrap())
    }

}
