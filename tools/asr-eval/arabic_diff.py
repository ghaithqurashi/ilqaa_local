"""
The vowel-aware comparison now lives in the backend: backend/app/services/arabic_diff.py
(it has no dependencies, so this kit simply imports it from there). Edit that file.
"""
import importlib.util as _ilu
from pathlib import Path as _Path

_SRC = _Path(__file__).resolve().parents[2] / "backend" / "app" / "services" / "arabic_diff.py"
_spec = _ilu.spec_from_file_location("_ilqaa_arabic_diff", _SRC)
_mod = _ilu.module_from_spec(_spec)
import sys as _sys
_sys.modules[_spec.name] = _mod          # dataclasses need the module registered
_spec.loader.exec_module(_mod)
globals().update({k: v for k, v in vars(_mod).items() if not k.startswith("__")})
