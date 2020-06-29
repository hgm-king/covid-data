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
    coefficient: u32,
    text: String,
    filetype: Filetype,
    selected: usize,
    parsed_data: Vec<DataType>,
    data_count: usize,
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
            coefficient: 1,
            active_url: url,
            text: text,
            filetype,
            selected: 0,
            parsed_data: vec![parsed_data],
            data_count: 1,
        }
    }

    pub fn length(&self) -> usize {
        self.length
    }

    pub fn count(&self) -> usize {
        self.data_count
    }

    pub fn data(&self) -> *const u32 {
        self.data.as_ptr()
    }

    pub fn min(&self) -> u32 {
        match self.data.iter().min() {
            Some(n) => *n,
            None => 0,
        }
    }

    pub fn max(&self) -> u32 {
        match self.data.iter().max() {
            Some(n) => *n,
            None => 0,
        }
    }

    pub fn sum(&self) -> u32 {
        self.data.iter().fold(0, |sum, x| sum + x)
    }

    pub fn avg(&self) -> f32 {
        self.sum() as f32 / self.length() as f32
    }

    pub fn keys(&self) -> Result<JsValue, JsValue> {
        if let DataType::CsvStruct(csv) = &self.parsed_data[self.selected] {
            let keys: Vec<String> = csv[0].keys().map(|s| s.to_string()).collect();
            Ok(JsValue::from_serde(&keys).unwrap())
        } else {
            Err(JsValue::from_serde("We cannot do this").unwrap())
        }
    }

    pub fn transform(&self, value: u32) -> f32 {
        value as f32 / self.coefficient as f32
    }

    pub fn sort(&self, sort: Vec<u32>) -> Vec<u32> {
        sort
    }

    pub fn expose_key_int(&mut self, key: &str) -> *const u32 {
        if let DataType::CsvStruct(csv) = &self.parsed_data[self.selected] {
            self.coefficient = 1;
            let mut i = 0;
            let size = self.data.len() - 1;
            for record in csv {
                let value = record.get(key).unwrap().parse().unwrap();
                if i <= size {
                    self.data[i] = value;
                    i += 1;
                } else {
                    self.length += 1;
                    self.data.push(value);
                }
            }
        } else {
            // Destructure failed. Change to the failure case.
            println!("We could not turn this into an array!");
        }
        self.data.as_ptr()
    }

    pub fn expose_key_float(&mut self, key: &str) -> *const u32 {
        if let DataType::CsvStruct(csv) = &self.parsed_data[self.selected] {
            self.coefficient = 10;
            self.length = 0;

            let mut i = 0;
            let size = self.data.len() - 1;

            for record in csv {
                let value: f32 = record.get(key).unwrap().parse().unwrap();
                let value = (value * self.coefficient as f32) as u32;
                if i <= size {
                    self.data[i] = value;
                    i += 1;
                } else {
                    self.data.push(value);
                }
                self.length += 1;
            }
        } else {
            // Destructure failed. Change to the failure case.
            println!("We could not turn this into an array!");
        }
        self.data.as_ptr()
    }

    pub fn expose_key_string(&mut self, key: &str) -> *const u32 {
        let mut data: Vec<u32> = vec![];
        let mut count = 0;

        if let DataType::CsvStruct(csv) = &self.parsed_data[self.selected] {
            for record in csv {
                let value = record.get(key).unwrap();
                count += value.len();
                for byte in value.bytes() {
                    data.push(byte as u32);
                }
                data.push(0);
            }
        } else {
            // Destructure failed. Change to the failure case.
            println!("We could not turn this into an array!");
        }
        self.length = count;
        self.data = data;
        self.data.as_ptr()
    }

    fn shift(&mut self, new_data: DataType) -> () {
        self.parsed_data.push(new_data);
        self.data_count += 1;
    }

    // pub fn reset(&mut self) -> () {
    //     for num in &mut self.data { *num *= 2 }
    // }

    pub fn to_object(&self) -> Result<JsValue, JsValue> {
        Ok(JsValue::from_serde(&self.parsed_data[self.selected]).unwrap())
    }

    pub fn select(&mut self, index: usize ) -> () {
        self.selected = index;
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

    pub async fn append(url: String, filetype: Filetype, mut chunk: Chunk) -> Result<Chunk, JsValue> {
        let res = reqwest::Client::new()
            .get(&url)
            .send()
            .await?;

        let text = res.text().await?;

        let parsed_data = read(&text, &filetype).unwrap();
        chunk.shift(parsed_data);

        Ok(chunk)
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

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
