mod utils;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use serde::{Deserialize, Serialize};
use serde_json::{Value};
use wasm_bindgen::prelude::*;
use std::error::Error;

use std::collections::HashMap;

type Record = HashMap<String, String>;

#[derive(Serialize)]
enum DataType {
    JsonStruct(Value),
    CsvStruct(Vec<Record>)
}

#[wasm_bindgen]
pub enum Filetype {
    CSV, JSON
}

#[wasm_bindgen]
pub struct Dataworker {
    width: u32,
    height: u32,
    data: Vec<u32>,
}

#[wasm_bindgen]
pub struct Chunk {
    width: u32,
    height: u32,
    data: Vec<u32>,
    active_url: String,
    text: String,
    filetype: Filetype
}

#[wasm_bindgen]
impl Chunk {
    pub fn new(url: String, text: String, filetype: Filetype) -> Self {
        let width = 64;
        let height = 64;

        let data = (0..width * height)
            .map(|i| i * 2)
            .collect();

        Chunk {
            width,
            height,
            data,
            active_url: url,
            text: text,
            filetype
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

    pub fn to_object(&self) -> Result<JsValue, JsValue> {
        let v = match self.filetype {
            Filetype::JSON => read_json(&self.text).unwrap(),
            Filetype::CSV => read_csv(&self.text).unwrap(),
        };

        Ok(JsValue::from_serde(&v).unwrap())
    }
}


#[wasm_bindgen]
impl Dataworker {
    pub async fn getData(url: String, filetype: Filetype) -> Result<Chunk, JsValue> {
        let res = reqwest::Client::new()
            .get(&url)
            .send()
            .await?;

        let text = res.text().await?;

        Ok(Chunk::new(
            url, text, filetype
        ))
    }
    //
}

fn read_json(input: &str) -> Result<DataType, Box<dyn Error>> {
    // Parse the string of data into serde_json::Value.
    let v: Value = serde_json::from_str(&input).unwrap();
    Ok(DataType::JsonStruct(v))
}

fn read_csv(input: &str) -> Result<DataType, Box<dyn Error>> {
    let mut rdr = csv::Reader::from_reader(input.as_bytes());
    let mut data: Vec<Record> = vec![];
    for result in rdr.deserialize() {
        let record: Record = result?;
        data.push(record);
    }
    Ok(DataType::CsvStruct(data))
}
