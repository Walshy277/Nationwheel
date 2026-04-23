"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordLoreSpinAction } from "@/app/actions";

const wheelPalette = [
  "#047857",
  "#f59e0b",
  "#2563eb",
  "#e11d48",
  "#7c3aed",
  "#0d9488",
  "#ca8a04",
  "#be185d",
];

type WeightedOption = {
  label: string;
  weight: number;
  startAngle: number;
  endAngle: number;
  centerAngle: number;
  chance: number;
};

function parseWeightedOptions(optionsText: string) {
  const rows = optionsText
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const [rawLabel, rawWeight] = row.split("|").map((part) => part.trim());
      const weight = Number.parseInt(rawWeight ?? "1", 10);
      return {
        label: rawLabel,
        weight: Number.isFinite(weight) && weight > 0 ? weight : 1,
      };
    })
    .filter((row) => row.label.length > 0);

  const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
  let currentAngle = 0;

  return rows.map((row) => {
    const angleSize = totalWeight > 0 ? (row.weight / totalWeight) * 360 : 0;
    const option = {
      label: row.label,
      weight: row.weight,
      startAngle: currentAngle,
      endAngle: currentAngle + angleSize,
      centerAngle: currentAngle + angleSize / 2,
      chance: totalWeight > 0 ? row.weight / totalWeight : 0,
    };
    currentAngle += angleSize;
    return option;
  });
}

function buildWheelGradient(options: WeightedOption[]) {
  return `conic-gradient(${options
    .map((option, index) => {
      const color = wheelPalette[index % wheelPalette.length];
      return `${color} ${option.startAngle}deg ${option.endAngle}deg`;
    })
    .join(", ")})`;
}

