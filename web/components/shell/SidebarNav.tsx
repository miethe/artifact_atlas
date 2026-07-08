"use client";

/**
 * SidebarNav — project-scoped navigation sidebar.
 * Links: project overview / assets / inbox / intent-node / board / bom / templates / context-packs.
 * Keyboard navigable; active link highlighted via aria-current.
 */

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FolderOpen,
  Inbox,
  GitBranch,
  Kanban,
  Package,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Boxes,
  BarChart2,
  ArrowRightLeft,
} from "lucide-react";
import { useProject, useProjects } from "@/lib/hooks/useProjects";

// Default seed project id used when no project is in context
export const DEFAULT_PROJECT_ID = "proj_artifact_atlas";

interface NavItem {
  label: string;
  href: (projectId: string) => string;
  icon: React.ElementType;
  exact?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Project",
    items: [
      {
        label: "Overview",
        href: (id) => `/projects/${id}`,
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        label: "Assets",
        href: (id) => `/projects/${id}/assets`,
        icon: FolderOpen,
      },
      {
        label: "Inbox",
        href: (id) => `/projects/${id}/inbox`,
        icon: Inbox,
      },
      {
        label: "Intent Nodes",
        href: (id) => `/projects/${id}/intent-nodes`,
        icon: GitBranch,
      },
      {
        label: "Board",
        href: (id) => `/projects/${id}/board`,
        icon: Kanban,
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "Artifact BOM",
        href: (id) => `/projects/${id}/bom`,
        icon: Package,
      },
      {
        label: "Templates",
        href: (id) => `/projects/${id}/templates`,
        icon: FileText,
      },
      {
        label: "Coverage & Gaps",
        href: (id) => `/projects/${id}/coverage`,
        icon: BarChart2,
      },
      {
        label: "Inbox → BOM",
        href: (id) => `/projects/${id}/bom-mapping`,
        icon: ArrowRightLeft,
      },
      {
        label: "Context Packs",
        href: (id) => `/projects/${id}/context-packs`,
        icon: Layers,
      },
    ],
  },
];

// ============================================================
// ProjectSwitcher — collapsible project pill below the brand mark (P2-9)
// ============================================================

function ProjectAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "xs" }) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden
      className={clsx(
        "flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0",
        size === "xs" ? "w-5 h-5 text-[10px]" : "w-6 h-6 text-[11px]",
      )}
    >
      {initial}
    </span>
  );
}

function ProjectSwitcher({
  projectId,
  collapsed,
}: {
  projectId: string;
  collapsed: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const { data: current } = useProject(projectId);
  const { data: projectsPage } = useProjects();
  const projects = projectsPage?.items ?? [];

  React.useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currentName = current?.name ?? projectId;

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative border-b border-[var(--border)] shrink-0",
        collapsed ? "px-0 py-2" : "px-2 py-2",
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? currentName : undefined}
        className={clsx(
          "flex items-center gap-2 w-full rounded py-1 text-left",
          "hover:bg-gray-100 transition-colors duration-[100ms]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          collapsed ? "justify-center px-0" : "px-1.5",
        )}
      >
        <ProjectAvatar name={currentName} size={collapsed ? "xs" : "sm"} />
        {!collapsed && (
          <>
            <span className="flex-1 min-w-0 text-xs font-medium text-[var(--ink)] truncate">
              {currentName}
            </span>
            <ChevronsUpDown
              className="w-3.5 h-3.5 text-gray-400 shrink-0"
              aria-hidden
            />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Switch project"
          className={clsx(
            "absolute z-30 mt-1 min-w-[192px] max-h-64 overflow-y-auto",
            "bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg py-1",
            collapsed ? "left-1" : "left-1.5 right-1.5",
          )}
        >
          {projects.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-[var(--ink-faint)]">
              No projects found
            </p>
          )}
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={clsx(
                "flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-50",
                p.id === projectId
                  ? "text-blue-700 font-medium bg-blue-50/60"
                  : "text-[var(--ink)]",
              )}
            >
              <ProjectAvatar name={p.name} size="xs" />
              <span className="truncate">{p.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarNavProps {
  projectId?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function SidebarNav({
  projectId = DEFAULT_PROJECT_ID,
  collapsed = false,
  onCollapsedChange,
}: SidebarNavProps) {
  const pathname = usePathname();

  function isActive(item: NavItem): boolean {
    const href = item.href(projectId);
    if (item.exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Project navigation"
      className={clsx(
        "flex flex-col h-full border-r border-[var(--border)] bg-[var(--surface)] transition-all duration-200",
        collapsed ? "w-12" : "w-52",
      )}
    >
      {/* Brand */}
      <div
        className={clsx(
          "flex items-center gap-2 px-3 h-11 border-b border-[var(--border)] shrink-0",
          collapsed && "justify-center px-0",
        )}
      >
        <Boxes className="w-5 h-5 text-blue-600 shrink-0" aria-hidden />
        {!collapsed && (
          <span className="text-sm font-semibold text-[var(--ink)] truncate">
            Artifact Atlas
          </span>
        )}
      </div>

      {/* Project switcher pill (P2-9) */}
      <ProjectSwitcher projectId={projectId} collapsed={collapsed} />

      {/* Nav sections */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5">
        {NAV_SECTIONS.map((section, sIdx) => (
          <div key={section.label} className={clsx(sIdx > 0 && "mt-3")}>
            {/* Section label — hidden when collapsed */}
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--ink-faint)]">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5" role="list">
              {section.items.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href(projectId)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={clsx(
                        "flex items-center gap-2.5 py-1.5 text-sm transition-colors duration-[100ms]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        /* Active: left accent bar + blue highlight */
                        active
                          ? "border-l-4 border-brand-500 bg-blue-50 text-blue-700 font-medium pl-1.5 pr-2 rounded-r"
                          : "border-l-4 border-transparent pl-1.5 pr-2 rounded hover:bg-gray-100 hover:text-[var(--ink)] text-[var(--ink-muted)]",
                        collapsed && "justify-center pl-0 pr-0 border-l-0",
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-4 h-4 shrink-0",
                          active ? "text-blue-600" : "text-gray-400",
                        )}
                        aria-hidden
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      {onCollapsedChange && (
        <div className="shrink-0 border-t border-[var(--border)] p-1.5">
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={clsx(
              "w-full flex items-center justify-center rounded py-1 text-gray-400",
              "hover:bg-gray-100 hover:text-gray-600 transition-colors duration-[100ms]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5" aria-hidden />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" aria-hidden />
            )}
            {!collapsed && (
              <span className="ml-1.5 text-xs">Collapse</span>
            )}
          </button>
        </div>
      )}
    </nav>
  );
}
