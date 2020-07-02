steps to run
- in dataworker/pkg run `npm link`
- in www run `npm link dataworker`
- may need sudo for both of those
- in www run `npm install`
- in www run `npm run serve`

to compile the wasm
- you need rust from https://rustup.rs/
- run `cargo install wasm-bindgen`
- run `cargo install wasm-pack`
- run `wasm-pack build`
