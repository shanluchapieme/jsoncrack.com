// Real typed graph renderer -- replaces JSONCrack's raw JSON key:value tree
// for views that have REAL edges (Formation graph). JSONCrack is a JSON
// structure viewer: it doesn't know PRODUCT from MARKET_MOMENT, so every
// node rendered as an identical gray box of field names. Cytoscape draws
// exactly what we tell it to, so here a node is an icon + its real display
// name + a colored state pill, and an edge is colored/dashed by whether the
// relationship it represents is proven or still a candidate.
import { useRef } from "react";
import CytoscapeComponent from "react-cytoscapejs";
import type { Core, ElementDefinition, Stylesheet } from "cytoscape";
import { classMeta, stateColor, IVORY, TOMATO } from "./visualLanguage";

export interface GraphNode {
  node_id: string;
  object_class: string;
  display_name: string;
  state: string;
  [key: string]: any;
}
export interface GraphEdge {
  edge_id: string;
  from: string;
  to: string;
  relation: string;
  state: string;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

const DASHED_EDGE_STATES = new Set(["CANDIDATE", "UNRESOLVED", "DERIVED"]);

export function TypedGraphCanvas({
  nodes, edges, onNodeClick, rootId,
}: {
  nodes: GraphNode[]; edges: GraphEdge[]; onNodeClick: (node: GraphNode) => void; rootId?: string;
}) {
  const cyRef = useRef<Core | null>(null);
  const nodesById = new Map(nodes.map((n) => [n.node_id, n]));

  const elements: ElementDefinition[] = [
    ...nodes.map((n) => {
      const meta = classMeta(n.object_class);
      return {
        data: {
          id: n.node_id,
          label: `${meta.icon}  ${truncate(n.display_name || n.node_id, 26)}`,
          color: stateColor(n.state),
        },
      };
    }),
    ...edges
      .filter((e) => nodesById.has(e.from) && nodesById.has(e.to))
      .map((e) => ({
        data: {
          id: e.edge_id, source: e.from, target: e.to,
          label: e.relation.replace(/_/g, " ").toLowerCase(),
          color: stateColor(e.state),
          dashed: DASHED_EDGE_STATES.has(e.state) ? "dashed" : "solid",
        },
      })),
  ];

  const stylesheet: Stylesheet[] = [
    {
      selector: "node",
      style: {
        "background-color": "#1a1a1c",
        "border-width": 3,
        "border-color": "data(color)" as any,
        label: "data(label)" as any,
        color: IVORY,
        "font-size": 11,
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "text-max-width": "150px",
        shape: "round-rectangle",
        width: "label",
        height: "label",
        padding: "10px",
        "font-family": "system-ui, sans-serif",
      },
    },
    {
      selector: "edge",
      style: {
        width: 1.6,
        "line-color": "data(color)" as any,
        "target-arrow-color": "data(color)" as any,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "line-style": "data(dashed)" as any,
        label: "data(label)" as any,
        "font-size": 8,
        color: "#999",
        "text-rotation": "autorotate",
        "text-background-color": "#0b0b0c",
        "text-background-opacity": 1,
        "text-background-padding": "2px",
      },
    },
  ];

  const layout = rootId
    ? { name: "breadthfirst", directed: true, circle: true, roots: `#${rootId}`, spacingFactor: 1.1, padding: 30, animate: false }
    : { name: "cose", padding: 30, animate: false };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <CytoscapeComponent
        elements={elements}
        stylesheet={stylesheet}
        layout={layout as any}
        style={{ width: "100%", height: "100%", background: "#0b0b0c" }}
        cy={(cy) => {
          cyRef.current = cy;
          cy.off("tap", "node");
          cy.on("tap", "node", (evt) => {
            const node = nodesById.get(evt.target.id());
            if (node) onNodeClick(node);
          });
          cy.ready(() => cy.fit(undefined, 40));
        }}
      />
      <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 6 }}>
        {[
          ["Fit", () => cyRef.current?.fit(undefined, 30)],
          ["+", () => cyRef.current && (cyRef.current.zoom(cyRef.current.zoom() * 1.3), cyRef.current.center())],
          ["-", () => cyRef.current && (cyRef.current.zoom(cyRef.current.zoom() * 0.75), cyRef.current.center())],
        ].map(([label, fn]) => (
          <button key={label as string} onClick={fn as () => void}
            style={{ background: "#1a1a1c", border: `1px solid ${TOMATO}`, color: TOMATO, borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// No real edges exist between these nodes (e.g. the 1,133 Google canaries
// are independent addresses, not a network) -- rendering them as a fake
// star-topology graph (as the old JSONCrack view did, via a synthetic
// "nodes" array root) implies a relationship that isn't real. A typed card
// grid shows the same icon/name/state-pill visual language honestly instead.
export function TypedCardGrid({ nodes, onSelect }: { nodes: GraphNode[]; onSelect: (n: GraphNode) => void }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      gap: 10, padding: 14, overflowY: "auto", height: "100%", alignContent: "start",
    }}>
      {nodes.map((n) => {
        const meta = classMeta(n.object_class);
        const state = n.state || (n as any).activation_state;
        return (
          <div
            key={n.node_id || (n as any).canary_id}
            onClick={() => onSelect(n)}
            style={{
              background: "#17171a", border: "1px solid #262626", borderLeft: `3px solid ${stateColor(state)}`,
              borderRadius: 6, padding: "10px 12px", cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = TOMATO)}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#262626"; e.currentTarget.style.borderLeftColor = stateColor(state); }}
          >
            <div style={{ fontSize: 16, marginBottom: 4 }}>{meta.icon}</div>
            <div style={{ fontSize: 13, color: IVORY, marginBottom: 4, lineHeight: 1.3 }}>
              {n.display_name || (n as any).category_label}
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: "#999" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: stateColor(state), display: "inline-block" }} />
              {state}
            </div>
          </div>
        );
      })}
    </div>
  );
}
