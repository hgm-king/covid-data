// use futures::StreamExt;

pub struct Fetcher {
    client: reqwest::Client,
}

impl Fetcher {
    pub fn new() -> Self {
        let client = reqwest::Client::new();

        Fetcher {
            client
        }
    }

    // the String here is heap allocated, which is great
    pub async fn get(&self, url: &str) -> Result<String, crate::utils::BoxError> {
        let text: String = self.client
            .get(url)
            .send()
            .await?
            .text()
            .await?;

        return Ok(text);
    }

    // pub async fn get_stream(&self, url: &str) -> Result<impl futures::Stream<Item = reqwest::Result<bytes::Bytes>>, crate::utils::BoxError> {
    //     let stream = self.client
    //         .get(url)
    //         .send()
    //         .await?
    //         .bytes_stream();
    //
    //     Ok(stream)
    // }
}

#[cfg(test)]
mod tests {
    use super::*;

    macro_rules! aw {
        ($e:expr) => {
            tokio_test::block_on($e)
        };
    }

    #[test]
    fn test_fetch() {
        let fetcher = Fetcher::new();

        match aw!(fetcher.get("http://example.com/")) {
            Ok(_) => assert!(true),
            Err(_) => assert!(false, "could not get the data"),
        }

        match aw!(fetcher.get("http://example.com/")) {
            Ok(_) => assert!(true),
            Err(_) => assert!(false, "could not get the data a second time"),
        }
    }

    #[test]
    fn test_bunky_fetch() {
        let fetcher = Fetcher::new();
        // we get an error for a bad response
        match aw!(fetcher.get("http://.com/")) {
            Ok(_) => assert!(false, "could get the data which is not expected"),
            Err(_) => assert!(true),
        }
    }

    // #[test]
    // fn test_stream_fetch() {
    //     let fetcher = Fetcher::new();
    //
    //     match aw!(fetcher.get_stream("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/data-by-modzcta.csv")) {
    //         Ok(mut stream) => {
    //             while let Some(chunk) = aw!(stream.next()) {
    //                 println!("Chunk: {:?}", chunk);
    //             }
    //         },
    //         Err(_) => assert!(false, "could not get the data"),
    //     }
    // }

}
