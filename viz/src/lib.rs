#![recursion_limit="256"]

mod components;
pub mod fetcher;
// mod sub_pub;

use wasm_bindgen::prelude::*;
use yew::prelude::*;
struct Model {
    link: ComponentLink<Self>,
    value: i64,
    paths: Vec<String>,
    selected_path: String,
    url: String,
}

enum Msg {
    AddOne,
    DropdownSelect(String)
}

impl Component for Model {
    type Message = Msg;
    type Properties = ();
    fn create(_: Self::Properties, link: ComponentLink<Self>) -> Self {
        let paths = vec![
            String::from("boro.csv"),
            String::from("by-age.csv"),
            String::from("by-boro.csv"),
            String::from("by-poverty.csv"),
            String::from("by-sex.csv"),
            String::from("by-race.csv"),
            String::from("boro.csv"),
            String::from("boro.csv"),
        ];

        Self {
            link,
            value: 0,
            selected_path: paths[0].clone(),
            paths,
            url: String::from("https://raw.githubusercontent.com/nychealth/coronavirus-data/master/")
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::AddOne => self.value += 1,
            Msg::DropdownSelect(option) => {
                self.value += 1;
                self.selected_path = option
            },
        }
        true
    }

    fn change(&mut self, _props: Self::Properties) -> ShouldRender {
        // Should only return "true" if new properties are different to
        // previously received properties.
        // This component has no properties so we will always return "false".
        false
    }

    fn view(&self) -> Html {
        html! {
            <div>
                <button onclick=self.link.callback(|_| Msg::AddOne)>{ "+1" }</button>
                <p>{ self.value }</p>
                <p>{ &self.url }{ &self.selected_path }</p>
                <components::barrier::Barrier limit=10 onsignal=self.link.callback(|_| Msg::AddOne) />
                <components::dropdown::Dropdown options=&self.paths onsignal=self.link.callback(|option| Msg::DropdownSelect(option)) />
                <fetcher::Fetcher url={format!("{}{}", &self.url, &self.selected_path)}/>
            </div>
        }
    }
}

#[wasm_bindgen(start)]
pub fn run_app() {
    App::<Model>::new().mount_to_body();
}
