use hmac::{Hmac, Mac};
use rand_chacha::ChaCha20Rng;
use rand_core::{RngCore, SeedableRng};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// Character sets for password generation
const CHARSET_ALPHANUMERIC: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CHARSET_WITH_SYMBOLS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";

/// Generate a deterministic password using PBKDF2-like approach
/// 
/// Uses HMAC-SHA256 to derive a seed from password + salt,
/// then uses ChaCha20 RNG for reproducible random selection.
pub fn generate_password(password: &str, salt: &str, length: usize, use_symbols: bool) -> String {
    if length < 6 || length > 64 {
        return String::new();
    }

    let charset = if use_symbols {
        CHARSET_WITH_SYMBOLS
    } else {
        CHARSET_ALPHANUMERIC
    };

    // Derive seed using HMAC-SHA256
    let mut mac = HmacSha256::new_from_slice(salt.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(password.as_bytes());
    let result = mac.finalize();
    
    // Use first 32 bytes as seed for ChaCha20
    let seed_bytes = result.into_bytes();
    let mut seed = [0u8; 32];
    seed.copy_from_slice(&seed_bytes.as_slice()[..32]);

    // Create deterministic RNG
    let mut rng = ChaCha20Rng::from_seed(seed);

    // Generate password characters
    let mut result = Vec::with_capacity(length);
    for _ in 0..length {
        let idx = (rng.next_u32() % charset.len() as u32) as usize;
        result.push(charset[idx] as char);
    }

    result.iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic_generation() {
        let p1 = generate_password("test", "salt", 16, false);
        let p2 = generate_password("test", "salt", 16, false);
        assert_eq!(p1, p2);
    }

    #[test]
    fn test_different_inputs() {
        let p1 = generate_password("test1", "salt", 16, false);
        let p2 = generate_password("test2", "salt", 16, false);
        assert_ne!(p1, p2);
    }

    #[test]
    fn test_length_bounds() {
        assert_eq!(generate_password("test", "salt", 5, false).len(), 0);
        assert_eq!(generate_password("test", "salt", 65, false).len(), 0);
        assert_eq!(generate_password("test", "salt", 16, false).len(), 16);
    }
}
