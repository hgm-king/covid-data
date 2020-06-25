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
    length: usize,
    data: Vec<u32>,
    active_url: String,
    text: String,
    filetype: Filetype,
    parsed_data: DataType,
}

#[wasm_bindgen]
impl Chunk {
    pub fn new(url: String, text: String, filetype: Filetype) -> Self {

        let data = (64..128)
            .map(|i: u32| i)
            .collect();

        let parsed_data = read(&text, &filetype).unwrap();
        let length = 64;

        Chunk {
            length,
            data,
            active_url: url,
            text: text,
            filetype,
            parsed_data
        }
    }

    pub fn length(&self) -> usize {
        self.length
    }

    pub fn data(&self) -> *const u32 {
        self.data.as_ptr()
    }

    pub fn expose_key(&mut self, key: &str) -> *const u32 {
        let mut data: Vec<u32> = vec![];
        let mut count = 0;

        if let DataType::CsvStruct(csv) = &self.parsed_data {
            for record in csv {
                let value = record.get(key).unwrap();
                count += value.len();
                for byte in value.to_string().bytes() {
                    data.push(byte as u32);
                }
            }
        } else {
            // Destructure failed. Change to the failure case.
            println!("We could not turn this into an array!");
        }
        self.length = count;
        self.data = data;
        self.data.as_ptr()
    }

    // pub fn reset(&mut self) -> () {
    //     for num in &mut self.data { *num *= 2 }
    // }

    pub fn to_object(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_serde(&self.parsed_data).unwrap())
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
}

fn read(input: &str, filetype: &Filetype) -> Result<DataType, Box<dyn Error>> {
    match *filetype {
        Filetype::JSON => read_json(input),
        Filetype::CSV => read_csv(input),
    }
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

// #[cfg(test)]
// mod tests {
//     #[test]
//     fn test_encoding() {
//         let data: Vec<String> = (60..128)
//             .map(|i: u8| {
//                 println!("{}", (i as char).to_string());
//                 (i as char).to_string()
//             })
//             .collect();
//     }
// }
