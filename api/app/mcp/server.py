"""MCP server for Artifact Atlas (MCP-001).

This module exposes the Atlas MCP tool server.  It guards the optional 'mcp'
SDK import so that:
  - tool functions remain importable/testable without the SDK installed.
  - the server can be started when the SDK IS present.

Usage (if mcp SDK is installed):
    python3 -m app.mcp.server

The tool functions live in app.mcp.tools — all policy enforcement and audit
emission is implemented there.  This file handles only SDK wiring.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from app.mcp.tools import TOOL_REGISTRY, _build_services
from app.settings import get_settings

# ---------------------------------------------------------------------------
# Optional MCP SDK import
# ---------------------------------------------------------------------------

try:
    import mcp  # type: ignore[import-untyped]
    import mcp.server  # type: ignore[import-untyped]
    from mcp.server import Server  # type: ignore[import-untyped]
    from mcp.server.stdio import stdio_server  # type: ignore[import-untyped]
    from mcp.types import (  # type: ignore[import-untyped]
        CallToolResult,
        ListToolsResult,
        TextContent,
        Tool,
    )

    _MCP_AVAILABLE = True
except ImportError:
    _MCP_AVAILABLE = False
    Server = None  # type: ignore[assignment,misc]


# ---------------------------------------------------------------------------
# Shared services (lazy init)
# ---------------------------------------------------------------------------

_SVCS: dict[str, Any] | None = None


def _get_svcs() -> dict[str, Any]:
    global _SVCS
    if _SVCS is None:
        settings = get_settings()
        _SVCS = _build_services(settings.registry_dir, settings.context_packs_dir)
    return _SVCS


# ---------------------------------------------------------------------------
# Dispatch helper (used both by SDK server and tests)
# ---------------------------------------------------------------------------


def dispatch_tool(
    tool_name: str,
    arguments: dict[str, Any],
    *,
    actor_id: str = "agent",
    actor_type: str = "agent",
    svcs: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Dispatch a tool call to the registered handler.

    This function is the single call path for both the MCP SDK server and
    the test suite.  All tool functions are called here.

    Each tool in TOOL_REGISTRY has an ``arg_map`` entry that describes how to
    extract its positional argument from the ``arguments`` dict, and which keys
    to forward as keyword arguments.  This replaces the previous if/elif chain
    with a data-driven dispatch map, making it trivial to add new tools without
    touching dispatch logic.

    Args:
        tool_name: MCP tool name (e.g., "asset.search").
        arguments: Input arguments dict.
        actor_id: Caller identity for audit.
        actor_type: "agent" | "user" | "system".
        svcs: Pre-built services dict (injected in tests; defaults to singleton).

    Returns:
        JSON-serialisable dict from the tool handler.
    """
    if svcs is None:
        svcs = _get_svcs()

    entry = TOOL_REGISTRY.get(tool_name)
    if entry is None:
        return {"error": "unknown_tool", "tool_name": tool_name}

    fn = entry["fn"]

    import inspect
    sig = inspect.signature(fn)
    param_names = set(sig.parameters.keys())
    has_var_keyword = any(
        p.kind == inspect.Parameter.VAR_KEYWORD
        for p in sig.parameters.values()
    )

    # Build injected kwargs — only include params the function actually accepts
    kwargs: dict[str, Any] = {"svcs": svcs}
    if "actor_id" in param_names:
        kwargs["actor_id"] = actor_id
    if "actor_type" in param_names:
        kwargs["actor_type"] = actor_type

    # ---------------------------------------------------------------------------
    # Data-driven dispatch map
    # Each entry maps tool_name → (positional_key, extra_keys_to_exclude_from_kwargs)
    # positional_key=None means all arguments are passed as keyword args.
    # ---------------------------------------------------------------------------
    _DISPATCH_MAP: dict[str, tuple[str | None, set[str]]] = {
        "asset.search":         ("query",       {"query"}),
        "asset.get":            ("asset_id",    {"asset_id"}),
        "bom.get":              ("project_id",  {"project_id"}),
        "bom.coverage":         ("project_id",  {"project_id"}),
        "context_pack.create":  ("title",       {"title"}),
        "intent_node.context":  ("node_id",     {"node_id"}),
        "project.snapshot":     ("project_id",  {"project_id"}),
        "atlas.record_event":   ("event_type",  {"event_type"}),
        "content.upload":       (None,          set()),
    }

    dispatch_entry = _DISPATCH_MAP.get(tool_name)

    try:
        if dispatch_entry is not None:
            positional_key, exclude_keys = dispatch_entry
            positional_arg = arguments.get(positional_key, "") if positional_key else None
            extra_kwargs = {k: v for k, v in arguments.items() if k not in exclude_keys}

            if not has_var_keyword:
                extra_kwargs = {k: v for k, v in extra_kwargs.items() if k in param_names}

            kwargs.update(extra_kwargs)

            if positional_arg is not None:
                return fn(positional_arg, **kwargs)
            return fn(**{**arguments, **kwargs})
        else:
            # Fallback: pass all arguments as keyword args (handles unknown/future tools)
            all_kwargs = dict(arguments)
            if not has_var_keyword:
                all_kwargs = {k: v for k, v in all_kwargs.items() if k in param_names}
            return fn(**{**all_kwargs, **kwargs})
    except Exception as exc:
        return {"error": "tool_error", "tool_name": tool_name, "detail": str(exc)}


# ---------------------------------------------------------------------------
# MCP SDK server (only runs when mcp is installed)
# ---------------------------------------------------------------------------


def run_server() -> None:
    """Start the Atlas MCP stdio server.

    Raises ImportError if the mcp SDK is not installed.
    """
    if not _MCP_AVAILABLE:
        raise ImportError(
            "The 'mcp' SDK is not installed. "
            "Install it with: pip install mcp"
        )

    server = Server("artifact-atlas")
    svcs = _get_svcs()

    @server.list_tools()
    async def list_tools() -> list[Tool]:  # type: ignore[name-defined]
        tools = []
        for name, entry in TOOL_REGISTRY.items():
            tools.append(
                Tool(
                    name=name,
                    description=entry["description"],
                    inputSchema=entry["input_schema"],
                )
            )
        return tools

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:  # type: ignore[name-defined]
        result = dispatch_tool(name, arguments, svcs=svcs)
        text = json.dumps(result, indent=2, default=str)
        return [TextContent(type="text", text=text)]

    import asyncio

    async def _run() -> None:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(
                read_stream,
                write_stream,
                server.create_initialization_options(),
            )

    asyncio.run(_run())


if __name__ == "__main__":
    try:
        run_server()
    except ImportError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
