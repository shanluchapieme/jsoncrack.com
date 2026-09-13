// Shared visual vocabulary for every typed node/state this app renders --
// the Object Inspector, the typed graph canvas, and the Coverage Matrix all
// read from this one place so a class or state never looks different in
// one view than another.

export const TOMATO = "#ff5a3c";
export const IVORY = "#f2ece2";
export const BLACK = "#0b0b0c";

export const CLASS_META: Record<string, { icon: string; label: string; blurb: string }> = {
  FORMATION: { icon: "◈", label: "Market formation", blurb: "A real product-need combination this system has built a full evidence graph for." },
  MARKET_MOMENT: { icon: "○", label: "Market moment", blurb: "A stage in the customer journey (ask, find, watch, shop, buy...). Structural -- not a thing that exists on any platform, a grouping we impose to organize real evidence under." },
  PRODUCT: { icon: "■", label: "Product", blurb: "A real SKU observed in the supply graph -- price/availability are point-in-time snapshots, not a live feed." },
  RETAILER: { icon: "⌂", label: "Retailer", blurb: "A real retailer surface checked for whether this product is actually answerable/buyable there." },
  CREATOR: { icon: "☺", label: "Creator", blurb: "A real, resolved handle on a platform -- identity confirmed, not a follower/engagement profile." },
  VIDEO: { icon: "▶", label: "Video", blurb: "A real piece of content directly navigated to and confirmed to exist." },
  MACHINE_ROUTE: { icon: "⚙", label: "AI answer observation", blurb: "A real captured response from an AI answer engine (ChatGPT, Gemini, etc.) for this query." },
  CANARY: { icon: "◉", label: "Search monitor", blurb: "One of Google's 1,133 Trends categories, with a real live/rate-limited/potential observation state." },
  UNKNOWN: { icon: "?", label: "Open question", blurb: "A real, named gap in what we know -- not a placeholder, an actual unresolved question." },
  WITNESS: { icon: "→", label: "Proposed next check", blurb: "A concrete, specific action that would resolve an open question -- not yet run." },
  EVIDENCE_REF: { icon: "≣", label: "Evidence reference", blurb: "A lower-confidence supporting signal, kept separate from proven identity/relationship claims." },
};

export function classMeta(objectClass: string | undefined) {
  return CLASS_META[objectClass || ""] || { icon: "●", label: objectClass || "Unclassified", blurb: "" };
}

export const STATE_COLOR: Record<string, string> = {
  EARNED: "#3ecf6e", OBSERVED: "#3ecf6e", LIVE_HEALTHY: "#3ecf6e", IDENTITY_PROVEN: "#3ecf6e", PROVEN: "#3ecf6e",
  PARTIALLY_EARNED: "#e8b13a", LIVE_RATE_LIMITED: "#e8b13a", PARTIAL: "#e8b13a", CANDIDATE: "#e8b13a", DERIVED: "#e8b13a",
  NOT_YET_EARNED: "#5a5a5e", POTENTIAL: "#5a5a5e", UNOBSERVED: "#3a3a3d", UNRESOLVED: "#5a5a5e",
  BLOCKED: "#e05a4e", REJECTED: "#e05a4e", LIVE_REJECTED: "#e05a4e", LIVE_INSTRUMENT_FAILED: "#e05a4e",
  NO_CANARY_ADDRESS: "#2a2a2c",
};
export function stateColor(s: string | undefined) {
  return STATE_COLOR[s || ""] || "#777";
}
