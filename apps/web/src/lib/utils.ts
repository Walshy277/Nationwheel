import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}
