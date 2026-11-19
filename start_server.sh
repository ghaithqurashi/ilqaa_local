#!/usr/bin/env bash
set -euo pipefail

project_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
frontend_url=http://localhost:3000
open_browser=false
start_asr=true

install_desktop_launcher() {
    local desktop_dir launcher project_path
    desktop_dir=$(xdg-user-dir DESKTOP 2>/dev/null || true)
    if [[ -z "$desktop_dir" || "$desktop_dir" == "$HOME" ]]; then
        desktop_dir="$HOME/Desktop"
    fi
    mkdir -p -- "$desktop_dir"
    launcher="$desktop_dir/Ilqaa.desktop"
    # Escape backslashes and spaces in the desktop entry's Path value.
    project_path=${project_dir//\\/\\\\}
    project_path=${project_path// /\\s}
    cat > "$launcher" <<DESKTOP
[Desktop Entry]
Type=Application
Name=Ilqaa
Comment=Start the local Ilqaa application
Exec=/bin/bash ./start_server.sh --open-browser
Path=$project_path
Icon=applications-multimedia
Terminal=true
DESKTOP
    chmod +x -- "$launcher"
    printf 'Created %s\n' "$launcher"
}

while (( $# )); do
    case "$1" in
        --open-browser) open_browser=true ;;
        --no-asr) start_asr=false ;;
        --install-desktop) install_desktop_launcher; exit ;;
        -h|--help)
            printf '%s\n' 'Usage: start_server.sh [--open-browser] [--no-asr]' \
                '       start_server.sh --install-desktop'
            exit ;;
        *) printf 'Unknown option: %s\n' "$1" >&2; exit 2 ;;
    esac
    shift
done

backend_dir="$project_dir/backend"
frontend_dir="$project_dir/frontend"
python="$backend_dir/.venv/bin/python"

if [[ ! -x "$python" ]]; then
    printf '%s\n' 'Backend virtual environment missing. Follow the setup in README.md.' >&2
    exit 1
fi
if ! command -v node >/dev/null || [[ ! -f "$frontend_dir/node_modules/vite/bin/vite.js" ]]; then
    printf '%s\n' 'Install Node.js and run npm ci in frontend/ before starting Ilqaa.' >&2
    exit 1
fi

server_pids=()
cleanup() {
    if (( ${#server_pids[@]} )); then
        kill "${server_pids[@]}" 2>/dev/null || true
        wait "${server_pids[@]}" 2>/dev/null || true
    fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

export VIRTUAL_ENV="$backend_dir/.venv"
export PATH="$VIRTUAL_ENV/bin:$PATH"

cd -- "$backend_dir"
if "$start_asr"; then
    "$python" "$project_dir/tools/asr-eval/serve_asr.py" &
    server_pids+=("$!")
fi
"$python" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
backend_pid=$!
server_pids+=("$backend_pid")

cd -- "$frontend_dir"
# Run Vite directly so the PID belongs to the server, rather than npm.
node node_modules/vite/bin/vite.js --host localhost --port 3000 --strictPort &
frontend_pid=$!
server_pids+=("$frontend_pid")

printf 'Ilqaa: %s (Ctrl+C to stop)\n' "$frontend_url"
if "$open_browser"; then
    if command -v curl >/dev/null && command -v xdg-open >/dev/null; then
        for (( attempt=0; attempt<60; attempt++ )); do
            if ! kill -0 "$backend_pid" "$frontend_pid" 2>/dev/null; then
                printf '%s\n' 'A server exited during startup. Check the output above.' >&2
                exit 1
            fi
            if curl -fs --max-time 1 "$frontend_url/api/health" >/dev/null; then
                (xdg-open "$frontend_url" || printf 'Open %s in your browser.\n' "$frontend_url") &
                break
            fi
            sleep 1
        done
        if (( attempt == 60 )); then
            printf 'Still waiting for Ilqaa. Open %s once the servers are ready.\n' "$frontend_url"
        fi
    else
        printf 'Automatic browser opening requires curl and xdg-open. Open %s manually.\n' "$frontend_url"
    fi
fi

wait -n "$backend_pid" "$frontend_pid"
