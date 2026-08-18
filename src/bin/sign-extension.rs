// Signs extension zips for the marketplace registry. Not shipped as part of
// the app itself — this is a maintainer-only tool:
//
//   cargo run --bin sign-extension -- keygen
//   cargo run --bin sign-extension -- sign path/to/thing.zip
//
// `keygen` generates a fresh ed25519 keypair, writes the private half to a
// local file (default `extension-signing-key.b64` — keep this offline,
// never commit it), and prints the public half as a Rust array literal to
// paste into `src/signing.rs`'s `PUBLIC_KEY` constant.
//
// `sign` hashes a zip and signs the digest with that private key, printing
// the `sha256`/`signature` values a `registry.json` entry needs. It goes
// through `mypetgame::signing::sign`, the exact same function this app's
// own installer uses to verify — see that module's doc comment for why
// that sharing matters.

use base64::Engine;
use ed25519_dalek::SigningKey;
use mypetgame::signing;
use std::process::exit;

const DEFAULT_KEY_FILE: &str = "extension-signing-key.b64";

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        Some("keygen") => keygen(&args[1..]),
        Some("sign") => sign_cmd(&args[1..]),
        _ => {
            eprintln!(
                "usage:\n  sign-extension keygen [--out <key-file>]\n  sign-extension sign <zip-path> [--key <key-file>]"
            );
            exit(2);
        }
    }
}

fn flag_value(args: &[String], flag: &str, default: &str) -> String {
    args.iter()
        .position(|a| a == flag)
        .and_then(|i| args.get(i + 1))
        .cloned()
        .unwrap_or_else(|| default.to_string())
}

fn keygen(args: &[String]) {
    let out = flag_value(args, "--out", DEFAULT_KEY_FILE);
    if std::path::Path::new(&out).exists() {
        eprintln!("refusing to overwrite existing key file: {out}");
        exit(1);
    }

    let signing_key = SigningKey::generate(&mut rand::rngs::OsRng);
    let private_b64 = base64::engine::general_purpose::STANDARD.encode(signing_key.to_bytes());
    if let Err(e) = std::fs::write(&out, &private_b64) {
        eprintln!("failed to write {out}: {e}");
        exit(1);
    }

    let public_bytes = signing_key.verifying_key().to_bytes();
    let literal = public_bytes
        .iter()
        .map(u8::to_string)
        .collect::<Vec<_>>()
        .join(", ");
    println!("Wrote private key to {out} — keep this file offline, never commit it.");
    println!();
    println!("Paste this into src/signing.rs's PUBLIC_KEY constant:");
    println!("pub const PUBLIC_KEY: [u8; 32] = [{literal}];");
}

fn sign_cmd(args: &[String]) {
    let Some(zip_path) = args.first() else {
        eprintln!("usage: sign-extension sign <zip-path> [--key <key-file>]");
        exit(2);
    };
    let key_file = flag_value(args, "--key", DEFAULT_KEY_FILE);

    let zip_bytes = std::fs::read(zip_path).unwrap_or_else(|e| {
        eprintln!("failed to read {zip_path}: {e}");
        exit(1);
    });
    let private_b64 = std::fs::read_to_string(&key_file).unwrap_or_else(|e| {
        eprintln!("failed to read key file {key_file}: {e}");
        exit(1);
    });
    let private_bytes = base64::engine::general_purpose::STANDARD
        .decode(private_b64.trim())
        .unwrap_or_else(|e| {
            eprintln!("bad key file {key_file}: {e}");
            exit(1);
        });
    let private_bytes: [u8; 32] = private_bytes.try_into().unwrap_or_else(|_| {
        eprintln!("bad key file {key_file}: expected 32 bytes");
        exit(1);
    });
    let signing_key = SigningKey::from_bytes(&private_bytes);

    let (sha256, signature) = signing::sign(&zip_bytes, &signing_key);
    println!("sha256:    {sha256}");
    println!("signature: {signature}");
}
