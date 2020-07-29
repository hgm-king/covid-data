// pub mod fetcher;
// pub mod parser;
// pub mod utils;
// pub mod alloc;
// pub mod sample;
// pub mod report;
//
// use argh::FromArgs;
// use futures::executor::block_on;
// use tokio::runtime::Runtime;
//
// #[global_allocator]
// pub static ALLOCATOR: alloc::Tracing = alloc::Tracing::new();
//
// #[derive(FromArgs)]
// /// Small string demo
// struct Args {
//     #[argh(subcommand)]
//     subcommand: Subcommand,
// }
//
// #[derive(FromArgs)]
// #[argh(subcommand)]
// enum Subcommand {
//     Sample(sample::Sample),
//     Report(report::Report),
// }
//
// impl Subcommand {
//     async fn run(self) -> Result<(), utils::BoxError> {
//         match self {
//             Subcommand::Sample(x) => x.run().await?,
//             Subcommand::Report(x) => x.run().await?
//         }
//
//         Ok(())
//     }
// }
//
// fn main() -> Result<(), utils::BoxError> {
//     let fut = argh::from_env::<Args>().subcommand.run();
//     Runtime::new()
//         .expect("Failed to create Tokio runtime")
//         .block_on(fut);
//
//     Ok(())
// }
