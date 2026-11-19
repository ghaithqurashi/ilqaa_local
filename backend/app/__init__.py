"""Ilqaa backend."""
import sys

# Windows: when output is redirected (file, pipe, some IDE consoles) Python uses the legacy code page
# and crashes on the emoji / Arabic this code prints. Force UTF-8 output on every platform.
for _stream in (sys.stdout, sys.stderr):
    try:
        if (getattr(_stream, "encoding", "") or "").lower().replace("-", "") != "utf8":
            _stream.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
