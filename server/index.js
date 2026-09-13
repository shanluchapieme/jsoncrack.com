// Since Tomorrow addition -- not part of upstream jsoncrack.com
//
// Local, read-only API bridge (Section 23). Serves canonical since-tomorrow-os
// authority artifacts through a defined interface. The UI must never read
// arbitrary files from its own repo directly -- it goes through this bridge.
//
// POST /api/next-witness is dry-run/recommendation ONLY. It never authorizes
// a live acquisition on its own -- it shells out to the real, already-committed
// canary_controller_v1.py and returns its typed decision verbatim.

const http = require("http");
const { spawn } = require("child_process");
const { buildFormationGraph, buildCanaryEstate, buildCategoryCoverageMatrix } = require("./graph_adapter.js");

const PORT = process.env.PORT || 4127;
const PYTHON = "python";
const AUTHORITY_REPO = "C:/SinceTomorrow/since-tomorrow-os";
const CONTROLLER_SCRIPT = `${AUTHORITY_REPO}/scripts/ops/canary_controller_v1.py`;

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function runController(categoryId, decisionContext) {
  return new Promise((resolve, reject) => {
    const args = [CONTROLLER_SCRIPT, "--category-id", String(categoryId)];
    if (decisionContext) args.push("--decision-context", decisionContext);
    const proc = spawn(PYTHON, args, { cwd: AUTHORITY_REPO });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr || `controller exited ${code}`));
      try {
        resolve(JSON.parse(stdout));
      } catch (e) {
        reject(new Error(`controller returned non-JSON: ${stdout.slice(0, 300)}`));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split("/").filter(Boolean); // e.g. ["api","hot1000"]

  try {
    if (req.method === "GET" && url.pathname === "/api/hot1000") {
      const graph = buildFormationGraph();
      return json(res, 200, {
        current_fully_traversable_formations: 1,
        formations: [{ formation_id: graph.formation_id, epoch: graph.epoch, coverage: graph.coverage }],
        note: "V1: exactly one fully-traversable formation exists today. Stale HOT1000_RANKING_SNAPSHOT_V9.json (1,050 ranked, compiled 2026-09-02) is NOT surfaced here as traversable -- see /api/formations for the real one.",
      });
    }

    if (req.method === "GET" && parts[0] === "api" && parts[1] === "formations" && parts[2]) {
      const graph = buildFormationGraph();
      if (parts[2] !== graph.formation_id) {
        return json(res, 404, { error: `Only ${graph.formation_id} is fully traversable today.` });
      }
      return json(res, 200, graph);
    }

    if (req.method === "GET" && parts[0] === "api" && parts[1] === "objects" && parts[2]) {
      const graph = buildFormationGraph();
      const node = graph.nodes.find((n) => n.node_id === parts[2] || n.object_id === parts[2]);
      if (!node) return json(res, 404, { error: `object ${parts[2]} not found in the real graph.` });
      const relatedEdges = graph.edges.filter((e) => e.from === node.node_id || e.to === node.node_id);
      return json(res, 200, { node, edges: relatedEdges });
    }

    if (req.method === "GET" && url.pathname === "/api/canaries/google/categories") {
      const estate = buildCanaryEstate();
      const stateFilter = url.searchParams.get("state");
      const search = url.searchParams.get("q");
      let nodes = estate.nodes;
      if (stateFilter) nodes = nodes.filter((n) => n.activation_state === stateFilter);
      if (search) {
        const s = search.toLowerCase();
        nodes = nodes.filter((n) => n.category_label.toLowerCase().includes(s) || String(n.category_id) === s);
      }
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10), 1133);
      return json(res, 200, {
        total_canonical_categories: estate.total_canonical_categories,
        total_contracts: estate.total_contracts,
        reconciliation_pass: estate.reconciliation_pass,
        state_distribution: estate.state_distribution,
        returned: Math.min(nodes.length, limit),
        matched: nodes.length,
        nodes: nodes.slice(0, limit),
      });
    }

    if (req.method === "GET" && parts[0] === "api" && parts[1] === "canaries" && parts[2]) {
      const estate = buildCanaryEstate();
      const node = estate.nodes.find((n) => n.canary_id === parts[2]);
      if (!node) return json(res, 404, { error: `canary ${parts[2]} not found.` });
      return json(res, 200, node);
    }

    if (req.method === "GET" && url.pathname === "/api/coverage/matrix") {
      return json(res, 200, buildCategoryCoverageMatrix());
    }

    if (req.method === "POST" && url.pathname === "/api/next-witness") {
      const body = await readBody(req);
      if (body.category_id == null) return json(res, 400, { error: "category_id is required (Google category domain only in V1)." });
      const decision = await runController(body.category_id, body.decision_context || "");
      return json(res, 200, { dry_run: true, side_effect_free: true, decision });
    }

    return json(res, 404, { error: "not found", routes: [
      "GET /api/hot1000", "GET /api/formations/:id", "GET /api/objects/:id",
      "GET /api/canaries/google/categories", "GET /api/canaries/:id",
      "GET /api/coverage/matrix", "POST /api/next-witness",
    ]});
  } catch (err) {
    return json(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`ST Market Explorer API bridge (dev-only) listening on http://localhost:${PORT}`);
  console.log(`Reading authority repo (read-only): ${AUTHORITY_REPO}`);
});
