"""Owner's local terminal only: masked key, five fixed public lookups maximum.

Never run in a shared/cloud terminal, paste the key in chat, or redirect input.
Requires the checked-out repository, Node and installed pnpm dependencies.
"""
import getpass
import os
from pathlib import Path
import re
import subprocess
import sys
import warnings


def main():
    if len(sys.argv) != 1 or not sys.stdin.isatty() or not sys.stderr.isatty():
        print("Run without arguments in your own private interactive terminal.", file=sys.stderr)
        return 1
    print("Uses at most five free lookups of fixed public addresses. No private addresses or hosted changes.")
    if input("No billing, paid credits or auto-refill, and at least five free lookups remain? Type YES: ") != "YES":
        return 1
    key = None
    child_env = None
    try:
        # Fail rather than allowing getpass's non-masked fallback.
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            key = getpass.getpass("Geocodio API key (hidden; local use only): ")
        if not re.fullmatch(r"[a-zA-Z0-9_-]{16,200}", key):
            raise ValueError()
        child_env = dict(os.environ)
        child_env["GEOCODIO_API_KEY"] = key
        root = Path(__file__).resolve().parent.parent
        result = subprocess.run(
            ["node", str(root / "scripts/verify-geocodio-public.mjs"), "--live", "--confirm-free-tier"],
            cwd=root, env=child_env, check=False,
        )
        return result.returncode
    except (Exception, KeyboardInterrupt):
        print("Verification stopped. No raw key or provider error is printed.", file=sys.stderr)
        return 1
    finally:
        if child_env is not None:
            child_env.pop("GEOCODIO_API_KEY", None)
        key = None


if __name__ == "__main__":
    sys.exit(main())
