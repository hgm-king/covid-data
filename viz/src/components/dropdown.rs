use yew::prelude::*;

pub struct Dropdown {
    link: ComponentLink<Self>,
    selected: String,
    options: Vec<String>,
    onsignal: Callback<String>,
}

pub enum Msg {
    OptionSelected(String),
}

#[derive(Clone, PartialEq, Properties)]
pub struct Props {
    #[prop_or_default]
    pub options: Vec<String>,
    pub onsignal: Callback<String>,
}

impl Component for Dropdown {
    type Message = Msg;
    type Properties = Props;

    fn create(props: Self::Properties, link: ComponentLink<Self>) -> Self {
        Dropdown {
            link,
            selected: props.options[0].clone(),
            options: props.options,
            onsignal: props.onsignal,
        }
    }

    fn update(&mut self, msg: Self::Message) -> ShouldRender {
        match msg {
            Msg::OptionSelected(option) => {
                self.onsignal.emit(option.to_string());
                self.selected = option
            }
        }
        true
    }

    fn change(&mut self, props: Self::Properties) -> ShouldRender {
        self.options = props.options;
        self.onsignal = props.onsignal;
        true
    }

    fn view(&self) -> Html {
        html! {
            <select class="dropdown" onchange=self.link.callback(move |option| {
                match option {
                    ChangeData::Select(value) => Msg::OptionSelected(value.value()),
                    _ => Msg::OptionSelected(String::from("error"))
                }
            }) >
                { for self.options.iter().map(|option| self.view_option(option.to_string(), option.to_string())) }
            </select>
        }
    }
}

impl Dropdown {
    fn view_option(&self, k: String, v: String) -> Html {
        // let selected_flag = if v == self.selected { "selected" } else { "" };
        html! {
            <option value={v}>{k}</option>
        }
    }
}
