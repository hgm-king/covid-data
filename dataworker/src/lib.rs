pub mod fetcher;
// pub mod parser;
pub mod utils;

use wasm_bindgen_futures::JsFuture;
use futures::Future;
use std::rc::Rc;

use utils::BoxError;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Dataworker {
    fetcher: fetcher::Fetcher,
}

// #[wasm_bindgen]
// pub struct Chunk {
//     data: parser::DataType,
// }
//
// #[wasm_bindgen]
// impl Chunk {
//
// }


#[wasm_bindgen]
impl Dataworker {
    fn new() -> Self {
        Dataworker {
            fetcher: fetcher::Fetcher::new()
        }
    }

    pub async fn fetch(self: Rc<Self>, url: String) -> Result<JsValue, JsValue> {
        match self.fetcher.get(&url).await {
            Ok(text) => Ok(JsValue::from(text)),
            Err(_) => Err(JsValue::from("Fetch Error"))
        }
    }
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}
