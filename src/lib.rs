// A minimal library target whose only job is letting `src/bin/sign-extension.rs`
// share the exact same signing/verification code as the main app (`src/main.rs`,
// via `src/extensions/mod.rs`'s `pub use mypetgame::signing;`) — the CLI and the
// app's verifier must never drift into two independently-typed implementations
// of the same crypto contract.
pub mod signing;
