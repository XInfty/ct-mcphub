#!/usr/bin/env python3
import argparse
import json
import re
from pathlib import Path
import sys

import requests


def parse_args():
    parser = argparse.ArgumentParser(
        description="Refresh Trilium CSRF/session headers for MCPHub openapi-mcp-server."
    )
    parser.add_argument(
        "--base-url",
        default="http://bootstrap.sphinx-alnitak.ts.net:8080",
        help="Trilium base URL (default: %(default)s)",
    )
    parser.add_argument(
        "--password",
        required=True,
        help="Trilium login password",
    )
    parser.add_argument(
        "--server",
        default="trilium",
        help="MCP server name in mcp_settings.json (default: %(default)s)",
    )
    parser.add_argument(
        "--mcp-settings",
        default="/xinfty/srv/ct-mcphub/mcp_settings.json",
        help="Path to MCPHub mcp_settings.json",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    base_url = args.base_url.rstrip("/")

    session = requests.Session()
    login_resp = session.post(
        f"{base_url}/login",
        data={"password": args.password},
        allow_redirects=False,
        timeout=10,
    )
    if login_resp.status_code not in (302, 200):
        sys.stderr.write(f"Login failed: {login_resp.status_code}\n")
        sys.exit(1)

    index_resp = session.get(f"{base_url}/", timeout=10)
    if index_resp.status_code != 200:
        sys.stderr.write(f"Index fetch failed: {index_resp.status_code}\n")
        sys.exit(1)

    match = re.search(r"csrfToken: '([^']+)'", index_resp.text)
    if not match:
        sys.stderr.write("CSRF token not found in index page.\n")
        sys.exit(1)

    csrf_token = match.group(1)
    cookies = session.cookies.get_dict()
    sid = cookies.get("trilium.sid")
    csrf_cookie = cookies.get("_csrf")

    if not sid or not csrf_cookie:
        sys.stderr.write("Required cookies not found (trilium.sid or _csrf).\n")
        sys.exit(1)

    header_value = (
        f"Cookie: trilium.sid={sid}; _csrf={csrf_cookie}, "
        f"x-csrf-token: {csrf_token}"
    )

    settings_path = Path(args.mcp_settings)
    data = json.loads(settings_path.read_text())

    servers = data.get("mcpServers", {})
    if args.server not in servers:
        sys.stderr.write(f"Server '{args.server}' not found in mcp_settings.json.\n")
        sys.exit(1)

    env = servers[args.server].setdefault("env", {})
    env["API_HEADERS"] = header_value

    settings_path.write_text(json.dumps(data, indent=2))
    print("Updated API_HEADERS for", args.server)


if __name__ == "__main__":
    main()
