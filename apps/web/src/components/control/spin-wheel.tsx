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

function polarCoordinate(angle: number, radiusPercent: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    left: `${50 + Math.cos(radians) * radiusPercent}%`,
    top: `${50 + Math.sin(radians) * radiusPercent}%`,
  };
}

function buildWheelGradient(optionCount: number) {
  const slice = 360 / optionCount;
  const segments = Array.from({ length: optionCount }, (_, index) => {
    const start = index * slice;
    const end = start + slice;
    const color = wheelPalette[index % wheelPalette.length];
    return `${color} ${start}deg ${end}deg`;
  });

  return `conic-gradient(${segments.join(", ")})`;
}

export function SpinWheel({
  actionId,
  initialOptions,
  title,
}: {
  actionId: string;
  initialOptions: string[];
  title: string;
}) {
  const saveSpinResult = recordLoreSpinAction.bind(null, actionId);
  const [optionsText, setOptionsText] = useState(initialOptions.join("\n"));
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const options = useMemo(
    () =>
      optionsText
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean),
    [optionsText],
  );
  const hasEnoughOptions = options.length >= 2;
  const winningOption =
    winningIndex !== null ? options[winningIndex] ?? null : null;
  const gradient = hasEnoughOptions ? buildWheelGradient(options.length) : "";
  const slice = hasEnoughOptions ? 360 / options.length : 0;

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
    if (!hasEnoughOptions) {
      setError("Add at least two options before spinning.");
      return;
    }

    setError(null);
    const nextWinningIndex = Math.floor(Math.random() * options.length);
    const centerAngle = nextWinningIndex * slice + slice / 2;
    const fullSpins = 6 + Math.floor(Math.random() * 3);
    setWinningIndex(nextWinningIndex);
    setIsSpinning(true);
    setRotation(
      (current) => current + fullSpins * 360 + (360 - centerAngle),
    );

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
            Decision Wheel
          </p>
          <h3 className="mt-2 text-lg font-bold text-amber-50">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-amber-100/80">
            Enter one option per line, spin the wheel, then save the result back
            into the action log.
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

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3">
          <label className="grid gap-2 text-sm font-semibold text-zinc-100">
            Wheel Options
            <textarea
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
              placeholder={"Option 1\nOption 2\nOption 3"}
              className="min-h-32 rounded-lg border border-white/10 bg-black/30 p-3 text-sm font-medium text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
            />
          </label>
          <p className="text-xs leading-5 text-zinc-400">
            {options.length} option{options.length === 1 ? "" : "s"} loaded.
            Blank lines are ignored.
          </p>
          {error ? <p className="text-sm text-amber-100">{error}</p> : null}

          <form action={saveSpinResult} className="grid gap-3">
            <input type="hidden" name="result" value={winningOption ?? ""} />
            <input type="hidden" name="options" value={options.join("\n")} />
            <label className="grid gap-2 text-sm font-semibold text-zinc-100">
              Optional Note
              <textarea
                name="note"
                placeholder="Explain why this result is being applied in canon, if needed."
                className="min-h-24 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-300/50"
              />
            </label>
            <button
              className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-bold text-emerald-50 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!winningOption || isSpinning}
            >
              Save Spin Result
            </button>
          </form>
        </div>

        <div className="grid content-start gap-4">
          <div className="relative mx-auto w-full max-w-[22rem]">
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
                  const centerAngle = index * slice + slice / 2;
                  const coordinates = polarCoordinate(centerAngle, 34);
                  return (
                    <div
                      key={`${option}-${index}`}
                      className="absolute max-w-[7rem] -translate-x-1/2 -translate-y-1/2 text-center text-[11px] font-black uppercase leading-4 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
                      style={coordinates}
                    >
                      {option}
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
              {winningOption ?? "Not spun yet"}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {winningOption
                ? "Save to move the action back into the current queue and log the result."
                : "Spin first, then save the selected outcome into the lore update feed."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
