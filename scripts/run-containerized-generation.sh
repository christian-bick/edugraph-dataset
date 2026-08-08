#!/usr/bin/env bash
set -euo pipefail

server_pid=''
start_seconds=$SECONDS

cleanup() {
    local status=$?
    if [[ -n "$server_pid" ]]; then
        kill "$server_pid" 2>/dev/null || true
        wait "$server_pid" 2>/dev/null || true
    fi
    if [[ -n "${EDUGRAPH_HOST_UID:-}" && -n "${EDUGRAPH_HOST_GID:-}" && -d /host-workspace/out ]]; then
        chown -R "${EDUGRAPH_HOST_UID}:${EDUGRAPH_HOST_GID}" /host-workspace/out || true
    fi
    if [[ $status -ne 0 && -f /tmp/edugraph-vite.log ]]; then
        echo '--- Vite renderer log ---'
        tail -n 100 /tmp/edugraph-vite.log
    fi
    exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p /workspace /host-workspace/out
tar \
    --exclude='./.git' \
    --exclude='./cache' \
    --exclude='./dist' \
    --exclude='./node_modules' \
    --exclude='./out' \
    --exclude='./temp' \
    -C /host-workspace -cf - . | tar -C /workspace -xf -
ln -s /host-workspace/out /workspace/out
cd /workspace
source_seconds=$SECONDS

dependency_marker="node_modules/.edugraph-container-dependencies"
if [[ ! -f "$dependency_marker" ]]; then
    echo 'Installing canonical Linux dependencies (cold dependency volume)...'
    npm ci --cache /root/.npm
    touch "$dependency_marker"
else
    echo 'Reusing canonical Linux dependencies (warm dependency volume).'
fi
dependency_seconds=$SECONDS

npm run dev -- --host 127.0.0.1 --strictPort > /tmp/edugraph-vite.log 2>&1 &
server_pid=$!
node /workspace/scripts/wait-for-renderer.mjs http://127.0.0.1:5173 60000
renderer_seconds=$SECONDS

echo "Container setup: source-copy=$((source_seconds - start_seconds))s dependencies=$((dependency_seconds - source_seconds))s renderer=$((renderer_seconds - dependency_seconds))s"
npm run generate:dataset -- "$@"
