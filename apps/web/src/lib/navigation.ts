export function normalizeNavHref(href: string) {
  return href.split("#")[0] ?? href;
}

export function isActivePath(pathname: string, href: string) {
  const normalizedHref = normalizeNavHref(href);
  if (normalizedHref === "/") return pathname === "/";
  if (pathname === normalizedHref) return true;
  return pathname.startsWith(`${normalizedHref}/`);
}
