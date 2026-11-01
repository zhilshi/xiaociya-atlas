import { useSyncExternalStore } from "react";
import { transition } from "./motion";

export type Route =
  | { page: "today" }
  | { page: "garden"; bed?: string }
  | { page: "learn" }
  | { page: "practice" }
  | { page: "me" }
  | { page: "about" };

export interface Location {
  route: Route;
  /** Word card open on top of the route. */
  word: string | null;
}

export function parse(hash: string): Location {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(query);
  const word = params.get("w");
  const seg = path.split("/").filter(Boolean);
  let route: Route = { page: "today" };
  if (seg[0] === "garden") route = { page: "garden", bed: params.get("bed") || undefined };
  else if (seg[0] === "learn") route = { page: "learn" };
  else if (seg[0] === "practice") route = { page: "practice" };
  else if (seg[0] === "me") route = { page: "me" };
  else if (seg[0] === "about") route = { page: "about" };
  return { route, word };
}

export function href(route: Route, word?: string | null) {
  const params = new URLSearchParams();
  if (route.page === "garden" && route.bed) params.set("bed", route.bed);
  if (word) params.set("w", word);
  const q = params.toString();
  return `#/${route.page === "today" ? "" : route.page}${q ? `?${q}` : ""}`;
}

let loc = typeof location === "undefined" ? parse("") : parse(location.hash);
const subs = new Set<() => void>();
const set = (next: Location, animate: boolean) => {
  const update = () => {
    loc = next;
    subs.forEach((f) => f());
  };
  if (animate) transition(update);
  else update();
};
if (typeof window !== "undefined")
  window.addEventListener("hashchange", () => {
    const next = parse(location.hash);
    set(next, next.route.page !== loc.route.page && !next.word);
  });

export const useLocation = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => loc,
  );

export function go(route: Route, word?: string | null, replace = false) {
  const h = href(route, word);
  if (replace) history.replaceState(null, "", h);
  else history.pushState(null, "", h);
  const next = parse(h);
  set(next, next.route.page !== loc.route.page && !replace);
}

export const openWord = (id: string) => go(loc.route, id);
export const closeWord = () => go(loc.route, null, true);