function polarCoordinate(angle: number, radiusPercent: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(radians) * radiusPercent}%`,
    top: `${50 + Math.sin(radians) * radiusPercent}%`,
  };
}

function normalizeOptionsForSave(options: WeightedOption[]) {
  return options.map((option) => `${option.label} | ${option.weight}`).join("\n");
}

function displayLabel(label: string) {
  return label.length > 28 ? `${label.slice(0, 25)}...` : label;
}

export function SpinWheel({
  actionId,
  initialOptions,
  initialPrompt,
  title,
}: {
  actionId: string;
  initialOptions: string[];
  initialPrompt: string;
  title: string;
}) {
  const saveSpinResult = recordLoreSpinAction.bind(null, actionId);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [optionsText, setOptionsText] = useState(initialOptions.join("\n"));
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const options = useMemo(() => parseWeightedOptions(optionsText), [optionsText]);
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0);
  const hasEnoughOptions = options.length >= 2;
  const gradient = hasEnoughOptions ? buildWheelGradient(options) : "";
  const winningOption =
    winningIndex !== null ? options[winningIndex] ?? null : null;

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  function spinWheel() {
    if (isSpinning) return;
    if (prompt.trim().length === 0) {
      setError("Add a prompt before spinning.");
      return;
    }
    if (!hasEnoughOptions || totalWeight <= 0) {
      setError("Add at least two weighted options before spinning.");
      return;
    }

    setError(null);
    const targetWeight = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let nextWinningIndex = 0;

    for (const [index, option] of options.entries()) {
      cumulativeWeight += option.weight;
      if (targetWeight <= cumulativeWeight) {
        nextWinningIndex = index;
        break;
      }
    }

    const fullSpins = 6 + Math.floor(Math.random() * 3);
    const centerAngle = options[nextWinningIndex]?.centerAngle ?? 0;
    setWinningIndex(nextWinningIndex);
    setIsSpinning(true);
    setRotation((current) => current + fullSpins * 360 + (360 - centerAngle));

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
    }, 4200);
  }

  return (
    <section className="mt-4 rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-amber-100">
            Weighted Decision Wheel
          </p>
          <h3 className="mt-2 text-lg font-bold text-amber-50">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/80">
            Add the question, set weighted outcomes, spin the wheel, then save
            the full prompt and result back into the lore log.
          </p>
        </div>
        <button
          type="button"
          onClick={spinWheel}
          className="rounded-lg bg-amber-200 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSpinning}
        >
          {isSpinning ? "Spinning..." : "Spin Wheel"}
        </button>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,28rem)]">
        <div className="grid min-w-0 gap-3 2xl:order-1">
          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Prompt
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What is this spin deciding?"
              className="min-h-11 min-w-0 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Weighted Options
            <textarea
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
              placeholder={"Success | 5\nPartial success | 3\nFailure | 1"}
              className="min-h-44 min-w-0 resize-y rounded-lg border border-white/10 bg-black/30 p-3 text-sm font-medium leading-6 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
            />
          </label>
          <p className="text-xs leading-5 text-zinc-400">
            One option per line. Use label | weight. Missing weights default to
            1. The wheel selects by weight, not by visual label size alone.
          </p>
          {error ? <p className="text-sm text-amber-100">{error}</p> : null}

          <form action={saveSpinResult} className="grid gap-3">
            <input type="hidden" name="prompt" value={prompt} />
            <input type="hidden" name="result" value={winningOption?.label ?? ""} />
            <input
              type="hidden"
              name="options"
              value={normalizeOptionsForSave(options)}
            />
            <label className="grid gap-2 text-sm font-semibold text-zinc-100">
              Optional Note
              <textarea
                name="note"
                placeholder="Explain how this result should be applied in canon, if needed."
                className="min-h-24 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
              />
            </label>
            <button
              className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!winningOption || isSpinning || prompt.trim().length === 0}
            >
              Save Spin Result
            </button>
          </form>
        </div>

        <div className="grid min-w-0 content-start gap-4 2xl:order-2">
          <div className="relative mx-auto w-full max-w-[min(100%,22rem)] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(0,0,0,0)_66%)] p-3 sm:max-w-[26rem] sm:p-4 2xl:max-w-[28rem]">
            <div className="pointer-events-none absolute left-1/2 top-1 z-20 h-0 w-0 -translate-x-1/2 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-amber-100 drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] sm:top-2 sm:border-l-[18px] sm:border-r-[18px] sm:border-t-[34px]" />
            <div
              className="relative aspect-square overflow-hidden rounded-full border-[6px] border-white/15 bg-black/30 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:border-[8px]"
              style={{
                backgroundImage: gradient || undefined,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning
                  ? "transform 4.2s cubic-bezier(0.16, 1, 0.3, 1)"
                  : "transform 0.4s ease-out",
              }}
            >
              {hasEnoughOptions ? (
                options.map((option, index) => {
                  const coordinates = polarCoordinate(option.centerAngle, 36);
                  return (
                    <div
                      key={`${option.label}-${index}`}
                      title={option.label}
                      className="absolute max-w-[5.5rem] -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/35 px-1.5 py-1 text-center text-[9px] font-black uppercase leading-3 text-white shadow-sm backdrop-blur-[1px] sm:max-w-[8rem] sm:px-2 sm:text-[10px] sm:leading-4"
                      style={coordinates}
                    >
                      {displayLabel(option.label)}
                    </div>
                  );
                })
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-sm font-semibold text-zinc-300">
                  Add at least two options to render the wheel.
                </div>
              )}
              <div className="absolute left-1/2 top-1/2 z-10 grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-amber-100/30 bg-[#10130f] text-center shadow-xl shadow-black/50 sm:h-24 sm:w-24">
                <span className="px-2 text-[8px] font-black uppercase tracking-wide text-amber-100 sm:px-3 sm:text-[10px]">
                  Nation Wheel
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Current Result
            </p>
            <p className="mt-2 text-2xl font-black text-zinc-50">
              {winningOption?.label ?? "Not spun yet"}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {winningOption
                ? `Weight ${winningOption.weight} · ${(winningOption.chance * 100).toFixed(1)}% chance`
                : "Spin first, then save the selected outcome into the lore update feed."}
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-bold uppercase text-zinc-500">
              Weight Table
            </p>
            <div className="mt-3 grid gap-2">
              {options.map((option, index) => (
                <div
                  key={`${option.label}-odds-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-100">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          wheelPalette[index % wheelPalette.length],
                      }}
                    />
                    <span className="truncate">{option.label}</span>
                  </span>
                  <span className="text-zinc-400">
                    {option.weight} · {(option.chance * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
              {options.length === 0 ? (
                <p className="text-sm text-zinc-400">No options loaded.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
