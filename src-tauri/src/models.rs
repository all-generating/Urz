use serde::{Deserialize, Serialize};

/// Response with generated password
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub password: String,
}
