import type { Asset, AssetLink } from "@/lib/types";

export interface ReportGeneratedFrom {
  repo?: string | null;
  ref?: string | null;
  commit?: string | null;
}

export interface DeliveryReportMetadata {
  route?: string | null;
  revision?: string | number | null;
  truth_status?: string | null;
  generated_from?: ReportGeneratedFrom | null;
  generated_at?: string | null;
}

export interface ProjectReportRow {
  asset: Asset;
  metadata: DeliveryReportMetadata;
  trackerLinks: AssetLink[];
}

export function utcDateBucket(value: string | null | undefined): string {
  if (!value) return "__unknown__";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "__unknown__" : date.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null | undefined {
  return typeof value === "string" || value === null ? value : undefined;
}

/**
 * Narrow the free-form report metadata envelope without asserting that upstream
 * fields are present. Unknown and malformed values degrade to the UI's em dash.
 */
export function parseDeliveryReportMetadata(
  raw: Record<string, unknown> | null | undefined,
): DeliveryReportMetadata {
  if (!isRecord(raw)) return {};

  const generatedFrom = isRecord(raw.generated_from)
    ? {
        repo: optionalString(raw.generated_from.repo),
        ref: optionalString(raw.generated_from.ref),
        commit: optionalString(raw.generated_from.commit),
      }
    : raw.generated_from === null
      ? null
      : undefined;

  const revision = raw.revision;

  return {
    route: optionalString(raw.route),
    revision:
      typeof revision === "string" ||
      typeof revision === "number" ||
      revision === null
        ? revision
        : undefined,
    truth_status: optionalString(raw.truth_status),
    generated_from: generatedFrom,
    generated_at: optionalString(raw.generated_at),
  };
}
