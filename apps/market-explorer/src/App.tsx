// Since Tomorrow addition -- not part of upstream jsoncrack.com
//
// Since Tomorrow Market Explorer. Renderer ancestry: forked jsoncrack-react
// (Apache-2.0, see /UPSTREAM_LINEAGE.md). All data below is fetched, live,
// from the local read-only API bridge (server/index.js), which reads
// canonical since-tomorrow-os authority artifacts. Nothing here is invented
// or hand-copied.

import { useEffect, useMemo, useState } from "react";
// The <JSONCrack> canvas IS the renderer -- this is the actual forked jsoncrack-react
// component. It was wrongly suspected of being broken during debugging; the real bug
// was a `loading` state defaulting to false (fixed below), which crashed EVERY view,
// list or canvas, on first render before any fetch completed. With that fixed, and a
// LEAN projection fed to the canvas (its automatic JSON-tree layout treats every key
// as a node, so the full richly-annotated objects were too deep and hung its ELK
// layout engine), the real visual graph renders correctly.
import { JSONCrack, type NodeData } from "jsoncrack-react";

function NodeList({ nodes, onSelect }: { nodes: any[]; onSelect: (n: any) => void }) {
  const byClass: Record<string, any[]> = {};
  for (const n of nodes) {
    const c = n.object_class || "OTHER";
    (byClass[c] ||= []).push(n);
  }
  return (
    <div style={{ padding: 12, overflowY: "auto", height: "100%" }}>
      {Object.entries(byClass).map(([cls, list]) => (
        <div key={cls} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#ff5a3c", marginBottom: 6 }}>{cls} ({list.length})</div>
          {list.map((n) => (
            <div
              key={n.node_id || n.canary_id}
              onClick={() => onSelect(n)}
              style={{
                padding: "6px 10px", marginBottom: 4, background: "#17171a", borderRadius: 4,
                cursor: "pointer", fontSize: 13, border: "1px solid #262626",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff5a3c")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#262626")}
            >
              {n.display_name || n.category_label} <span style={{ color: "#888", fontSize: 11 }}>-- {n.state || n.activation_state}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const API = "http://localhost:4127";
const TOMATO = "#ff5a3c";
const IVORY = "#f2ece2";
const BLACK = "#0b0b0c";

type Tab = "formation" | "canary" | "matrix";

// Human translation of object_class -- fixes "no one knows what they're
// looking at". Every node in this system carries one of these classes;
// this is the one place their meaning is spelled out in plain English.
const CLASS_META: Record<string, { icon: string; label: string; blurb: string }> = {
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

function classMeta(objectClass: string | undefined) {
  return CLASS_META[objectClass || ""] || { icon: "●", label: objectClass || "Unclassified", blurb: "" };
}

const STATE_COLOR: Record<string, string> = {
  EARNED: "#3ecf6e", OBSERVED: "#3ecf6e", LIVE_HEALTHY: "#3ecf6e", IDENTITY_PROVEN: "#3ecf6e", PROVEN: "#3ecf6e",
  PARTIALLY_EARNED: "#e8b13a", LIVE_RATE_LIMITED: "#e8b13a", PARTIAL: "#e8b13a", CANDIDATE: "#e8b13a",
  NOT_YET_EARNED: "#5a5a5e", POTENTIAL: "#5a5a5e", UNOBSERVED: "#3a3a3d", UNRESOLVED: "#5a5a5e",
  BLOCKED: "#e05a4e", REJECTED: "#e05a4e", LIVE_REJECTED: "#e05a4e", LIVE_INSTRUMENT_FAILED: "#e05a4e",
  NO_CANARY_ADDRESS: "#2a2a2c",
};
function stateColor(s: string | undefined) {
  return STATE_COLOR[s || ""] || "#777";
}

function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [url]);
  return { data, loading, error };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: TOMATO, marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function ObjectInspector({ node, onClose }: { node: any; onClose: () => void }) {
  const [witnessResult, setWitnessResult] = useState<any>(null);
  const [witnessLoading, setWitnessLoading] = useState(false);

  if (!node) return null;

  const runWitness = async () => {
    if (node.category_id == null) return;
    setWitnessLoading(true);
    try {
      const r = await fetch(`${API}/api/next-witness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: node.category_id, decision_context: "Market Explorer inspector click" }),
      });
      setWitnessResult(await r.json());
    } catch (e) {
      setWitnessResult({ error: String(e) });
    } finally {
      setWitnessLoading(false);
    }
  };

  const meta = classMeta(node.object_class);
  const state = node.state || node.activation_state;
  const evidence = (node.evidence_refs || []).length ? node.evidence_refs : (node.source_refs || []);

  return (
    <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <button onClick={onClose} style={{ background: "none", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "2px 8px", marginBottom: 12, cursor: "pointer" }}>close</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <h3 style={{ margin: 0, color: IVORY }}>{node.display_name || node.category_label || node.object_id}</h3>
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>{meta.label}{node.canary_id ? ` -- ${node.canary_id}` : ""}</div>

      <Panel title="What is this?">{meta.blurb || "No plain-English description recorded for this object class yet."}</Panel>
      <Panel title="Current state">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: stateColor(state), display: "inline-block" }} />
          {state || "unknown"}
        </span>
      </Panel>
      <Panel title="Why it matters">
        {node.activation_reason ||
          (state === "NOT_YET_EARNED" || state === "UNOBSERVED"
            ? `No real evidence has been gathered for this ${meta.label.toLowerCase()} yet -- a genuine gap, not an assumption.`
            : state === "PARTIALLY_EARNED" || state === "PARTIAL"
            ? `Some real evidence exists for this ${meta.label.toLowerCase()}, but it doesn't fully resolve yet -- see Known / Unknown below.`
            : `This ${meta.label.toLowerCase()} has real, observed evidence backing it -- see Known below.`)}
      </Panel>
      <Panel title="Source / platform">{(node.platform || []).join(", ") || "n/a"}</Panel>
      <Panel title="Last observed">{node.last_observed_at || node.last_state || "never"}</Panel>
      <Panel title="Claim ceiling">{node.claim_ceiling || "Not stated -- treat as unbounded only if this is later confirmed; absence of a stated ceiling is itself a gap."}</Panel>
      <Panel title="Known">
        {(node.known || []).length ? <ul style={{ margin: 0, paddingLeft: 16 }}>{node.known.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul> : "Nothing specific recorded yet."}
      </Panel>
      <Panel title="Unknown">
        {(node.unknown || node.decision_unknowns || []).length
          ? <ul style={{ margin: 0, paddingLeft: 16 }}>{(node.unknown || node.decision_unknowns).map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
          : "No open question recorded for this object specifically."}
      </Panel>
      <Panel title="Next best witness">
        {(node.next_best_witness || []).length
          ? <ul style={{ margin: 0, paddingLeft: 16 }}>{node.next_best_witness.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
          : "No specific next check queued for this object."}
      </Panel>

      {node.category_id != null && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={runWitness}
            disabled={witnessLoading}
            style={{ background: TOMATO, color: BLACK, border: "none", borderRadius: 4, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}
          >
            {witnessLoading ? "asking real controller..." : "Activate Next Best Witness (dry-run)"}
          </button>
          {witnessResult && (
            <pre style={{ marginTop: 10, background: "#1a1a1c", padding: 10, borderRadius: 6, fontSize: 11, overflowX: "auto" }}>
              {JSON.stringify(witnessResult, null, 2)}
            </pre>
          )}
        </div>
      )}

      <Panel title="Evidence / provenance">
        {evidence.length
          ? <ul style={{ margin: 0, paddingLeft: 16, fontFamily: "monospace", fontSize: 11 }}>{evidence.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>
          : "No source file recorded for this object -- flag if you'd expect one."}
      </Panel>
    </div>
  );
}

function FormationView() {
  const { data: graph, loading, error } = useFetch<any>(`${API}/api/formations/qc_c25e12c0b6013c91`);
  const [selected, setSelected] = useState<any>(null);
  const [useCanvas, setUseCanvas] = useState(true);

  if (loading || !graph) return <div style={{ padding: 20 }}>Loading real formation graph...</div>;
  if (error) return <div style={{ padding: 20, color: TOMATO }}>Error: {error}</div>;

  // LEAN projection for the canvas only -- same array order/length as graph.nodes,
  // so path-based click resolution below still finds the FULL real object.
  const leanForRender = {
    nodes: graph.nodes.map((n: any) => ({ id: n.node_id, class: n.object_class, name: n.display_name, state: n.state })),
  };

  const handleCanvasNodeClick = (n: NodeData) => {
    const path = n.path || [];
    if (path[0] === "nodes" && typeof path[1] === "number") {
      setSelected(graph.nodes[path[1]]);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
      <div style={{ flex: 1, position: "relative", borderRight: `1px solid #222`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 8, fontSize: 12, background: "#111", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 12 }}>
          <span>
            {graph.formation_id} -- {graph.coverage.normalized_node_count} nodes / {graph.coverage.normalized_edge_count} edges
            (source_traversable_object_count={graph.coverage.source_traversable_object_count}, content_objects_parsed={graph.coverage.content_objects_parsed})
          </span>
          <button onClick={() => setUseCanvas((v) => !v)} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
            {useCanvas ? "switch to list" : "switch to graph canvas"}
          </button>
        </div>
        <div style={{ flex: 1 }}>
          {useCanvas
            ? <JSONCrack json={leanForRender} theme="dark" onNodeClick={handleCanvasNodeClick} style={{ height: "100%" }} />
            : <NodeList nodes={graph.nodes} onSelect={setSelected} />}
        </div>
      </div>
      <div style={{ width: 380, background: "#111113" }}>
        {selected ? <ObjectInspector node={selected} onClose={() => setSelected(null)} /> : (
          <div style={{ padding: 20, color: "#999" }}>Click any node in the graph to inspect it.</div>
        )}
      </div>
    </div>
  );
}

const STATES = ["POTENTIAL","ELIGIBLE","SCHEDULED","LIVE_HEALTHY","LIVE_EMPTY","LIVE_GATED","LIVE_RATE_LIMITED","LIVE_REJECTED","LIVE_ROAD_DRIFT","LIVE_INSTRUMENT_FAILED","BLOCKED","RETIRED"];

function CanaryView() {
  const [stateFilter, setStateFilter] = useState("LIVE_HEALTHY");
  const [q, setQ] = useState("");
  const [useCanvas, setUseCanvas] = useState(true);
  const url = `${API}/api/canaries/google/categories?state=${encodeURIComponent(stateFilter)}${q ? `&q=${encodeURIComponent(q)}` : ""}&limit=100`;
  const { data, loading, error } = useFetch<any>(url);
  const [selected, setSelected] = useState<any>(null);

  const handleCanvasNodeClick = (n: NodeData) => {
    const path = n.path || [];
    if (path[0] === "nodes" && typeof path[1] === "number" && data) {
      setSelected(data.nodes[path[1]]);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
      <div style={{ flex: 1, position: "relative", borderRight: "1px solid #222", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 10, borderBottom: "1px solid #222", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {STATES.map((s) => (
            <button
              key={s}
              onClick={() => setStateFilter(s)}
              style={{
                background: s === stateFilter ? TOMATO : "transparent",
                color: s === stateFilter ? BLACK : IVORY,
                border: `1px solid ${TOMATO}`,
                borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: "pointer",
              }}
            >
              {s} {data?.state_distribution?.[s] != null ? `(${data.state_distribution[s]})` : "(0)"}
            </button>
          ))}
          <input placeholder="search label or id" value={q} onChange={(e) => setQ(e.target.value)} style={{ background: "#1a1a1c", border: "1px solid #333", color: IVORY, borderRadius: 4, padding: "4px 8px" }} />
          <button onClick={() => setUseCanvas((v) => !v)} style={{ marginLeft: "auto", background: "transparent", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "2px 8px", fontSize: 11, cursor: "pointer" }}>
            {useCanvas ? "switch to list" : "switch to graph canvas"}
          </button>
        </div>
        {data && (
          <div style={{ padding: 8, fontSize: 12, color: "#aaa" }}>
            total_canonical_categories={data.total_canonical_categories} | total_contracts={data.total_contracts} | reconciliation_pass={String(data.reconciliation_pass)} | matched={data.matched} | showing {data.returned}
          </div>
        )}
        <div style={{ flex: 1, position: "relative" }}>
          {loading && <div style={{ padding: 20 }}>Loading...</div>}
          {error && <div style={{ padding: 20, color: TOMATO }}>Error: {error}</div>}
          {data && useCanvas && (
            <JSONCrack
              json={{ nodes: data.nodes.map((n: any) => ({ id: n.canary_id, category: n.category_label, state: n.activation_state })) }}
              theme="dark" onNodeClick={handleCanvasNodeClick} style={{ height: "100%" }} maxRenderableNodes={500}
            />
          )}
          {data && !useCanvas && <NodeList nodes={data.nodes} onSelect={setSelected} />}
        </div>
      </div>
      <div style={{ width: 380, background: "#111113" }}>
        {selected ? <ObjectInspector node={selected} onClose={() => setSelected(null)} /> : (
          <div style={{ padding: 20, color: "#999" }}>Click any canary node to inspect it and run the real controller.</div>
        )}
      </div>
    </div>
  );
}

const LENS_ORDER = ["search_lens", "commerce_lens", "ugc_lens", "saves_lens"] as const;
const STATE_ABBR: Record<string, string> = {
  EARNED: "EARNED", PARTIALLY_EARNED: "PARTIAL", NOT_YET_EARNED: "NOT YET", UNOBSERVED: "—",
  LIVE_HEALTHY: "HEALTHY", LIVE_RATE_LIMITED: "RATE-LTD", LIVE_EMPTY: "EMPTY", LIVE_GATED: "GATED",
  LIVE_REJECTED: "REJECTED", LIVE_ROAD_DRIFT: "DRIFT", LIVE_INSTRUMENT_FAILED: "FAILED",
  POTENTIAL: "not yet checked", ELIGIBLE: "ELIGIBLE", SCHEDULED: "SCHEDULED", BLOCKED: "BLOCKED",
  RETIRED: "RETIRED", NO_CANARY_ADDRESS: "no address",
};

function Legend() {
  const items: [string, string][] = [
    ["#3ecf6e", "Proven -- real, current evidence"],
    ["#e8b13a", "Partial -- some real evidence, real gaps remain"],
    ["#5a5a5e", "Checked, found nothing yet"],
    ["#3a3a3d", "Never checked -- no formation/road built here"],
    ["#e05a4e", "Blocked / rejected"],
  ];
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 11, color: "#aaa", padding: "6px 10px" }}>
      {items.map(([c, label]) => (
        <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: c, display: "inline-block" }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function CoverageMatrixView() {
  const { data, loading, error } = useFetch<any>(`${API}/api/coverage/matrix`);
  const [q, setQ] = useState("");
  const [sortMode, setSortMode] = useState<"taxonomy" | "evidence">("evidence");
  const [selected, setSelected] = useState<any>(null);
  const [witnessResult, setWitnessResult] = useState<any>(null);
  const [witnessLoading, setWitnessLoading] = useState(false);

  const rows = useMemo(() => {
    if (!data) return [];
    let r = data.rows as any[];
    if (q) {
      const s = q.toLowerCase();
      r = r.filter((x) => x.category_label.toLowerCase().includes(s) || String(x.category_id) === s);
    }
    if (sortMode === "evidence") {
      const score = (row: any) =>
        LENS_ORDER.reduce((acc, k) => acc + (row[k] === "UNOBSERVED" || row[k] === "NO_CANARY_ADDRESS" || row[k] === "POTENTIAL" || row[k] === "NOT_YET_EARNED" ? 0 : row[k] === "EARNED" || row[k] === "LIVE_HEALTHY" ? 2 : 1), 0);
      r = [...r].sort((a, b) => score(b) - score(a) || a.category_id - b.category_id);
    } else {
      r = [...r].sort((a, b) => a.category_id - b.category_id);
    }
    return r;
  }, [data, q, sortMode]);

  const runWitnessForCategory = async (categoryId: number) => {
    setWitnessLoading(true);
    setWitnessResult(null);
    try {
      const r = await fetch(`${API}/api/next-witness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, decision_context: "Coverage Matrix inspector click" }),
      });
      setWitnessResult(await r.json());
    } catch (e) {
      setWitnessResult({ error: String(e) });
    } finally {
      setWitnessLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 110px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "1px solid #222" }}>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #222" }}>
          <div style={{ fontSize: 13, color: IVORY, marginBottom: 4 }}>
            Every one of Google's 1,133 categories, checked across 4 real lenses. Most cells are honestly dark -- that's the actual frontier, not a bug.
          </div>
          <Legend />
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <input placeholder="search category label or id" value={q} onChange={(e) => setQ(e.target.value)}
              style={{ background: "#1a1a1c", border: "1px solid #333", color: IVORY, borderRadius: 4, padding: "4px 8px", flex: 1, maxWidth: 320 }} />
            <button onClick={() => setSortMode((m) => (m === "evidence" ? "taxonomy" : "evidence"))}
              style={{ background: "transparent", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "3px 10px", fontSize: 11, cursor: "pointer" }}>
              sort: {sortMode === "evidence" ? "most evidence first" : "taxonomy order"}
            </button>
            {data && <span style={{ fontSize: 11, color: "#888", marginLeft: "auto" }}>{rows.length} / {data.total_categories} categories -- {data.crosswalked_formation_count} formation(s) built</span>}
          </div>
        </div>
        {loading && <div style={{ padding: 20 }}>Loading real coverage matrix...</div>}
        {error && <div style={{ padding: 20, color: TOMATO }}>Error: {error}</div>}
        {data && (
          <div style={{ flex: 1, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead style={{ position: "sticky", top: 0, background: "#111113", zIndex: 1 }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #333", width: 50 }}>ID</th>
                  <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #333" }}>Category</th>
                  {data.lenses.map((l: any) => (
                    <th key={l.key} title={l.coverage_note} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #333", color: TOMATO, cursor: "help" }}>
                      {l.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.category_id} onClick={() => { setSelected(row); setWitnessResult(null); }}
                    style={{ cursor: "pointer", background: selected?.category_id === row.category_id ? "#1c1c1f" : "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#17171a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = selected?.category_id === row.category_id ? "#1c1c1f" : "transparent")}>
                    <td style={{ padding: "5px 10px", color: "#888", borderBottom: "1px solid #1c1c1e" }}>{row.category_id}</td>
                    <td style={{ padding: "5px 10px", borderBottom: "1px solid #1c1c1e" }}>{row.category_label}</td>
                    {LENS_ORDER.map((k) => (
                      <td key={k} title={row[`${k.replace("_lens", "")}_detail`] || ""} style={{ padding: "5px 10px", borderBottom: "1px solid #1c1c1e" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: 2, background: stateColor(row[k]), display: "inline-block" }} />
                          <span style={{ color: "#999", fontSize: 11 }}>{STATE_ABBR[row[k]] || row[k]}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div style={{ width: 380, background: "#111113", overflowY: "auto" }}>
        {!selected && <div style={{ padding: 20, color: "#999" }}>Click any category row to see exactly what's proven, partial, or dark for it -- and to run the real Next Best Witness controller.</div>}
        {selected && (
          <div style={{ padding: 16 }}>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "2px 8px", marginBottom: 12, cursor: "pointer" }}>close</button>
            <h3 style={{ margin: "0 0 4px", color: IVORY }}>{selected.category_label}</h3>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Google Trends category_id={selected.category_id}</div>
            {selected.formation_id && (
              <Panel title="Real formation built here">
                {selected.formation_display_name}
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>Crosswalk method: {selected.crosswalk_match_method} (a disclosed label match, not an official Google mapping -- Google publishes no such mapping)</div>
              </Panel>
            )}
            <Panel title="Search demand">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: stateColor(selected.search_lens), display: "inline-block" }} />
                {selected.search_lens}
              </span>
              <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>last observed: {selected.search_last_observed || "never"}</div>
            </Panel>
            <Panel title="Commerce">{selected.commerce_lens} <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{selected.commerce_detail}</div></Panel>
            <Panel title="UGC / Creators">{selected.ugc_lens} <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{selected.ugc_detail}</div></Panel>
            <Panel title="Saves / Taste">{selected.saves_lens} <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{selected.saves_detail}</div></Panel>

            <div style={{ marginTop: 16 }}>
              <button onClick={() => runWitnessForCategory(selected.category_id)} disabled={witnessLoading}
                style={{ background: TOMATO, color: BLACK, border: "none", borderRadius: 4, padding: "8px 14px", fontWeight: 600, cursor: "pointer" }}>
                {witnessLoading ? "asking real controller..." : "Activate Next Best Witness (dry-run)"}
              </button>
              {witnessResult && (
                <pre style={{ marginTop: 10, background: "#1a1a1c", padding: 10, borderRadius: 6, fontSize: 11, overflowX: "auto" }}>
                  {JSON.stringify(witnessResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState<Tab>("matrix");
  return (
    <div style={{ minHeight: "100vh", background: BLACK, color: IVORY }}>
      <div style={{ padding: "12px 16px", borderBottom: `2px solid ${TOMATO}`, display: "flex", alignItems: "center", gap: 16 }}>
        <strong style={{ letterSpacing: 1 }}>SINCE TOMORROW MARKET EXPLORER</strong>
        <button onClick={() => setTab("matrix")} style={{ background: tab === "matrix" ? TOMATO : "transparent", color: tab === "matrix" ? BLACK : IVORY, border: `1px solid ${TOMATO}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>Category Truth Coverage Matrix</button>
        <button onClick={() => setTab("formation")} style={{ background: tab === "formation" ? TOMATO : "transparent", color: tab === "formation" ? BLACK : IVORY, border: `1px solid ${TOMATO}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>HOT1000 / Market Explorer</button>
        <button onClick={() => setTab("canary")} style={{ background: tab === "canary" ? TOMATO : "transparent", color: tab === "canary" ? BLACK : IVORY, border: `1px solid ${TOMATO}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>Canary Estate</button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#888" }}>Current fully-traversable formations = 1 (Glass Skin) -- renderer forked from jsoncrack-react (Apache-2.0)</span>
      </div>
      {tab === "matrix" ? <CoverageMatrixView /> : tab === "formation" ? <FormationView /> : <CanaryView />}
    </div>
  );
}
