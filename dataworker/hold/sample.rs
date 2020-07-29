// in `src/sample.rs`

use argh::FromArgs;
use crate::utils;
use futures::executor::block_on;


#[derive(FromArgs)]
/// Run sample code
#[argh(subcommand, name = "sample")]
pub struct Sample {}


impl Sample {
    pub async fn run(self) -> Result<(), utils::BoxError> {
        println!("Getting the fetcher");
        let fetcher = crate::fetcher::Fetcher::new();
        use std::fs::File;

        let json_path = "https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv";
        let csv_path = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/data-by-modzcta.csv";

        let stream = fetcher.get_stream(csv_path).await?;

        // let e = std::fs::read_to_string("cities.json")?;
        crate::ALLOCATOR.set_active(true);
        let data = crate::parser::Parser::read_csv(&stream)?;
        crate::ALLOCATOR.set_active(false);


        Ok(())
    }
}
