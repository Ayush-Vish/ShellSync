protoc \
  --go_out=shellsync-core/pb \
  --go-grpc_out=shellsync-core/pb \
  --proto_path=shellsync-core/proto \
  shellsync-core/proto/shellsync.proto
