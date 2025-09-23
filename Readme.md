# ShellSync

**A Collaborative Playground of Terminals**

ShellSync is a modern, open-source platform that enables real-time, collaborative terminal sessions. Designed for developers, educators, DevOps, and remote teams, ShellSync transforms your command-line workflow into an interactive, multi-user environment. Whether you're pair programming, conducting live demos, teaching shell skills, or remotely troubleshooting systems, ShellSync brings the power of collaboration directly to your terminal.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)
- [Authors](#authors)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Features

- **Live Collaborative Terminals:** Work together in real-time, sharing a single terminal instance with multiple users.
- **Multi-Platform Support:** Seamlessly supports Linux, macOS, and Windows environments (with PowerShell/Shell support).
- **Role-Based Access:** Assign roles like owner, collaborator (read/write), or viewer (read-only) for granular control.
- **Session Recording & Playback:** Automatically record sessions for later review, sharing, or auditing.
- **Secure & Private:** TLS encryption and optional authentication ensure that your data and commands stay private.
- **Web & Native Interfaces:** Access sessions via a modern web UI (built with TypeScript and CSS), or via native terminal clients.
- **Command History & Replay:** Maintain a full log of commands run in each session, with replay capabilities.
- **Extensible API:** Easily integrate with CI/CD, bots, or monitoring tools thanks to a structured API.
- **Customizable Themes:** Tweak the terminal look-and-feel with CSS for dark/light mode or personalized themes.
- **Resource Efficient:** Backend powered by Go for high concurrency and low resource footprint.

---

## Architecture

ShellSync is built as a modular system:

- **Frontend:** Written in TypeScript and CSS, providing a responsive and interactive web-based terminal emulator.
- **Backend:** Implemented in Go, responsible for session management, security, and process control.
- **Shell Adapters:** Supports various shells (bash, zsh, sh, PowerShell) and can be extended to others.
- **Communication:** Uses secure websockets for fast, real-time data exchange between users and servers.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Go](https://golang.org/) (v1.18+ recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://npmjs.com/)
- Modern web browser (for client)
- (Optional) TLS certificate for production deployment

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Ayush-Vish/ShellSync.git
   cd ShellSync
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd client
   yarn install     # or npm install
   ```

3. **Build the Frontend**
   ```bash
   yarn build       # or npm run build
   ```

4. **Build the Backend**
   ```bash
   cd ../server
   go build -o shellsync-server main.go
   ```

5. **Run the Server**
   ```bash
   ./shellsync-server
   ```

6. **Access the App**
   - Open your browser at `http://localhost:PORT` (default port as per config or server output).

---

## Usage

- **Start a Session:** After launching the backend, navigate to the web UI, and create a new collaborative terminal session.
- **Invite Collaborators:** Share your session invite link or access code. You can control permissions (view/edit).
- **Interact:** All participants see a synchronized terminal. Commands, outputs, and even cursor positions are shared live.
- **Record & Replay:** Use the session recording feature to save and play back terminal activity for auditing or teaching.

---

## Configuration

ShellSync supports a variety of configuration options via environment variables or config files:

- `PORT`: Set the listening port for the backend server.
- `TLS_CERT`, `TLS_KEY`: Paths to TLS certificate and key for HTTPS.
- `SESSION_TIMEOUT`: Auto-terminate inactive sessions after X minutes.
- `AUTH_MODE`: Set authentication mode (none, password, OAuth, etc.).
- `ALLOWED_ORIGINS`: Restrict which web origins can connect.

See `config.example.json` or [docs/CONFIG.md](docs/CONFIG.md) for all available options.

---

## Contributing

We ❤️ contributions! To get involved:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/your-feature`.
3. Commit your changes: `git commit -am 'Add a cool feature'`.
4. Push to your fork: `git push origin feature/your-feature`.
5. Open a Pull Request describing your change.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for style guidelines, documentation, and more.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Authors

- [Ayush Vish](https://github.com/Ayush-Vish) (Maintainer)
- [List of Contributors](https://github.com/Ayush-Vish/ShellSync/graphs/contributors)

---

## Acknowledgements

- Inspired by collaborative terminal tools like [tmate](https://tmate.io/) and [gotty](https://github.com/yudai/gotty)
- Thanks to all open source contributors, testers, and users!

---

