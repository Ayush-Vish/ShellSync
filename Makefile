PROTO_DIR=api/proto
GO_OUT=.
WEB_OUT=frontend/src/lib/proto

proto:
	protoc \
	  --go_out=$(GO_OUT) --go_opt=paths=source_relative \
	  --go-grpc_out=$(GO_OUT) --go-grpc_opt=paths=source_relative \
	  $(PROTO_DIR)/shellsync.proto


run-server:
	go run ./backend/cmd/server

run-client:
	go run ./client/main.go

build-server:
	go build -o bin/server ./backend/cmd/server

build-client:
	@echo "Building for Linux (amd64)..."
	GOOS=linux GOARCH=amd64 go build -o bin/client-linux-amd64 ./client

	@echo "Building for Linux (arm64)..."
	GOOS=linux GOARCH=arm64 go build -o bin/client-linux-arm64 ./client

	@echo "Building for macOS (amd64)..."
	GOOS=darwin GOARCH=amd64 go build -o bin/client-darwin-amd64 ./client

	@echo "Building for macOS (arm64/M1)..."
	GOOS=darwin GOARCH=arm64 go build -o bin/client-darwin-arm64 ./client

	@echo "Building for Windows (amd64)..."
	GOOS=windows GOARCH=amd64 go build -o bin/client-windows-amd64.exe ./client

	@echo "Building for Windows (arm64)..."
	GOOS=windows GOARCH=arm64 go build -o bin/client-windows-arm64.exe ./client
	
	@echo "Builds completed. Binaries are in the bin/ directory."
