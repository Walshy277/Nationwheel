import { permanentRedirect } from "next/navigation";

export default function LegacyLoreRedirect() {
  permanentRedirect("/lore");
}
