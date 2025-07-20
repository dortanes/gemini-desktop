<div align="center">

# 🤖 Gemini AI Desktop

**Desktop application for Google's Gemini AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![GitHub release](https://img.shields.io/github/release/dortanes/gemini-desktop.svg)](https://github.com/dortanes/gemini-desktop/releases) [![Downloads](https://img.shields.io/github/downloads/dortanes/gemini-desktop/total.svg)](https://github.com/dortanes/gemini-desktop/releases)

---

*Transform your Gemini AI experience with a desktop application that brings Google's powerful AI assistant directly to your desktop with enhanced features and seamless integration.*

</div>

## ⚠️ Disclaimer

**This project is not affiliated with, endorsed by, or sponsored by Google LLC or the Gemini AI team.** This is an independent, open-source desktop application that provides a wrapper interface for accessing Google's Gemini AI service through their official website. 

- **Gemini AI** is a trademark of Google LLC
- This application simply loads the official Gemini website (gemini.google.com) in a desktop wrapper
- All AI functionality is provided by Google's servers
- No data is collected or stored by this application
- Users must comply with Google's Terms of Service when using Gemini AI

## ✨ Features

- **🖥️ Native Desktop Experience** - Full-featured Electron app with native OS integration
- **🔄 Dual Window Modes** - Switch between full window and drawer
- **⌨️ Global Hotkeys** - Customizable keyboard shortcuts for instant access
- **🎨 System Tray Integration** - Quick access from your system tray

## 📥 Installation

### 📦 Pre-built Releases (Recommended)

Download the latest release for your platform:

| Platform | Download | Notes |
|----------|----------|-------|
| 🪟 **Windows** | [Download .exe](https://github.com/dortanes/gemini-desktop/releases/latest) | NSIS installer with auto-updater |
| 🍎 **macOS** | 🚧 Coming Soon | Universal binary (Intel + Apple Silicon) |
| 🐧 **Linux** | 🚧 Coming Soon | AppImage, .deb, and .rpm packages |

> **Note:** Currently, only Windows builds are available. macOS and Linux builds are coming soon! 🚀

### 🔧 Installation Instructions

#### Windows
1. Download the installer
2. Run the installer
3. Follow the setup wizard
4. Launch from Start Menu or Desktop shortcut

#### macOS & Linux
These platforms are currently under development. You can still run the app from source code (see [Development](#-development) section below) or wait for the official releases coming soon!

## 🚀 Quick Start

1. **Launch the Application**
   - Use your desktop shortcut or application menu
   - Or use the system tray icon for quick access

2. **Set Up Hotkeys** (Optional)
   - Open Settings from the tray menu
   - Configure global hotkeys for drawer and main window
   - Save your preferences

3. **Start Using Gemini AI**
   - The app loads Google's Gemini official website (gemini.google.com)
   - Use drawer for quick queries
   - Switch to full mode for extended conversations
   - You can also open it in full screen mode (click F11)

## 🛠️ Development

### 📋 Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **yarn**
- **Git**

### 🔧 Setup

```bash
# Clone the repository
git clone https://github.com/dortanes/gemini-desktop.git
cd gemini-desktop

# Install dependencies
yarn install

# Start development server
yarn start
```

### 🏗️ Building

```bash
# Build for Windows specifically
yarn build-win

# Build for development testing
yarn dist
```

> **Note:** macOS and Linux build scripts are temporarily disabled but will be re-enabled soon. For now, focus is on Windows builds for better testing and stability.

### 🧪 Testing

```bash
# Run in development mode
yarn start

# Build and test locally
yarn dist
```

## ⚙️ Configuration

### 🎛️ Application Settings

The app stores settings in your system's user data directory:
- **Windows**: `%APPDATA%/gemini-desktop/`
- **macOS**: `~/Library/Application Support/gemini-desktop/`
- **Linux**: `~/.config/gemini-desktop/`

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by [dortanes](https://github.com/dortanes)**

⭐ **Star this repo if you find it useful!** ⭐

</div>