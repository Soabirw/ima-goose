#!/usr/bin/env python3
"""
Discourse Admin CLI — config-as-code for Discourse site settings.

Environment resolution (priority order):
  1. $DISCOURSE_ENV env var (e.g., "local", "staging", "production")
  2. .discourse-env file in project root or parents
  3. --env flag on command line
  4. Falls back to "local"

Credentials stored in: ~/.agents/discourse-environments.json

Usage:
  discourse-admin.py export [output_file]
  discourse-admin.py import <base_config> [overlay_config]
  discourse-admin.py diff <config_file>
  discourse-admin.py get <setting_name>
  discourse-admin.py set <setting_name> <value>
  discourse-admin.py envs
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import Any

ENVS_FILE = Path.home() / ".agents" / "discourse-environments.json"
ENV_FILE_NAME = ".discourse-env"
DEFAULT_ENV = "local"
DEFAULT_USERNAME = "system"


# ── Environment Resolution ──────────────────────────────────────────

def find_env_file() -> str | None:
    """Walk up from cwd looking for .discourse-env file."""
    d = Path.cwd()
    while d != d.parent:
        f = d / ENV_FILE_NAME
        if f.is_file():
            return f.read_text().strip()
        d = d.parent
    return None


def resolve_env(cli_env: str | None = None) -> str:
    """Resolve environment name via priority chain."""
    if cli_env:
        return cli_env
    if env_var := os.environ.get("DISCOURSE_ENV"):
        return env_var
    if file_env := find_env_file():
        return file_env
    return DEFAULT_ENV


def load_environments() -> dict:
    """Load environment configs from ~/.agents/discourse-environments.json"""
    if not ENVS_FILE.is_file():
        print(f"Error: No environments configured at {ENVS_FILE}", file=sys.stderr)
        print(f"Create it with:", file=sys.stderr)
        print(json.dumps({
            "local": {
                "url": "http://localhost:4200",
                "api_key": "your-api-key-here",
                "api_username": "system"
            },
            "staging": {
                "url": "https://staging.community.example.com",
                "api_key": "staging-key",
                "api_username": "system"
            }
        }, indent=2), file=sys.stderr)
        sys.exit(1)
    return json.loads(ENVS_FILE.read_text())


def get_credentials(env_name: str) -> dict:
    """Get URL + credentials for a named environment."""
    envs = load_environments()
    if env_name not in envs:
        available = ", ".join(envs.keys())
        print(f"Error: Unknown environment '{env_name}'. Available: {available}", file=sys.stderr)
        sys.exit(1)
    cfg = envs[env_name]
    return {
        "url": cfg["url"].rstrip("/"),
        "api_key": cfg["api_key"],
        "api_username": cfg.get("api_username", DEFAULT_USERNAME),
    }


# ── HTTP Client ─────────────────────────────────────────────────────

def api_request(creds: dict, method: str, endpoint: str, body: dict | None = None) -> Any:
    """Make a Discourse API request. Returns parsed JSON or raises."""
    url = f"{creds['url']}{endpoint}"
    headers = {
        "Api-Key": creds["api_key"],
        "Api-Username": creds["api_username"],
        "Content-Type": "application/json",
    }

    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw.strip() else {}
    except urllib.error.HTTPError as e:
        body_text = e.read().decode() if e.fp else ""
        print(f"Error: HTTP {e.code} from {method} {endpoint}", file=sys.stderr)
        if body_text:
            try:
                print(json.dumps(json.loads(body_text), indent=2), file=sys.stderr)
            except json.JSONDecodeError:
                print(body_text[:500], file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Error: Cannot reach {url} — {e.reason}", file=sys.stderr)
        sys.exit(1)


# ── Commands ────────────────────────────────────────────────────────

def cmd_export(creds: dict, output_file: str | None = None):
    """Export non-default site settings to JSON."""
    print(f"Fetching settings from {creds['url']}...", file=sys.stderr)
    data = api_request(creds, "GET", "/admin/site_settings.json")

    settings = data.get("site_settings", [])
    non_default = {
        s["setting"]: s["value"]
        for s in settings
        if s.get("value") != s.get("default") and s.get("setting")
    }

    result = json.dumps(non_default, indent=2, sort_keys=True)
    print(f"Exported {len(non_default)} non-default settings.", file=sys.stderr)

    if output_file:
        Path(output_file).write_text(result + "\n")
        print(f"Written to {output_file}", file=sys.stderr)
    else:
        print(result)


def cmd_import(creds: dict, base_file: str, overlay_file: str | None = None, dry_run: bool = False):
    """Import settings from config file(s) with optional overlay merge."""
    base = json.loads(Path(base_file).read_text())

    if overlay_file:
        overlay = json.loads(Path(overlay_file).read_text())
        merged = {**base, **overlay}
        print(f"Merged {base_file} ({len(base)} settings) + {overlay_file} ({len(overlay)} overrides) = {len(merged)} total", file=sys.stderr)
    else:
        merged = base
        print(f"Loaded {len(merged)} settings from {base_file}", file=sys.stderr)

    if dry_run:
        print("\n=== DRY RUN — would apply: ===", file=sys.stderr)
        for k, v in sorted(merged.items()):
            val_display = str(v)[:80]
            print(f"  {k} = {val_display}", file=sys.stderr)
        print(f"\nTotal: {len(merged)} settings. Run without --dry-run to apply.", file=sys.stderr)
        return

    # Try bulk_update first
    payload = {
        "settings": {k: {"value": str(v)} for k, v in merged.items()}
    }

    print(f"Applying {len(merged)} settings to {creds['url']}...", file=sys.stderr)

    try:
        api_request(creds, "PUT", "/admin/site_settings/bulk_update.json", payload)
        print("Bulk update successful.", file=sys.stderr)
    except SystemExit:
        print("Bulk update failed. Falling back to individual updates...", file=sys.stderr)
        success, fail = 0, 0
        for name, value in sorted(merged.items()):
            try:
                api_request(creds, "PUT", f"/admin/site_settings/{name}.json", {name: str(value)})
                print(f"  OK: {name}", file=sys.stderr)
                success += 1
            except SystemExit:
                print(f"  FAIL: {name}", file=sys.stderr)
                fail += 1
        print(f"Done. {success} succeeded, {fail} failed.", file=sys.stderr)


def cmd_diff(creds: dict, config_file: str):
    """Show what would change if config were applied (compare remote vs local file)."""
    desired = json.loads(Path(config_file).read_text())

    print(f"Fetching current settings from {creds['url']}...", file=sys.stderr)
    data = api_request(creds, "GET", "/admin/site_settings.json")

    current = {s["setting"]: s["value"] for s in data.get("site_settings", []) if s.get("setting")}

    changes, no_change, missing = [], [], []
    for name, desired_val in sorted(desired.items()):
        if name not in current:
            missing.append(name)
        elif str(current[name]) != str(desired_val):
            changes.append((name, current[name], desired_val))
        else:
            no_change.append(name)

    if changes:
        print(f"\n{'Setting':<45} {'Current':<30} {'Desired':<30}")
        print("-" * 105)
        for name, cur, des in changes:
            print(f"  {name:<43} {str(cur)[:28]:<30} {str(des)[:28]:<30}")

    print(f"\nSummary: {len(changes)} changes, {len(no_change)} unchanged, {len(missing)} unknown settings")


def cmd_get(creds: dict, setting_name: str):
    """Get a single setting's current value."""
    data = api_request(creds, "GET", "/admin/site_settings.json")
    for s in data.get("site_settings", []):
        if s.get("setting") == setting_name:
            print(json.dumps({
                "setting": s["setting"],
                "value": s["value"],
                "default": s.get("default"),
                "type": s.get("type"),
                "description": s.get("description", ""),
            }, indent=2))
            return
    print(f"Setting '{setting_name}' not found.", file=sys.stderr)
    sys.exit(1)


