# Contributing to Gemini AI Desktop

Thank you for your interest in contributing to Gemini AI Desktop! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 🐛 Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/dortanes/gemini-desktop/issues) to avoid duplicates.

When creating a bug report, please include:

- **Clear title** describing the issue
- **Detailed description** of the problem
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **System information**:
  - OS and version
  - Node.js version
  - Electron version
  - App version

### 💡 Suggesting Features

Feature requests are welcome! Please:

1. Check [existing discussions](https://github.com/dortanes/gemini-desktop/discussions) first
2. Create a new discussion in the "Ideas" category
3. Provide a clear description of the feature
4. Explain the use case and benefits
5. Consider implementation complexity

### 🔧 Code Contributions

#### Getting Started

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/dortanes/gemini-desktop.git
   cd gemini-desktop
   ```
3. **Install** dependencies:
   ```bash
   yarn install
   ```
4. **Create** a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Workflow

1. **Make your changes** following the coding standards
2. **Test thoroughly**:
   ```bash
   yarn start  # Test in development
   yarn build  # Test build process
   ```
3. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add new feature description"
   ```
4. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create** a Pull Request

#### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Screenshots**: Include before/after screenshots for UI changes
- **Breaking Changes**: Clearly mark any breaking changes

Thank you for helping make Gemini AI Desktop better! 🚀