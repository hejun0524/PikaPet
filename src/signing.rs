// Marketplace installs are verified against this embedded public key before
// any zip is unpacked; the matching private key never ships with the app —
// it's generated once via `cargo run --bin sign-extension -- keygen` and
// kept offline by whoever publishes the registry.
//
// Encoding: sha256 as lowercase hex, signature as standard base64. The one
// invariant the signing CLI and this verifier must agree on exactly: the
// signature is computed over the *32-byte sha256 digest*, not the raw zip
// bytes — sign once you already have the digest in hand, so neither side
// needs to keep the whole zip around for the signing step itself. A
// mismatch here silently breaks every marketplace install (see the
// round-trip test below).

use base64::Engine;
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use sha2::{Digest, Sha256};

/// Placeholder — replaced with the real public key bytes printed by
/// `sign-extension keygen` once a keypair actually exists.
pub const PUBLIC_KEY: [u8; 32] = [109, 158, 102, 69, 217, 157, 210, 109, 17, 123, 72, 237, 237, 119, 87, 13, 223, 119, 247, 245, 163, 228, 155, 69, 150, 196, 1, 218, 238, 99, 230, 219];

pub fn sha256_hex(bytes: &[u8]) -> String {
    hex::encode(Sha256::digest(bytes))
}

/// Hashes `zip_bytes` and signs the digest with `signing_key`, returning
/// `(sha256_hex, signature_base64)` in exactly the shape a registry.json
/// entry expects. `sign-extension sign` and this module's own tests both
/// go through this one function — the encoding convention can't drift
/// between the CLI and the verifier if there's only one implementation.
pub fn sign(zip_bytes: &[u8], signing_key: &SigningKey) -> (String, String) {
    let digest = Sha256::digest(zip_bytes);
    let sig = signing_key.sign(&digest);
    (
        hex::encode(digest),
        base64::engine::general_purpose::STANDARD.encode(sig.to_bytes()),
    )
}

/// Verifies `zip_bytes` against a registry entry's `{sha256, signature}`
/// pair, against the app's embedded `PUBLIC_KEY`.
pub fn verify(zip_bytes: &[u8], sha256_hex_expected: &str, signature_b64: &str) -> Result<(), String> {
    verify_with_key(zip_bytes, sha256_hex_expected, signature_b64, &PUBLIC_KEY)
}

/// The actual check, taking the public key as a parameter so tests can
/// exercise it end-to-end against a throwaway keypair rather than the real
/// embedded one (whose matching private key deliberately never lives in
/// this repo).
fn verify_with_key(
    zip_bytes: &[u8],
    sha256_hex_expected: &str,
    signature_b64: &str,
    public_key: &[u8; 32],
) -> Result<(), String> {
    let digest = Sha256::digest(zip_bytes);
    let actual_hex = hex::encode(digest);
    if !actual_hex.eq_ignore_ascii_case(sha256_hex_expected.trim()) {
        return Err(format!(
            "sha256 mismatch: expected {}, got {actual_hex}",
            sha256_hex_expected.trim()
        ));
    }

    let sig_bytes = base64::engine::general_purpose::STANDARD
        .decode(signature_b64.trim())
        .map_err(|e| format!("invalid signature encoding: {e}"))?;
    let sig_bytes: [u8; 64] = sig_bytes
        .try_into()
        .map_err(|_| "signature must be 64 bytes".to_string())?;
    let signature = Signature::from_bytes(&sig_bytes);

    let key = VerifyingKey::from_bytes(public_key).map_err(|e| format!("bad public key: {e}"))?;
    key.verify(&digest, &signature)
        .map_err(|_| "signature verification failed".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    // A fixed, throwaway test keypair — never the app's real embedded key.
    fn test_keypair() -> SigningKey {
        SigningKey::from_bytes(&[7u8; 32])
    }

    #[test]
    fn round_trip_succeeds_against_matching_key() {
        let signing_key = test_keypair();
        let zip_bytes = b"pretend this is a zip file";
        let (sha256, signature) = sign(zip_bytes, &signing_key);

        assert!(verify_with_key(
            zip_bytes,
            &sha256,
            &signature,
            signing_key.verifying_key().as_bytes()
        )
        .is_ok());
    }

    #[test]
    fn tampered_bytes_fail_sha256_check() {
        let signing_key = test_keypair();
        let (sha256, signature) = sign(b"original bytes", &signing_key);

        let err = verify_with_key(
            b"tampered bytes",
            &sha256,
            &signature,
            signing_key.verifying_key().as_bytes(),
        )
        .unwrap_err();
        assert!(err.contains("mismatch"), "error was: {err}");
    }

    #[test]
    fn signature_from_wrong_key_is_rejected() {
        let signing_key = test_keypair();
        let other_key = SigningKey::from_bytes(&[9u8; 32]);
        let zip_bytes = b"pretend this is a zip file";
        let (sha256, signature) = sign(zip_bytes, &signing_key);

        // sha256 matches (same bytes), but the signature was produced by a
        // different key than the one we verify against.
        let err = verify_with_key(
            zip_bytes,
            &sha256,
            &signature,
            other_key.verifying_key().as_bytes(),
        )
        .unwrap_err();
        assert!(err.contains("verification failed"), "error was: {err}");
    }

    #[test]
    fn sha256_hex_matches_manual_digest() {
        assert_eq!(sha256_hex(b"abc"), hex::encode(Sha256::digest(b"abc")));
    }
}
