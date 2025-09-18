#!/usr/bin/env bash
set -euo pipefail

echo "[devcontainer] installing tools..."
if command -v npm >/dev/null 2>&1; then
  npm i -g @google/gemini-cli @anthropic-ai/claude-code >/dev/null 2>&1 || true
fi

echo "[devcontainer] applying dotfiles via chezmoi if present..."
if command -v chezmoi >/dev/null 2>&1 && [ -d "$HOME/.local/share/chezmoi" ]; then
  chezmoi apply || true
fi

echo "done"
