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

type Tab = "formation" | "canary";

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

  return (
    <div style={{ padding: 16, overflowY: "auto", height: "100%" }}>
      <button onClick={onClose} style={{ background: "none", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "2px 8px", marginBottom: 12, cursor: "pointer" }}>close</button>
      <h3 style={{ margin: "0 0 12px", color: IVORY }}>{node.display_name || node.category_label || node.object_id}</h3>

      <Panel title="What is this?">{node.object_class}{node.canary_id ? ` -- ${node.canary_id}` : ""}</Panel>
      <Panel title="Current state">{node.state || node.activation_state}</Panel>
      <Panel title="Why it matters">{node.activation_reason || "See known/unknown below."}</Panel>
      <Panel title="Source / platform">{(node.platform || []).join(", ") || "n/a"} {node.source_refs?.length ? `-- ${node.source_refs.join(", ")}` : ""}</Panel>
      <Panel title="Last observed">{node.last_observed_at || node.last_state || "never"}</Panel>
      <Panel title="Claim ceiling">{node.claim_ceiling}</Panel>
      <Panel title="Known">
        {(node.known || []).length ? <ul style={{ margin: 0, paddingLeft: 16 }}>{node.known.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul> : "none recorded"}
      </Panel>
      <Panel title="Unknown">
        {(node.unknown || node.decision_unknowns || []).length
          ? <ul style={{ margin: 0, paddingLeft: 16 }}>{(node.unknown || node.decision_unknowns).map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
          : "none recorded"}
      </Panel>
      <Panel title="Next best witness">
        {(node.next_best_witness || []).length
          ? <ul style={{ margin: 0, paddingLeft: 16 }}>{node.next_best_witness.map((k: string, i: number) => <li key={i}>{k}</li>)}</ul>
          : "none recorded"}
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
        {(node.evidence_refs || []).length ? node.evidence_refs.join(", ") : (node.raw_evidence_ref || "see source_refs above")}
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

export default function App() {
  const [tab, setTab] = useState<Tab>("formation");
  return (
    <div style={{ minHeight: "100vh", background: BLACK, color: IVORY }}>
      <div style={{ padding: "12px 16px", borderBottom: `2px solid ${TOMATO}`, display: "flex", alignItems: "center", gap: 16 }}>
        <strong style={{ letterSpacing: 1 }}>SINCE TOMORROW MARKET EXPLORER</strong>
        <button onClick={() => setTab("formation")} style={{ background: tab === "formation" ? TOMATO : "transparent", color: tab === "formation" ? BLACK : IVORY, border: `1px solid ${TOMATO}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>HOT1000 / Market Explorer</button>
        <button onClick={() => setTab("canary")} style={{ background: tab === "canary" ? TOMATO : "transparent", color: tab === "canary" ? BLACK : IVORY, border: `1px solid ${TOMATO}`, borderRadius: 4, padding: "4px 10px", cursor: "pointer" }}>Canary Estate</button>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#888" }}>Current fully-traversable formations = 1 (Glass Skin) -- renderer forked from jsoncrack-react (Apache-2.0)</span>
      </div>
      {tab === "formation" ? <FormationView /> : <CanaryView />}
    </div>
  );
}
