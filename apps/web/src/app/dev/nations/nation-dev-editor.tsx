"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CanonNation } from "@nation-wheel/shared";

type EditableNation = CanonNation;
type TextFieldKey = Exclude<keyof EditableNation, "actions" | "statNotes">;

const emptyNation: EditableNation = {
  spin: "",
  name: "",
  slug: "",
  people: "",
  government: "",
  gdp: "",
  economy: "",
  military: "",
};

const fields: Array<{ key: TextFieldKey; label: string; required?: boolean }> =
  [
    { key: "spin", label: "Spin" },
    { key: "name", label: "Name", required: true },
    { key: "people", label: "Population", required: true },
    { key: "government", label: "Government", required: true },
    { key: "gdp", label: "GDP", required: true },
    { key: "economy", label: "Economy", required: true },
    { key: "military", label: "Military", required: true },
    { key: "area", label: "Area" },
    { key: "geoPoliticalStatus", label: "Geo-political Status" },
    { key: "block", label: "Block" },
    { key: "culture", label: "Culture" },
    { key: "hdi", label: "HDI" },
  ];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NationDevEditor() {
  const [nations, setNations] = useState<EditableNation[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [draft, setDraft] = useState<EditableNation>(emptyNation);
  const [canWrite, setCanWrite] = useState(false);
  const [sourcePath, setSourcePath] = useState("");
  const [status, setStatus] = useState("Loading nations...");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void fetch("/api/dev/nations")
      .then((response) => response.json())
      .then(
        (data: {
          nations: EditableNation[];
          canWrite: boolean;
          sourcePath: string;
        }) => {
          setNations(data.nations);
          setCanWrite(data.canWrite);
          setSourcePath(data.sourcePath);
          setStatus(
            data.canWrite
              ? "Ready to edit local canon data."
              : "Read-only on this deployment. Run the app locally to save.",
          );
          const first = data.nations[0];
          if (first) {
            setSelectedSlug(first.slug);
            setDraft(first);
          }
        },
      )
      .catch(() => setStatus("Could not load nation data."));
  }, []);

  const filteredNations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return nations;
    return nations.filter((nation) =>
      `${nation.name} ${nation.slug} ${nation.government}`
        .toLowerCase()
        .includes(needle),
    );
  }, [nations, query]);

  function selectNation(slug: string) {
    const nation = nations.find((candidate) => candidate.slug === slug);
    if (!nation) return;
    setSelectedSlug(slug);
    setDraft(nation);
    setStatus(`Editing ${nation.name}.`);
  }

  function updateDraft(key: TextFieldKey, value: string) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (
        key === "name" &&
        (!current.slug || current.slug === slugify(current.name))
      ) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  function addNation() {
    const spin = `#${nations.length + 1}`;
    setDraft({ ...emptyNation, spin });
    setSelectedSlug("");
    setStatus("Adding a new nation.");
  }

  function applyDraft() {
    const cleaned = {
      ...draft,
      slug: draft.slug || slugify(draft.name),
    };

    if (!cleaned.name.trim() || !cleaned.slug.trim()) {
      setStatus("Name is required.");
      return;
    }

    setNations((current) => {
      const existingIndex = selectedSlug
        ? current.findIndex((nation) => nation.slug === selectedSlug)
        : -1;
      if (existingIndex >= 0) {
        return current.map((nation, index) =>
          index === existingIndex ? cleaned : nation,
        );
      }
      return [...current, cleaned];
    });
    setSelectedSlug(cleaned.slug);
    setDraft(cleaned);
    setStatus(`${cleaned.name} is staged. Save changes to update the files.`);
  }

  function removeSelected() {
    if (!selectedSlug) return;
    const next = nations.filter((nation) => nation.slug !== selectedSlug);
    setNations(next);
    const first = next[0];
    setSelectedSlug(first?.slug ?? "");
    setDraft(first ?? emptyNation);
    setStatus(
      "Nation removed from staged data. Save changes to update the files.",
    );
  }

  async function saveChanges() {
    setStatus("Saving canon files...");
    const response = await fetch("/api/dev/nations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nations }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error ?? "Save failed.");
      return;
    }
    setNations(data.nations);
    setStatus("Saved Nation Wheel Status.txt and canon-nations.ts.");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.4fr_0.6fr]">
      <section className="rounded-lg border border-white/10 bg-[color:var(--panel)]/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-50">Nations</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {nations.length} records
            </p>
          </div>
          <button
            type="button"
            onClick={addNation}
            className="rounded-lg border border-emerald-300/70 px-3 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-900/10"
          >
            Add
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search nations"
          className="mt-4 w-full px-3 py-2 text-zinc-100"
        />
        <div className="mt-4 grid max-h-[62vh] gap-2 overflow-y-auto pr-1">
          {filteredNations.map((nation) => (
            <button
              key={nation.slug}
              type="button"
              onClick={() => selectNation(nation.slug)}
              className={`rounded-lg border px-3 py-2 text-left ${
                selectedSlug === nation.slug
                  ? "border-emerald-300/80 bg-emerald-300/10"
                  : "border-white/10 bg-black/20 hover:border-zinc-500"
              }`}
            >
              <span className="block font-bold text-zinc-100">
                {nation.name}
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {nation.government}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[color:var(--panel)]/90 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-zinc-50">
              {selectedSlug ? "Edit Nation" : "Add Nation"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {sourcePath || "Canon source"}
            </p>
          </div>
          <Link
            href={draft.slug ? `/nations/${draft.slug}` : "/nations"}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm font-bold text-zinc-100 hover:bg-white/5"
          >
            View Profile
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {fields.map((field) => (
            <label
              key={field.key}
              className="grid gap-1 text-sm font-semibold text-zinc-300"
            >
              {field.label}
              <input
                value={draft[field.key] ?? ""}
                required={field.required}
                onChange={(event) => updateDraft(field.key, event.target.value)}
                className="px-3 py-2 font-normal text-zinc-100"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyDraft}
            className="rounded-lg bg-emerald-900 px-4 py-2 font-bold text-emerald-50 hover:bg-emerald-800"
          >
            Stage Nation
          </button>
          <button
            type="button"
            onClick={saveChanges}
            disabled={!canWrite}
            className="rounded-lg border border-emerald-300/70 px-4 py-2 font-bold text-emerald-100 hover:bg-emerald-900/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save Files
          </button>
          <button
            type="button"
            onClick={removeSelected}
            disabled={!selectedSlug}
            className="rounded-lg border border-red-300/70 px-4 py-2 font-bold text-red-100 hover:bg-red-300/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Remove
          </button>
        </div>

        <p className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
          {status}
        </p>
      </section>
    </div>
  );
}
