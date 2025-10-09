# ShellSync: The Real-Time Collaborative Terminal
**ShellSync** transforms your terminal into an interactive, real-time collaborative canvas. Instantly share your terminal session with anyone, anywhere, right in their browser. Perfect for pair programming, debugging sessions, live demos, and educational purposes.

## ✨ Key Features

  * **Real-Time Collaboration**: Share your terminal session live with multiple users. Keystrokes and output are synced instantly for everyone.
  * **Infinite Canvas Interface**: Say goodbye to traditional tabbed interfaces. Arrange terminals on an infinite, pan-and-zoom canvas.
  * **Draggable & Resizable Terminals**: Move and resize terminals anywhere on the canvas to create the perfect layout for your needs.
  * **Cross-Platform Agent**: A single, lightweight command-line agent written in Go that runs on **macOS**, **Windows**, and **Linux**.
  * **Web-Based Client**: Collaborators don't need to install a thing. They can join from their web browser with a simple URL.
  * **Self-Hostable**: Control and run the entire stack on your own infrastructure, ensuring your data remains private and secure.

-----

## 🏗️ How It Works

ShellSync uses a three-component architecture optimized for performance, scalability, and ease of use.

```mermaid
graph TD
    subgraph Your Machine
        A[Go Agent] -->|PTY Output (gRPC)| B;
        B -->|PTY Input (gRPC)| A;
    end

    subgraph Your Server
        B[gRPC Server] <--> C{Go Backend};
        C <--> D[WebSocket Hub];
    end

    subgraph Collaborators
        E[Browser 1] <-->|WebSocket| D;
        F[Browser 2] <-->|WebSocket| D;
        G[Browser N...] <-->|WebSocket| D;
    end

    A -- 1. Connects via gRPC --> B;
    C -- 2. Creates Session --> A;
    A -- 3. Provides Sharable URL --> User;
    E -- 4. Joins via WebSocket --> D;
```

1.  **The Agent (Go)**: A command-line tool you run on your machine. It creates a local shell process (PTY) and securely streams the terminal input/output over a high-performance gRPC connection to the backend.
2.  **The Backend (Go)**: The central hub of the system. It handles gRPC connections from agents, WebSocket connections from web clients, and manages session state. It takes output from the agent and broadcasts it to all connected browsers in that session.
3.  **The Frontend (React)**: A modern, web-based interface that provides the infinite canvas where terminals are displayed. It communicates with the backend over WebSockets to provide a seamless, real-time experience.

-----

## 🛠️ Technology Stack

| Component      | Technology                                                                               |
| :------------- | :----------------------------------------------------------------------------------------- |
| **Frontend** | React, Next.js, TypeScript, Tailwind CSS, Xterm.js                                         |
| **Backend** | Go, Gorilla WebSocket, Gorilla Mux                                                         |
| **Agent** | Go, Cobra (for CLI), gRPC                                                                  |
| **Communication** | gRPC (Agent ↔ Backend), WebSockets (Backend ↔ Frontend)                                  |
| **API Definition** | Protobuf                                                                                   |

-----

## 🚀 Getting Started

Follow these instructions to get ShellSync up and running locally.

### Prerequisites

  * Go 1.21+
  * Node.js 18+ and npm
  * `protoc` (Protocol Buffers compiler)

### Installation & Setup

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/shellsync.git
    cd shellsync
    ```

2.  **Generate Protobuf Code:**
    The project uses a `Makefile` to simplify tasks. Generate the necessary Go and gRPC code from the `.proto` file.

    ```sh
    make proto
    ```

3.  **Install Frontend Dependencies:**

    ```sh
    cd frontend
    npm install
    cd ..
    ```

4.  **Install Backend Dependencies:**

    ```sh
    go mod tidy
    ```

### Running the Application

1.  **Start the Backend Server:**

    ```sh
    make run-server
    ```

    This will start the gRPC and WebSocket server on ports `5001` and `5000` respectively.

2.  **Run the Agent (in a new terminal):**

    ```sh
    make run-client
    ```

    The agent will connect to the server, create a session, and output a sharable URL.

3.  **Start Collaborating:**
    Open the URL provided by the agent in your web browser. Share this URL with others to have them join your session instantly.

-----

## 📦 Building for Production

You can use the `Makefile` to build production-ready binaries.

  * **Build the Server:**

    ```sh
    make build-server
    ```

    The binary will be placed in `bin/server`.

  * **Build the Client (Agent):**
    The `build-client` command is a powerful cross-compiler that builds the agent for multiple operating systems and architectures.

    ```sh
    make build-client
    ```

    The binaries will be placed in the `bin/` directory, ready for distribution.

-----

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

-----

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
