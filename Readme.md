---

# ShellSync

**ShellSync** is an open-source, real-time terminal collaboration tool that allows multiple users to share and interact with terminal sessions through an intuitive, infinite canvas interface. Whether you're pair programming, debugging remotely, or teaching command-line skills, ShellSync makes collaborative terminal workflows seamless and efficient.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Ayush-Vish/ShellSync)](https://github.com/Ayush-Vish/ShellSync)

## Table of Contents

* [Features](#features)
* [Architecture](#architecture)
* [Getting Started](#getting-started)

  * [Prerequisites](#prerequisites)
  * [Download the Agent](#download-the-agent)
  * [Running the Server](#running-the-server)
  * [Running the Frontend](#running-the-frontend)
  * [Running the Agent](#running-the-agent)
* [Usage](#usage)
* [Project Status](#project-status)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

## Features

* **Real-Time Collaboration**: Share terminal sessions instantly with team members via a unique URL, enabling multiple users to view and interact with the same terminal in real-time.
* **Infinite Canvas Interface**: Manage multiple terminal windows on a dynamic, draggable, and zoomable canvas, providing a flexible workspace for complex workflows.
* **Cross-Platform Support**: Lightweight agent binaries available for macOS (amd64, arm64), Linux (amd64, arm64), and Windows (amd64, arm64).
* **Low-Latency Terminal I/O**: Stream terminal input and output with minimal delay using WebSocket for frontend-backend communication and gRPC for backend-agent communication.
* **Production-Ready**: Stable implementation with a minimal client, server, and frontend, tested in production environments.

## Architecture

ShellSync is built with a modular architecture to ensure scalability and maintainability:

* **Frontend**: A React-based UI (`CanvasPage.tsx`, `useTerminalSocket.ts`) using WebSocket for real-time communication with the backend. The infinite canvas allows users to create and manage terminal windows.
* **Backend**: A Go server (`websocket/hub.go`, `service/service.go`) that handles WebSocket connections from the frontend and gRPC streams with the agent. It manages sessions and forwards encrypted terminal data.
* **Agent**: A Go-based client (`controller/controller.go`) that runs on the user’s machine, executes terminal commands via PTY, and communicates with the backend over gRPC.
* **Communication**:

  * **WebSocket**: Frontend ↔ Backend for real-time terminal input/output and control messages.
  * **gRPC**: Backend ↔ Agent for secure, bidirectional streaming of terminal data.

## Getting Started

### Prerequisites

* **Node.js** (v16 or higher) and **npm** for the frontend.
* **Go** (v1.18 or higher) for the backend and agent.
* **Git** to clone the repository.
* A modern web browser (e.g., Chrome, Firefox) for the frontend.

### Download the Agent

To make installation simple for all platforms, use the following commands:

#### macOS/Linux (auto-detect)

```bash
curl -fsSL https://raw.githubusercontent.com/Ayush-Vish/ShellSync/main/install-agent.sh | sh
```

#### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Ayush-Vish/ShellSync/main/install-agent.ps1 | iex
```

Alternatively, download manually from the [GitHub bin/ directory](https://github.com/Ayush-Vish/ShellSync/blob/main/bin/).

### Running the Server

1. Clone the repository:

   ```bash
   git clone https://github.com/Ayush-Vish/ShellSync.git
   cd ShellSync
   ```
2. Navigate to the backend:

   ```bash
   cd backend
   ```
3. Install dependencies:

   ```bash
   go mod tidy
   ```
4. Generate Protobuf code (if modified):

   ```bash
   protoc --go_out=. --go-grpc_out=. api/proto/shellsync.proto
   ```
5. Run the server:

   ```bash
   make run-server
   ```

   Server runs on `http://localhost:3000` (WebSocket: `ws://localhost:3000/ws`).

### Running the Frontend

1. Navigate to the frontend:

   ```bash
   cd frontend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start development server:

   ```bash
   npm start
   ```

   Available at `http://localhost:8080`.

### Running the Agent

1. Download the agent binary (see [Download the Agent](#download-the-agent)).
2. Run the agent:

   ```bash
   ./shellsync-agent
   ```
3. The agent connects to the backend and prints a session URL (e.g., `http://localhost:3000/ws/<session_id>?client_id=<client_id>`). Open in browser to join the session.

## Usage

1. **Start a Session**: Run `./shellsync-agent` and open the generated session URL.
2. **Create Terminals**: Use the UI canvas to spawn terminals.
3. **Collaborate**: Share the URL for real-time multi-user interaction.
4. **Interact**: Everyone can type and view output live on the canvas.

## Project Status

* **Latest Milestone**: MILESTONE 4 - Infinite canvas component implemented.
* **Status**: Minimal server/client/frontend all working in production.
* **Binaries**: Available for all major OS/architectures.
* **In Progress**: Terminal encryption, session authentication.

## Contributing

We welcome contributions! To contribute:

1. Fork: `https://github.com/Ayush-Vish/ShellSync`
2. Create branch: `git checkout -b feature/xyz`
3. Commit: `git commit -m "Add xyz feature"`
4. Push: `git push origin feature/xyz`
5. Open PR with description.

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md) and style guides.

### Development Setup

* **Backend**: `go mod tidy`, `go test ./...`
* **Frontend**: `npm install`, `npm run build`
* **Protobuf**: Update `.proto` and regenerate code.

## License

ShellSync is licensed under the [MIT License](LICENSE).

## Contact

* **Repo**: [https://github.com/Ayush-Vish/ShellSync](https://github.com/Ayush-Vish/ShellSync)
* **Issues**: [GitHub Issues](https://github.com/Ayush-Vish/ShellSync/issues)
* **Email**: [ayushvish6555@gmail.com](mailto:ayushvish6555@gmail.com)
