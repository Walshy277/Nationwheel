export function spinOptionsFromReason(reason: string | null) {
  if (!reason) return ["Success | 1", "Failure | 1"];

  const candidates = reason
    .split(/\r?\n|[;,]/)
    .map((entry) => entry.replace(/^spin needed:\s*/i, "").trim())
    .filter((entry) => entry.length >= 2);

  const unique = Array.from(new Set(candidates)).slice(0, 12);
  return unique.length
    ? unique.map((entry) => (entry.includes("|") ? entry : `${entry} | 1`))
    : ["Success | 1", "Failure | 1"];
}
