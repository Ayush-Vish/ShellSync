#!/bin/sh

REPO_URL="https://github.com/Ayush-Vish/ShellSync/raw/main/bin"
AGENT_NAME="shellsync-agent"
INSTALL_PATH="/usr/bin/$AGENT_NAME"

OS="$(uname -s)"
ARCH="$(uname -m)"

# Normalize architecture
if [ "$ARCH" = "x86_64" ]; then
  ARCH="amd64"
elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
  ARCH="arm64"
else
  echo "Unsupported architecture: $ARCH"
  exit 1
fi

# Normalize OS
case "$OS" in
  Linux) PLATFORM="linux" ;;
  Darwin) PLATFORM="darwin" ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

FILE_NAME="client-${PLATFORM}-${ARCH}"

echo "Downloading $FILE_NAME..."
curl -L "$REPO_URL/$FILE_NAME" -o "$AGENT_NAME" || {
  echo "Download failed!"
  exit 1
}

chmod +x "$AGENT_NAME"

echo "Installing to $INSTALL_PATH..."
if mv "$AGENT_NAME" "$INSTALL_PATH" 2>/dev/null; then
  echo "Installed successfully!"
else
  echo "Requires sudo to move to $INSTALL_PATH"
  sudo mv "$AGENT_NAME" "$INSTALL_PATH" || {
    echo "Installation failed"
    exit 1
  }
fi

echo "You can now run: $AGENT_NAME"
