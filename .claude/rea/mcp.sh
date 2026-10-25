#!/usr/bin/env bash
# Starts the REA MCP server over stdio for Claude Code (see .mcp.json).
# Installs REA first when the session-start hook hasn't (e.g. local checkouts).
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REA_HOME="${REA_HOME:-$HOME/.rea-runtime}"

"$here/install.sh" >&2
exec "$REA_HOME/bin/rea" mcp "$@"