def cmd_set(creds: dict, setting_name: str, value: str):
    """Set a single setting."""
    api_request(creds, "PUT", f"/admin/site_settings/{setting_name}.json", {setting_name: value})
    print(f"OK: {setting_name} = {value}", file=sys.stderr)


def cmd_envs():
    """List configured environments."""
    if not ENVS_FILE.is_file():
        print(f"No environments configured. Create {ENVS_FILE}", file=sys.stderr)
        sys.exit(1)
    envs = json.loads(ENVS_FILE.read_text())
    current = resolve_env()
    for name, cfg in envs.items():
        marker = " ← active" if name == current else ""
        print(f"  {name}: {cfg['url']}{marker}")


# ── CLI Entry Point ─────────────────────────────────────────────────

def main():
    args = sys.argv[1:]

    if not args or args[0] in ("-h", "--help", "help"):
        print(__doc__)
        sys.exit(0)

    # Parse --env flag
    env_override = None
    if "--env" in args:
        idx = args.index("--env")
        if idx + 1 < len(args):
            env_override = args[idx + 1]
            args = args[:idx] + args[idx + 2:]

    dry_run = "--dry-run" in args
    if dry_run:
        args.remove("--dry-run")

    cmd = args[0]
    cmd_args = args[1:]

    if cmd == "envs":
        cmd_envs()
        return

    env_name = resolve_env(env_override)
    creds = get_credentials(env_name)
    print(f"[{env_name}] {creds['url']}", file=sys.stderr)

    if cmd == "export":
        cmd_export(creds, cmd_args[0] if cmd_args else None)
    elif cmd == "import":
        if not cmd_args:
            print("Usage: discourse-admin.py import <base_config> [overlay_config]", file=sys.stderr)
            sys.exit(1)
        cmd_import(creds, cmd_args[0], cmd_args[1] if len(cmd_args) > 1 else None, dry_run=dry_run)
    elif cmd == "diff":
        if not cmd_args:
            print("Usage: discourse-admin.py diff <config_file>", file=sys.stderr)
            sys.exit(1)
        cmd_diff(creds, cmd_args[0])
    elif cmd == "get":
        if not cmd_args:
            print("Usage: discourse-admin.py get <setting_name>", file=sys.stderr)
            sys.exit(1)
        cmd_get(creds, cmd_args[0])
    elif cmd == "set":
        if len(cmd_args) < 2:
            print("Usage: discourse-admin.py set <setting_name> <value>", file=sys.stderr)
            sys.exit(1)
        cmd_set(creds, cmd_args[0], cmd_args[1])
    else:
        print(f"Unknown command: {cmd}", file=sys.stderr)
        print("Commands: export, import, diff, get, set, envs", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
