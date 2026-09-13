// Since Tomorrow addition -- not part of upstream jsoncrack.com
//
// Since Tomorrow Market Explorer. Renderer ancestry: forked jsoncrack-react
// (Apache-2.0, see /UPSTREAM_LINEAGE.md). All data below is fetched, live,
// from the local read-only API bridge (server/index.js), which reads
// canonical since-tomorrow-os authority artifacts. Nothing here is invented
// or hand-copied.

import { useEffect, useMemo, useState } from "react";
// JSONCrack (the actual forked jsoncrack-react component) is a generic JSON
// structure viewer -- it renders every node as an identical gray box of
// field names because it has no concept of "this is a PRODUCT, that's a
// MARKET_MOMENT". That's why the earlier canvas was unreadable: it was never
// a bug, it was the wrong tool for a domain object graph with real typed
// semantics. TypedGraph.tsx (Cytoscape) replaces it here with nodes we draw
// ourselves -- icon + real display name + a colored state pill, edges styled
// by whether the relationship is proven or still a candidate. The forked
// jsoncrack-react package itself stays in the monorepo (see
// /UPSTREAM_LINEAGE.md) for lineage/license compliance; this app just no
// longer uses its rendering component for the graph views.
import { TypedGraphCanvas, TypedCardGrid, type GraphNode } from "./TypedGraph";
import { classMeta, stateColor, TOMATO, IVORY, BLACK } from "./visualLanguage";

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
          <div style={{ fontSize: 11, letterSpacing: 1, color: "#ff5a3c", marginBottom: 6 }}>{classMeta(cls).icon} {classMeta(cls).label} ({list.length})</div>
          {list.map((n) => (
            <div
              key={n.node_id || n.canary_id}
              onClick={() => onSelect(n)}
              style={{
                padding: "6px 10px", marginBottom: 4, background: "#17171a", borderRadius: 4,
                cursor: "pointer", fontSize: 13, border: "1px solid #262626",
                display: "flex", alignItems: "center", gap: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#ff5a3c")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#262626")}
            >
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: stateColor(n.state || n.activation_state), display: "inline-block", flexShrink: 0 }} />
              {n.display_name || n.category_label} <span style={{ color: "#888", fontSize: 11 }}>-- {n.state || n.activation_state}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const API = "http://localhost:4127";

type Tab = "formation" | "canary" | "matrix";

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
            : state === "UNRESOLVED" || state === "BLOCKED" || state === "REJECTED"
            ? `This ${meta.label.toLowerCase()} was checked and could not be resolved (${state.toLowerCase()}) -- a real, named gap, not a missing check.`
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

  const rootId = graph.nodes.find((n: any) => n.object_class === "FORMATION")?.node_id;

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
            ? <TypedGraphCanvas nodes={graph.nodes as GraphNode[]} edges={graph.edges} onNodeClick={setSelected} rootId={rootId} />
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
            {useCanvas ? "switch to grouped list" : "switch to card grid"}
          </button>
        </div>
        {data && (
          <div style={{ padding: 8, fontSize: 12, color: "#aaa" }}>
            total_canonical_categories={data.total_canonical_categories} | total_contracts={data.total_contracts} | reconciliation_pass={String(data.reconciliation_pass)} | matched={data.matched} | showing {data.returned}
            <span style={{ marginLeft: 8, color: "#666" }}>-- these are independent addresses, not a network, so they're shown as a card grid, not a fake graph.</span>
          </div>
        )}
        <div style={{ flex: 1, position: "relative" }}>
          {loading && <div style={{ padding: 20 }}>Loading...</div>}
          {error && <div style={{ padding: 20, color: TOMATO }}>Error: {error}</div>}
          {data && useCanvas && <TypedCardGrid nodes={data.nodes as GraphNode[]} onSelect={setSelected} />}
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

  const insightUrl = selected ? `${API}/api/insights/category/${selected.category_id}` : null;
  const { data: insight } = useFetch<any>(insightUrl);

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

            {insight && (
              <div style={{ marginTop: 10, marginBottom: 10, padding: 12, background: "#17171a", border: "1px solid #262626", borderRadius: 6 }}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: TOMATO, marginBottom: 8 }}>Representation Intelligence -- the "so what"</div>
                {!insight.available ? (
                  <div style={{ fontSize: 12, color: "#888" }}>{insight.reason}</div>
                ) : (
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: "#ccc" }}>
                    <div style={{ color: IVORY, fontWeight: 600, marginBottom: 6 }}>{insight.headline}</div>
                    <div style={{ marginBottom: 8 }}>
                      {insight.hypothesis} -- verdict: <b style={{ color: stateColor("PARTIALLY_EARNED") }}>{insight.verdict}</b>
                    </div>
                    <details style={{ marginBottom: 8 }}>
                      <summary style={{ cursor: "pointer", color: TOMATO }}>
                        {insight.machine_only_count} AI-recommended brands with zero Google SERP presence
                      </summary>
                      <ul style={{ margin: "6px 0 0", paddingLeft: 16 }}>
                        {insight.machine_only_brands.map((b: any, i: number) => (
                          <li key={i}>{b.brand} {typeof b.machine_surfaces === "number" ? `-- ${b.machine_surfaces} AI surfaces` : ""}</li>
                        ))}
                      </ul>
                    </details>
                    <div style={{ marginBottom: 8 }}>
                      <b style={{ color: IVORY }}>Bridge brand:</b> {insight.bridge_brands.map((b: any) => b.brand).join(", ")}
                      {insight.bridge_brands[0]?.why_in_both && (
                        <div style={{ color: "#999", fontSize: 11, marginTop: 2 }}>{insight.bridge_brands[0].why_in_both}</div>
                      )}
                    </div>
                    <details>
                      <summary style={{ cursor: "pointer", color: TOMATO }}>Vocabulary routing divergence ({insight.vocabulary_divergence_pairs.length} pairs)</summary>
                      <div style={{ marginTop: 6 }}>
                        {insight.vocabulary_divergence_pairs.map((p: any) => (
                          <div key={p.pair_id} style={{ marginBottom: 8, paddingBottom: 8, borderBottom: "1px solid #262626" }}>
                            <div style={{ color: IVORY }}>{p.title}</div>
                            <div style={{ color: "#999", fontSize: 11 }}>"{p.query_A}" &rarr; {p.query_A_route}</div>
                            <div style={{ color: "#999", fontSize: 11 }}>"{p.query_B}" &rarr; {p.query_B_route}</div>
                            <div style={{ fontSize: 11, marginTop: 2 }}>{p.finding}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                    <div style={{ marginTop: 8, color: "#888", fontSize: 11 }}>
                      Sources: {insight.schema_sources.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            )}

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
