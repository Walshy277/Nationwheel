import { promises as fs } from "node:fs";
import path from "node:path";
import {
  canonNations,
  normalizeGovernment,
  type CanonNation,
} from "@nation-wheel/shared";
import { Role } from "@prisma/client";
import { jsonError, requireRole } from "@/lib/permissions";

type EditableNation = CanonNation;

const STATUS_FILE = "Nation Wheel Status.txt";
const CANON_FILE = path.join("packages", "shared", "src", "canon-nations.ts");

const fieldLabels: Array<[keyof EditableNation, string]> = [
  ["people", "People"],
  ["government", "Government"],
  ["gdp", "GDP"],
  ["economy", "Economy"],
  ["military", "Military"],
  ["area", "Area"],
  ["geoPoliticalStatus", "Geo-Political Status"],
  ["block", "Block"],
  ["culture", "Culture"],
  ["hdi", "HDI"],
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getExistingSlug(name: string) {
  return canonNations.find(
    (nation) => normalizeName(nation.name) === normalizeName(name),
  )?.slug;
}

function splitEconomyAndGdp(
  gdp: string | undefined,
  economy: string | undefined,
) {
  if (gdp?.trim() || !economy?.includes(" - ")) {
    return { gdp: gdp ?? "", economy: economy ?? "" };
  }

  const [rawGdp, ...economyParts] = economy.split(" - ");
  return {
    gdp: rawGdp
      .trim()
      .replace(",", ".")
      .replace(/\s+([KMBT])$/i, "$1"),
    economy: economyParts.join(" - ").trim(),
  };
}

function splitNotes(value: string | undefined) {
  return value
    ?.split("|")
    .map((note) => note.trim())
    .filter(Boolean);
}

function splitActions(value: string | undefined) {
  return value
    ?.split("|")
    .map((entry) => {
      const [nation, type, ...actionParts] = entry
        .split("::")
        .map((part) => part.trim());
      const action = actionParts.join("::").trim();
      return nation && type && action ? { nation, type, action } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
}

async function findWorkspaceRoot() {
  let current = process.cwd();

  for (let index = 0; index < 8; index += 1) {
    try {
      await fs.access(path.join(current, "package.json"));
      await fs.access(path.join(current, "packages", "shared", "src"));
      return current;
    } catch {
      current = path.dirname(current);
    }
  }

  return process.cwd();
}

function parseStatusText(content: string): EditableNation[] {
  const normalized = content.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const nations: EditableNation[] = [];
  let currentName: string | null = null;
  let fields = new Map<string, string>();

  function pushCurrent() {
    if (!currentName) return;
    const name = currentName.trim();
    if (!name || name.toLowerCase() === "nation wheel status") return;
    const splitValues = splitEconomyAndGdp(
      fields.get("gdp"),
      fields.get("economy"),
    );

    const nation: EditableNation = {
      spin: `#${nations.length + 1}`,
      name,
      slug: getExistingSlug(name) ?? slugify(name),
      people: fields.get("people") ?? "",
      government: fields.get("government") ?? "",
      gdp: splitValues.gdp,
      economy: splitValues.economy,
      military: fields.get("military") ?? "",
      area: fields.get("area") ?? fields.get("size"),
      geoPoliticalStatus: fields.get("geo-political status"),
      block: fields.get("block"),
      culture: fields.get("culture"),
      hdi: fields.get("hdi"),
      statNotes: splitNotes(fields.get("stat notes")),
      actions: splitActions(fields.get("actions")),
    };

    nations.push(stripEmptyFields(nation));
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const fieldMatch = line.match(/^\*\s*([^:]+?)\s*:\s*(.*)$/);
    if (fieldMatch) {
      fields.set(fieldMatch[1].trim().toLowerCase(), fieldMatch[2].trim());
      continue;
    }

    pushCurrent();
    currentName = line;
    fields = new Map();
  }

  pushCurrent();
  return nations;
}

function stripEmptyFields(nation: EditableNation) {
  const cleaned: EditableNation = {
    spin: nation.spin,
    name: nation.name.trim(),
    slug: (nation.slug || slugify(nation.name)).trim(),
    people: nation.people.trim(),
    government: normalizeGovernment(nation.government),
    gdp: nation.gdp.trim(),
    economy: nation.economy.trim(),
    military: nation.military.trim(),
  };

  for (const key of [
    "area",
    "geoPoliticalStatus",
    "block",
    "culture",
    "hdi",
  ] as const) {
    const value = nation[key]?.trim();
    if (value) cleaned[key] = value;
  }

  if (nation.statNotes?.length) {
    cleaned.statNotes = nation.statNotes
      .map((note) => note.trim())
      .filter(Boolean);
  }
  if (nation.actions?.length) {
    cleaned.actions = nation.actions
      .map((entry) => ({
        nation: entry.nation.trim(),
        type: entry.type.trim(),
        action: entry.action.trim(),
      }))
      .filter((entry) => entry.nation && entry.type && entry.action);
  }

  return cleaned;
}

function toStatusText(nations: EditableNation[]) {
  const blocks = nations.map((nation) => {
    const lines = [nation.name, ""];
    for (const [key, label] of fieldLabels) {
      const value = nation[key];
      if (typeof value === "string" && value.trim()) {
        lines.push(` * ${label}: ${value.trim()}`);
      }
    }
    if (nation.statNotes?.length) {
      lines.push(` * Stat Notes: ${nation.statNotes.join(" | ")}`);
    }
    if (nation.actions?.length) {
      lines.push(
        ` * Actions: ${nation.actions.map((entry) => `${entry.nation} :: ${entry.type} :: ${entry.action}`).join(" | ")}`,
      );
    }
    return lines.join("\n");
  });

  return `Nation Wheel Status\n\n\n${blocks.join("\n\n")}\n`;
}

function toCanonSource(nations: EditableNation[]) {
  const normalized = nations.map((nation, index) =>
    stripEmptyFields({
      ...nation,
      spin: nation.spin?.trim() || `#${index + 1}`,
      slug: nation.slug?.trim() || slugify(nation.name),
    }),
  );

  return `import type { NationStats } from "./index";

export type CanonNation = NationStats & {
  spin: string;
};

export const canonNations: CanonNation[] = ${JSON.stringify(normalized, null, 2)};
`;
}

async function readNationsFromSource(workspaceRoot: string) {
  try {
    const content = await fs.readFile(
      path.join(workspaceRoot, STATUS_FILE),
      "utf8",
    );
    const parsed = parseStatusText(content);
    return parsed.length > 0 ? parsed : canonNations;
  } catch {
    return canonNations;
  }
}

function canWrite() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ENABLE_DEV_NATION_EDITOR === "true"
  );
}

export async function GET() {
  try {
    await requireRole([Role.ADMIN]);
    const workspaceRoot = await findWorkspaceRoot();
    const nations = await readNationsFromSource(workspaceRoot);

    return Response.json({
      nations,
      canWrite: canWrite(),
      sourcePath: path.join(workspaceRoot, STATUS_FILE),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole([Role.ADMIN]);

    if (!canWrite()) {
      return Response.json(
        { error: "The nation dev editor can only save from local dev." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { nations?: EditableNation[] };
    if (!Array.isArray(body.nations)) {
      return Response.json(
        { error: "Expected a nations array." },
        { status: 400 },
      );
    }

    const nations = body.nations
      .map((nation, index) =>
        stripEmptyFields({
          ...nation,
          spin: nation.spin?.trim() || `#${index + 1}`,
          slug: nation.slug?.trim() || slugify(nation.name),
        }),
      )
      .filter((nation) => nation.name && nation.slug);

    const workspaceRoot = await findWorkspaceRoot();
    await fs.writeFile(
      path.join(workspaceRoot, STATUS_FILE),
      toStatusText(nations),
      "utf8",
    );
    await fs.writeFile(
      path.join(workspaceRoot, CANON_FILE),
      toCanonSource(nations),
      "utf8",
    );

    return Response.json({
      nations,
      saved: true,
      sourcePath: path.join(workspaceRoot, STATUS_FILE),
      canonPath: path.join(workspaceRoot, CANON_FILE),
    });
  } catch (error) {
    return jsonError(error);
  }
}
