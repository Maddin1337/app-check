#!/usr/bin/env bash
# Installs REA (https://github.com/morluto/rea) for this project:
#   - a Node.js runtime REA supports (^22.23.4 || ^24.22.1 || >=26.12.1),
#     reusing the system Node.js when it already qualifies
#   - the pinned rea-agents CLI/MCP server
#   - a `rea` shim at $REA_HOME/bin/rea that runs it on that runtime
#
# Idempotent and safe to run concurrently. All output goes to stderr so the
# MCP launcher (mcp.sh) can call it without polluting the stdio channel.
set -euo pipefail
exec 3>&1 1>&2

# Bump these to update REA. The next session start (or MCP launch) reinstalls.
REA_VERSION="${REA_VERSION:-6.8.0}"
NODE_VERSION="${REA_NODE_VERSION:-24.22.1}"
REA_HOME="${REA_HOME:-$HOME/.rea-runtime}"

log() { echo "[rea-install] $*"; }

# Exit 0 when the given node binary satisfies REA's engines range.
node_ok() {
  "$1" -e '
    const [a, b, c] = process.versions.node.split(".").map(Number);
    const atLeast = (x, y, z) => a > x || (a === x && (b > y || (b === y && c >= z)));
    const ok = (a === 22 && atLeast(22, 23, 4)) || (a === 24 && atLeast(24, 22, 1)) || atLeast(26, 12, 1);
    process.exit(ok ? 0 : 1);
  ' 2>/dev/null
}

sha256_check() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum -c -; else shasum -a 256 -c -; fi
}

download_node() {
  local plat tarball base tmp
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64) plat=linux-x64 ;;
    Linux-aarch64 | Linux-arm64) plat=linux-arm64 ;;
    Darwin-x86_64) plat=darwin-x64 ;;
    Darwin-arm64) plat=darwin-arm64 ;;
    *) log "unsupported platform $(uname -s)-$(uname -m); install Node.js $NODE_VERSION manually"; exit 1 ;;
  esac
  tarball="node-v$NODE_VERSION-$plat.tar.gz"
  base="https://nodejs.org/dist/v$NODE_VERSION"
  tmp="$(mktemp -d)"
  log "downloading Node.js $NODE_VERSION ($plat)"
  curl -fsSL --retry 3 -o "$tmp/$tarball" "$base/$tarball"
  curl -fsSL --retry 3 -o "$tmp/SHASUMS256.txt" "$base/SHASUMS256.txt"
  (cd "$tmp" && grep " $tarball\$" SHASUMS256.txt | sha256_check >/dev/null)
  rm -rf "$REA_HOME/node.tmp"
  mkdir -p "$REA_HOME/node.tmp"
  tar -xzf "$tmp/$tarball" -C "$REA_HOME/node.tmp" --strip-components=1
  rm -rf "$REA_HOME/node" "$tmp"
  mv "$REA_HOME/node.tmp" "$REA_HOME/node"
}

mkdir -p "$REA_HOME/bin"
exec 9>"$REA_HOME/.lock"
if command -v flock >/dev/null 2>&1; then flock 9; fi

# 1. Node.js runtime
if [ -x "$REA_HOME/node/bin/node" ] && node_ok "$REA_HOME/node/bin/node"; then
  node_bin_dir="$REA_HOME/node/bin"
elif command -v node >/dev/null 2>&1 && node_ok "$(command -v node)"; then
  node_bin_dir="$(dirname "$(command -v node)")"
else
  download_node
  node_bin_dir="$REA_HOME/node/bin"
fi

# 2. rea-agents, pinned
pkg_json="$REA_HOME/npm/lib/node_modules/rea-agents/package.json"
installed="$("$node_bin_dir/node" -p "require('$pkg_json').version" 2>/dev/null || true)"
if [ "$installed" != "$REA_VERSION" ]; then
  log "installing rea-agents@$REA_VERSION (found: ${installed:-none})"
  PATH="$node_bin_dir:$PATH" npm install --global --prefix "$REA_HOME/npm" \
    --no-fund --no-audit --loglevel=error "rea-agents@$REA_VERSION"
fi

# 3. Shim that pins the runtime for REA and every helper it spawns
cat >"$REA_HOME/bin/rea.tmp" <<EOF
#!/bin/sh
PATH="$node_bin_dir:\$PATH" exec "$REA_HOME/npm/bin/rea" "\$@"
EOF
chmod +x "$REA_HOME/bin/rea.tmp"
mv "$REA_HOME/bin/rea.tmp" "$REA_HOME/bin/rea"

log "ready: rea-agents@$REA_VERSION on Node.js $("$node_bin_dir/node" --version) ($REA_HOME/bin/rea)"
