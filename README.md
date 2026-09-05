# Urz - Minimalistic Password Generator

**Version:** 1.0.0  
**License:** MIT

Urz is a minimalistic cross-platform application for dynamic generation of pseudorandom passwords.

## Features

- Two input fields: "Your password" and "Salt"
- Password length slider (6-64 characters)
- Toggle for special symbols (on/off)
- Result field with show/hide functionality
- Copy to clipboard button
- Deterministic generation: same input = same output
- No data storage, no unnecessary features

## Tech Stack

- **Backend:** Rust + Tauri v2
- **UI:** React + TypeScript + Vite (WebView)
- **Platforms:** Desktop (Linux, Windows, macOS) + Mobile (Android, iOS)

## Build Instructions

### Ubuntu 24.04 LTS

#### Install Dependencies

```bash
sudo apt update
sudo apt install -y libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env
```

#### Build

```bash
cd frontend && npm install && cd ..
cargo tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

---

### Windows 11

#### Install Dependencies

1. **Rust**: Download and install from [rustup.rs](https://rustup.rs)
2. **Node.js**: Download and install from [nodejs.org](https://nodejs.org) (LTS version recommended)
3. **Visual Studio Build Tools**:
   - Download from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/downloads/)
   - Install "Desktop development with C++" workload
   - Ensure "MSVC v143 - VS 2022 C++ x64/x86 build tools" is selected

#### Build

Open PowerShell or Command Prompt as Administrator:

```powershell
cd frontend
npm install
cd ..
cargo tauri build
```

The built application will be in `src-tauri\target\release\bundle\`.

---

### macOS

#### Install Dependencies

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install Node.js (via Homebrew or from nodejs.org)
brew install node
```

#### Build

```bash
cd frontend && npm install && cd ..
cargo tauri build
```

---

### Android

#### Prerequisites

- Android SDK with API level 33+
- Android NDK
- Java Development Kit (JDK) 17+

Set environment variables:
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

#### Build APK

```bash
cd frontend && npm install && cd ..
cargo tauri android build --apk
```

APK will be in `src-tauri/target/android/app/build/outputs/apk/`.

---

### iOS

#### Prerequisites

- macOS with Xcode 15+
- iOS SDK

#### Build

```bash
cd frontend && npm install && cd ..
cargo tauri ios build
```

This will generate an Xcode project that can be used to create IPA files.

---

## Getting Started

### Prerequisites

- Rust (latest stable)
- Node.js 18+ (for frontend)
- For mobile: Android SDK / Xcode

### Installation

```bash
# Install frontend dependencies
cd frontend
npm install

# Return to root
cd ..
```

### Development

```bash
# Desktop (runs both frontend dev server and Tauri app)
cargo tauri dev

# Mobile (Android)
cargo tauri android dev

# Mobile (iOS)
cargo tauri ios dev
```

### Build

```bash
# Desktop
cargo tauri build

# Android APK
cargo tauri android build --apk

# iOS
cargo tauri ios build
```

## Algorithm

The password generator uses a deterministic approach:

1. **Seed Derivation**: HMAC-SHA256 is used to derive a cryptographic seed from the user's password + salt combination
2. **Password Generation**: ChaCha20 CSPRNG (seeded with the derived seed) generates reproducible random selections from the character set
3. **Character Sets**: 
   - Alphanumeric only: `A-Za-z0-9` (62 chars)
   - With symbols: `A-Za-z0-9!@#$%^&*()_+-=[]{}|;:,.<>?` (89 chars)

This ensures:
- Same input always produces the same output
- Cryptographically secure randomness
- Fast performance on mobile devices

## Configuration

### Password Length
- Minimum: 6 characters
- Maximum: 64 characters
- Default: 16 characters

### Character Options
- **Symbols OFF**: Only letters and digits
- **Symbols ON**: Letters, digits, and special ASCII symbols

## Security Notes

- No data is stored locally or transmitted
- All computation happens client-side
- The algorithm is deterministic by design for reproducibility
- Uses cryptographically secure primitives (HMAC-SHA256, ChaCha20)

## License

MIT
