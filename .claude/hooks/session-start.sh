#!/bin/bash
# Installs REA for Claude Code cloud sessions and puts the `rea` CLI on PATH.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REA_HOME="${REA_HOME:-$HOME/.rea-runtime}"

"$CLAUDE_PROJECT_DIR/.claude/rea/install.sh"

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$REA_HOME/bin:\$PATH\"" >>"$CLAUDE_ENV_FILE"
fi
