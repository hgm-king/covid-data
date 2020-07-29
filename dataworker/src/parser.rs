use crate::utils::BoxError;
use smol_str::SmolStr;
use std::collections::HashMap;
use serde::Deserialize;

pub type Record = HashMap<SmolStr, SmolStr>;
pub type CsvData = Vec<Record>;

#[derive(Debug,Deserialize)]
pub enum JsonData {
    String(SmolStr),
    Array(Vec<JsonData>),
    Object(HashMap<SmolStr, JsonData>),
}

pub enum DataType {
    Json(JsonData),
    Csv(CsvData)
}

pub enum FileType {
    JSON,
    CSV
}

pub struct Parser {}


impl Parser {
    pub fn read(input: &str, filetype: FileType) -> Result<DataType, BoxError> {
        match filetype {
            FileType::CSV => Parser::read_csv(input),
            FileType::JSON => Parser::read_json(input)
        }
    }

    pub fn read_json(input: &str) -> Result<JsonData, BoxError> {
        let v: JsonData = serde_json::from_str(&input)?;
        Ok(v)
    }

    pub fn read_csv(input: &str) -> Result<CsvData, BoxError> {
        let mut rdr = csv::Reader::from_reader(input.as_bytes());
        let mut data: CsvData = vec![];
        for result in rdr.deserialize() {
            let record: Record = result?;
            data.push(record);
        }
        Ok(data)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_csv() {
        let c = "year,make,model,description
1948,Porsche,356,Luxury sports car
1967,Ford,Mustang fastback 1967,American car";

        if let Ok(parsed) = Parser::read_csv(c) {
            let record = &parsed[0];
            assert_eq!(record.get(&SmolStr::from("year")), Some(&SmolStr::from("1948")));
        } else {
            assert!(false, "did not succeed parsing the valid csv");
        }
    }

    #[test]
    fn test_parse_csv_panic() {
        let c = "year,make,model,description\n1948,";
        match Parser::read_csv(c) {
            Ok(_) => assert!(false, "somehow parsed an invalid csv"),
            Err(_) => assert!(true),
        }
    }

    #[test]
    fn test_parse_json() {
        let j = "{ \"name\":\"John\", \"age\":30, \"car\":null }";
        match Parser::read_json(j) {
            Ok(_) => assert!(true),
            Err(_) => assert!(false, "somehow failed to parse valid json"),
        }
    }

    #[test]
    fn test_parse_json_panic() {
        let j = "{ \"name\":\"John\", \"age\":30, \"car\":null ";
        match Parser::read_json(j) {
            Ok(_) => assert!(false, "somehow parsed an invalid json"),
            Err(_) => assert!(true),
        }
    }
}
