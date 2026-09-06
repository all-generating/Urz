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

    // If symbols are required but none were included, replace one character with a symbol
    if use_symbols {
        const SYMBOLS: &[u8] = b"!@#$%^&*()_+-=[]{}|;:,.<>?";
        let has_symbol = result.iter().any(|c| SYMBOLS.contains(&(*c as u8)));

        if !has_symbol && length > 0 {
            // Deterministically select position and symbol using the same RNG state
            let pos = (rng.next_u32() % length as u32) as usize;
            let sym_idx = (rng.next_u32() % SYMBOLS.len() as u32) as usize;
            result[pos] = SYMBOLS[sym_idx] as char;
        }
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

    #[test]
    fn test_symbols_guaranteed_when_enabled() {
        const SYMBOLS: &[u8] = b"!@#$%^&*()_+-=[]{}|;:,.<>?";

        // Test with various inputs that might not naturally produce symbols
        let test_cases = vec![
            ("short", "salt1", 6),
            ("test", "salt2", 8),
            ("password", "salt3", 10),
            ("a", "b", 6),
            ("xyz", "abc", 7),
        ];

        for (password, salt, length) in test_cases {
            let result = generate_password(password, salt, length, true);
            assert_eq!(result.len(), length, "Password length mismatch for input: {}, {}, {}", password, salt, length);

            // Verify at least one symbol is present
            let has_symbol = result.chars().any(|c| SYMBOLS.contains(&(c as u8)));
            assert!(has_symbol, "No symbol found in password '{}' for input: {}, {}, {}", result, password, salt, length);
        }
    }

    #[test]
    fn test_no_symbols_when_disabled() {
        const SYMBOLS: &[u8] = b"!@#$%^&*()_+-=[]{}|;:,.<>?";

        let result = generate_password("test", "salt", 16, false);
        assert_eq!(result.len(), 16);

        // Verify no symbols are present
        let has_symbol = result.chars().any(|c| SYMBOLS.contains(&(c as u8)));
        assert!(!has_symbol, "Symbols found in password when use_symbols is false");
    }

    #[test]
    fn test_deterministic_with_symbols() {
        // Verify that the same inputs always produce the same output even with symbols enabled
        let p1 = generate_password("test", "salt", 12, true);
        let p2 = generate_password("test", "salt", 12, true);
        assert_eq!(p1, p2);

        // Verify it contains a symbol
        const SYMBOLS: &[u8] = b"!@#$%^&*()_+-=[]{}|;:,.<>?";
        let has_symbol = p1.chars().any(|c| SYMBOLS.contains(&(c as u8)));
        assert!(has_symbol, "Deterministic password with symbols enabled should contain at least one symbol");
    }
}
