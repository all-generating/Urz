use serde::{Deserialize, Serialize};

/// Request data for password generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub password: String,
    pub salt: String,
    pub length: usize,
    pub use_symbols: bool,
}

/// Response with generated password
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub password: String,
}
