import { config } from "./config";
import { canonNations } from "@nation-wheel/shared";

export type ApiNation = {
  id: string;
  name: string;
  slug: string;
  people: string;
  government: string;
  gdp: string;
  economy: string;
  military: string;
  area?: string | null;
  geoPoliticalStatus?: string | null;
  block?: string | null;
  culture?: string | null;
  hdi?: string | null;
  statNotes?: string[];
  actions?: Array<{
    nation: string;
    type: string;
    action: string;
  }>;
  wiki?: { content: string } | null;
};

export type ApiLoreAction = {
  id: string;
  nationId: string;
  type: string;
  action: string;
  source?: string | null;
  timeframe: string;
  status: "CURRENT" | "COMPLETED" | "REQUIRES_SPIN";
  requiresSpinReason?: string | null;
  nation?: { name: string; slug: string };
};

export class NationWheelApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NationWheelApiError";
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let response: Response;

  try {
    response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(config.botApiKey
          ? { "x-nation-wheel-bot-key": config.botApiKey }
          : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new NationWheelApiError(
      error instanceof Error
        ? error.message
        : "Nation Wheel API request failed.",
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = (await response.json()) as { error?: string };
      detail = body.error ? ` ${body.error}` : "";
    } catch {
      detail = "";
    }

    throw new NationWheelApiError(
      `Nation Wheel API failed: ${response.status}.${detail}`,
    );
  }

  return (await response.json()) as T;
}

export async function getNationBySlug(slug: string) {
  try {
    const result = await apiFetch<{ nation: ApiNation }>(
      `/nations/slug/${encodeURIComponent(slug)}`,
    );
    return result.nation;
  } catch (error) {
    const nation = canonNations.find((candidate) => candidate.slug === slug);
    if (!nation) throw error;
    return {
      ...nation,
      id: `canon-${nation.slug}`,
      wiki: null,
    };
  }
}

export async function listNations() {
  try {
    const result = await apiFetch<{ nations: ApiNation[] }>("/nations");
    return result.nations;
  } catch {
    return canonNations.map((nation) => ({
      ...nation,
      id: `canon-${nation.slug}`,
      wiki: null,
    }));
  }
}

export async function createTrackedAction(input: {
  nationSlug: string;
  type: string;
  action: string;
  timeframe: string;
  source?: string | null;
  requiresSpinReason?: string | null;
}) {
  const result = await apiFetch<{ action: ApiLoreAction }>("/actions", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      status: input.requiresSpinReason ? "REQUIRES_SPIN" : "CURRENT",
    }),
  });

  return result.action;
}
