"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { recordLoreSpinAction } from "@/app/actions";

const wheelPalette = [
  "#14532d",
  "#166534",
  "#854d0e",
  "#7c2d12",
  "#1d4ed8",
  "#7e22ce",
  "#be123c",
  "#0f766e",
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

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Prompt
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="What is this spin deciding?"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Weighted Options
            <textarea
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
              placeholder={"Success | 5\nPartial success | 3\nFailure | 1"}
              className="min-h-36 rounded-lg border border-white/10 bg-black/30 p-3 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
            />
          </label>
          <p className="text-xs leading-5 text-zinc-400">
            One option per line. Use `label | weight`. Missing weights default
            to 1.
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

        <div className="grid content-start gap-4">
          <div className="relative mx-auto w-full max-w-[24rem]">
            <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-0 w-0 -translate-x-1/2 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-amber-100 drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]" />
            <div
              className="relative aspect-square overflow-hidden rounded-full border-[6px] border-white/15 bg-black/30 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
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
                  const coordinates = polarCoordinate(option.centerAngle, 34);
                  return (
                    <div
                      key={`${option.label}-${index}`}
                      className="absolute max-w-[7rem] -translate-x-1/2 -translate-y-1/2 text-center text-[10px] font-black uppercase leading-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.85)]"
                      style={coordinates}
                    >
                      {option.label}
                    </div>
                  );
                })
              ) : (
                <div className="grid h-full place-items-center p-8 text-center text-sm font-semibold text-zinc-300">
                  Add at least two options to render the wheel.
                </div>
              )}
              <div className="absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-[#10130f] text-center shadow-xl shadow-black/40">
                <span className="px-3 text-[10px] font-black uppercase tracking-wide text-zinc-400">
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
                  <span className="font-bold text-zinc-100">{option.label}</span>
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
