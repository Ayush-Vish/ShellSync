
---
# ShellSync

**ShellSync** is an open-source, real-time terminal collaboration tool that allows multiple users to share and interact with terminal sessions through an intuitive, infinite canvas interface. Whether you're pair programming, debugging remotely, or teaching command-line skills, ShellSync makes collaborative terminal workflows seamless and efficient.

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/Ayush-Vish/ShellSync)](https://github.com/Ayush-Vish/ShellSync)

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Download the Agent](#download-the-agent)
  - [Running the Server](#running-the-server)
  - [Running the Frontend](#running-the-frontend)
  - [Running the Agent](#running-the-agent)
- [Usage](#usage)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Features
- **Real-Time Collaboration**: Share terminal sessions instantly with team members via a unique URL, enabling multiple users to view and interact with the same terminal in real-time.
- **Infinite Canvas Interface**: Manage multiple terminal windows on a dynamic, draggable, and zoomable canvas, providing a flexible workspace for complex workflows.
- **Cross-Platform Support**: Lightweight agent binaries available for macOS (amd64, arm64) and Linux (amd64, arm64).
- **Low-Latency Terminal I/O**: Stream terminal input and output with minimal delay using WebSocket for frontend-backend communication and gRPC for backend-agent communication.
- **Production-Ready**: Stable implementation with a minimal client, server, and frontend, tested in production environments.

## Architecture
ShellSync is built with a modular architecture to ensure scalability and maintainability:
- **Frontend**: A React-based UI (`CanvasPage.tsx`, `useTerminalSocket.ts`) using WebSocket for real-time communication with the backend. The infinite canvas allows users to create and manage terminal windows.
- **Backend**: A Go server (`websocket/hub.go`, `service/service.go`) that handles WebSocket connections from the frontend and gRPC streams with the agent. It manages sessions and forwards encrypted terminal data.
- **Agent**: A Go-based client (`controller/controller.go`) that runs on the user’s machine, executes terminal commands via PTY, and communicates with the backend over gRPC.
- **Communication**:
  - **WebSocket**: Frontend ↔ Backend for real-time terminal input/output and control messages.
  - **gRPC**: Backend ↔ Agent for secure, bidirectional streaming of terminal data.

## Getting Started

### Prerequisites
- **Node.js** (v16 or higher) and **npm** for the frontend.
- **Go** (v1.18 or higher) for the backend and agent.
- **Git** to clone the repository.
- A modern web browser (e.g., Chrome, Firefox) for the frontend.

### Download the Agent
The ShellSync agent is required to run terminal sessions on your machine. Download the appropriate binary for your platform from the [GitHub repository](https://github.com/Ayush-Vish/ShellSync/blob/main/bin/) using `curl`:

#### macOS (amd64)
- **Binary**: `client-darwin-amd64`
- **Last Update**: Last week (MILESTONE 4: Created infinite canvas component)
- **Download Command**:
  ```bash
  curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-amd64 && chmod +x shellsync-agent
  ```

#### macOS (arm64)
- **Binary**: `client-darwin-arm64`
- **Last Update**: Last week (MILESTONE 4: Created infinite canvas component)
- **Download Command**:
  ```bash
  curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-darwin-arm64 && chmod +x shellsync-agent
  ```

#### Linux (amd64)
- **Binary**: `client-linux-amd64`
- **Last Update**: Last week (MILESTONE 4: Created infinite canvas component)
- **Download Command**:
  ```bash
  curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-amd64 && chmod +x shellsync-agent
  ```

#### Linux (arm64)
- **Binary**: `client-linux-arm64`
- **Last Update**: Last week (MILESTONE 4: Created infinite canvas component)
- **Download Command**:
  ```bash
  curl -L -o shellsync-agent https://github.com/Ayush-Vish/ShellSync/raw/main/bin/client-linux-arm64 && chmod +x shellsync-agent
  ```

### Running the Server
1. Clone the repository:
   ```bash
   git clone https://github.com/Ayush-Vish/ShellSync.git
   cd ShellSync
   ```
2. Navigate to the backend directory (assuming `backend/` contains `main.go`):
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
   The server will start on `http://localhost:3000` (WebSocket endpoint: `ws://localhost:3000/ws`).

### Running the Frontend
1. Navigate to the frontend directory (assuming `frontend/` contains the React app):
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The frontend will be available at `http://localhost:8080`.

### Running the Agent
1. Download the appropriate agent binary (see [Download the Agent](#download-the-agent)).
2. Run the agent:
   ```bash
   ./shellsync-agent
   ```
3. The agent will connect to the server, create a session, and provide a session URL (e.g., `http://localhost:3000/ws/<session_id>?client_id=<client_id>`). Open this URL in your browser to join the session.

## Usage
1. **Start a Session**:
   - Run the agent (`./shellsync-agent`) to create a new session.
   - Copy the provided session URL and open it in a browser.
2. **Create Terminals**:
   - Use the infinite canvas interface to add new terminal windows.
   - Drag and zoom to organize terminals as needed.
3. **Collaborate**:
   - Share the session URL with team members to allow them to join and interact with the same terminals in real-time.
4. **Interact**:
   - Type commands in any terminal window, and see the output reflected across all connected clients.
   - Use the canvas to manage multiple terminals for complex workflows.

## Project Status
- **Latest Milestone**: MILESTONE 4 - Created infinite canvas component (updated last week).
- **Client Repository**: Minimal client, server, and frontend are working in production (updated 2 weeks ago).
- **Binaries**: Available for macOS (amd64, arm64) and Linux (amd64, arm64) with recent updates.
- **Known Issues**:
  - Ensure the WebSocket connection remains stable under high terminal output (e.g., `top` or `tail -f`).
  - Future enhancements: Add end-to-end encryption for terminal data (in progress).

## Contributing
We welcome contributions to ShellSync! To contribute:
1. Fork the repository: `https://github.com/Ayush-Vish/ShellSync`
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request with a clear description of your changes.

Please follow the [Code of Conduct](CODE_OF_CONDUCT.md) and ensure your code adheres to the project’s style guidelines (e.g., run `go fmt` for Go code, `npm run lint` for TypeScript).

### Development Setup
- **Backend**: Install Go dependencies with `go mod tidy` and run tests with `go test ./...`.
- **Frontend**: Install Node dependencies with `npm install` and run `npm run build` for production builds.
- **Protobuf**: Update `shellsync.proto` and regenerate code as needed.

## License
ShellSync is licensed under the [MIT License](LICENSE).

## Contact
- **Repository**: [https://github.com/Ayush-Vish/ShellSync](https://github.com/Ayush-Vish/ShellSync)
- **Issues**: Report bugs or feature requests on [GitHub Issues](https://github.com/Ayush-Vish/ShellSync/issues)
- **Email**: Contact the maintainer at [your-email@example.com] (replace with your email)

---

This README provides a clear overview of ShellSync, detailed setup instructions, and encourages community participation. It reflects the project’s current state, including the latest milestones and binary details from the GitHub repository. If you need specific sections expanded, additional screenshots, or help generating a GitHub Actions workflow for CI/CD, let me know!
