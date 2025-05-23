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
