export type DeskTheme = "dark" | "light";

export const DESK_THEME_STORAGE_KEY = "tradepulse.desk-theme";

export function resolveDeskTheme(storedTheme: string | null): DeskTheme {
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return "light";
}

export function nextDeskTheme(theme: DeskTheme): DeskTheme {
  return theme === "dark" ? "light" : "dark";
}
