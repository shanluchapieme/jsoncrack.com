// Since Tomorrow addition -- not part of upstream jsoncrack.com
//
// Mechanical, deterministic transform: canonical since-tomorrow-os authority
// artifacts -> ST_MARKET_GRAPH_V1 normalized node/edge contract.
//
// LAW: this file only READS from the authority repo. It never writes back.
// SINCE TOMORROW OS OWNS TRUTH. This is presentation-layer derivation only.

const fs = require("fs");
const path = require("path");

const AUTHORITY_REPO = "C:/SinceTomorrow/since-tomorrow-os";

function readJson(relPath) {
  const full = path.join(AUTHORITY_REPO, relPath);
  return JSON.parse(fs.readFileSync(full, "utf-8"));
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

// The source file has a pre-existing mojibake artifact (an em-dash mangled
// by a non-UTF-8 write elsewhere in the pipeline, a known class of bug in
// this project). Read-only repo law means we don't touch the source file
// for a cosmetic fix -- just don't surface garbled bytes in our own output.
function cleanText(s) {
  return String(s || "").replace(/�/g, "--");
}

function normBrand(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Real, fresher (2026-09-10) evidence supersedes the stale Sep-1
// RETAILER_ANSWERABILITY snapshot's flat BOT_BLOCKED/UNRESOLVED read on
// Target. TARGET_ESTATE_STATE_V2.json was built via DURABLE_SOURCE_BROWSER_
// EXECUTION (Claude in Chrome, a real logged-in-equivalent browser session --
// not a bot-detection-bypass proxy): Target's own REDsky product API is
// still BLOCKED_BOT, but the browser road works and legitimately observed
// 86 real brand names in Target's beauty assortment as of T1. This lets us
// replace "we don't know, we're blocked" with a real, evidenced two-sided
// answer for THIS formation's specific brands -- still honest that absence
// from an 86-brand crawl is evidence, not proof of non-carriage.
function getTargetRealityCheck(formationBrandIds) {
  try {
    const estate = readJson("data/ops/commerce/TARGET_ESTATE_STATE_V2.json");
    const observed = estate.brands.brands_t1_observed || [];
    const observedNorm = new Set(observed.map(normBrand));
    const present = [];
    const absent = [];
    for (const id of formationBrandIds) {
      (observedNorm.has(normBrand(id)) ? present : absent).push(id);
    }
    return {
      available: true,
      observed_at: estate._created_at,
      active_road: estate.road_status.active_road,
      executor: estate.road_status.executor,
      redsky_api: cleanText(estate.road_status.redsky_api),
      total_brands_observed_t1: observed.length,
      present, absent,
      source_ref: "data/ops/commerce/TARGET_ESTATE_STATE_V2.json",
    };
  } catch (e) {
    return { available: false };
  }
}

/** Section 17: bounded successor parse of already-committed Glass Skin content evidence. */
function parseContentObjects() {
  const nodes = [];
  const edges = [];

  // Falcon visual evidence -- V2 supersedes V1, use V2 only (its own file says so).
  const falcon = readJson("data/crawl/tiktok_csi/beauty_us/v1/CSI_FALCON_VISUAL_GLASS_SKIN_T0_V2.json");
  const video = falcon.resolved_video;
  if (video && video.video_id) {
    const videoNodeId = `VIDEO_${video.video_id}`;
    const creatorNodeId = `CREATOR_${video.creator_handle}`;
    nodes.push({
      node_id: videoNodeId,
      object_id: video.video_id,
      object_class: "VIDEO",
      display_name: `TikTok video ${video.video_id}`,
      market_moment: ["WATCH"],
      platform: ["TIKTOK"],
      market: ["US"],
      category: ["beauty"],
      state: "IDENTITY_PROVEN",
      last_observed_at: falcon._epoch || falcon._observed_at?.value || null,
      claim_ceiling: falcon._instrument || "BROWSER_DOM_VISUAL_READ",
      source_refs: ["data/crawl/tiktok_csi/beauty_us/v1/CSI_FALCON_VISUAL_GLASS_SKIN_T0_V2.json"],
      evidence_refs: [video.source || null].filter(Boolean),
      known: ["Real video ID resolved via direct browser navigation", "Visual frame type observed"],
      unknown: ["Not confirmed across the full 20-video query set (sample_scope.videos_analyzed_count=1 of total_query_video_count=20)"],
      expandable: true,
      available_relations: ["CREATED_BY"],
    });
    nodes.push({
      node_id: creatorNodeId,
      object_id: video.creator_handle,
      object_class: "CREATOR",
      display_name: `@${video.creator_handle}`,
      market_moment: ["WATCH"],
      platform: ["TIKTOK"],
      market: ["US"],
      category: ["beauty"],
      state: "OBSERVED",
      last_observed_at: falcon._epoch || null,
      claim_ceiling: "Real handle observed via direct video navigation; no follower/engagement corpus attached.",
      source_refs: ["data/crawl/tiktok_csi/beauty_us/v1/CSI_FALCON_VISUAL_GLASS_SKIN_T0_V2.json"],
      evidence_refs: [],
      known: ["Real, resolved TikTok handle"],
      unknown: ["No creator-level engagement/reach evidence attached in this pass"],
      expandable: false,
      available_relations: [],
    });
    edges.push({
      edge_id: `E_${videoNodeId}_CREATED_BY_${creatorNodeId}`,
      from: videoNodeId,
      relation: "CREATED_BY",
      to: creatorNodeId,
      state: "IDENTITY_PROVEN",
      observed_at: falcon._epoch || null,
      evidence_refs: ["data/crawl/tiktok_csi/beauty_us/v1/CSI_FALCON_VISUAL_GLASS_SKIN_T0_V2.json"],
      claim_ceiling: "Direct browser navigation to the native video URL confirmed this authorship pairing.",
    });
  }

  // Cross-surface / editorial proxy rows -- real but lower evidence class; represented as
  // typed CONTENT_OBJECT-adjacent nodes, not fabricated into VIDEO/CREATOR identity.
  let surfaceRegistry = null;
  try {
    surfaceRegistry = readJson("data/csi/EVERY_SURFACE_REGISTRY_GLASS_SKIN_FOR_OILY_SKIN_V1.json");
  } catch (e) {
    surfaceRegistry = null;
  }
  if (surfaceRegistry && Array.isArray(surfaceRegistry.rows)) {
    for (const row of surfaceRegistry.rows) {
      const nodeId = `SURFACE_${row.surface_id}`;
      nodes.push({
        node_id: nodeId,
        object_id: row.surface_id,
        object_class: "EVIDENCE_REF",
        display_name: row.surface_id,
        market_moment: ["WATCH"],
        platform: [row.sensor_family || "UNKNOWN"],
        market: [surfaceRegistry._market || "US"],
        category: [surfaceRegistry._category || "beauty"],
        state: row.observation_state === "OBSERVED_CURRENT" ? "OBSERVED" : "CANDIDATE",
        last_observed_at: row.last_observed || null,
        claim_ceiling: row.claim_ceiling || "NOT_STATED",
        source_refs: ["data/csi/EVERY_SURFACE_REGISTRY_GLASS_SKIN_FOR_OILY_SKIN_V1.json"],
        evidence_refs: [],
        known: [`sensor_family=${row.sensor_family}`],
        unknown: [],
        expandable: false,
        available_relations: [],
      });
    }
  }

  return { nodes, edges, contentObjectsParsed: nodes.filter(n => n.object_class === "VIDEO" || n.object_class === "CREATOR").length };
}

function buildFormationGraph() {
  const src = readJson("data/ops/hot1000/MARKET_FORMATION_GRAPH_GLASS_SKIN_V1.json");
  const nodes = [];
  const edges = [];

  const allFormationBrandIds = [...new Set(
    Object.values(src.market_moments_with_evidence)
      .flatMap((d) => d.objects || [])
      .filter((o) => o.object_class === "PRODUCT" && o.brand_id)
      .map((o) => o.brand_id)
  )];
  const targetReality = getTargetRealityCheck(allFormationBrandIds);

  const formationNodeId = `FORMATION_${src.formation.formation_id}`;
  nodes.push({
    node_id: formationNodeId,
    object_id: src.formation.formation_id,
    object_class: "FORMATION",
    display_name: src.formation.display_name,
    market_moment: Object.keys(src.market_moments_with_evidence),
    platform: [],
    market: [src.formation.market_scope],
    category: [src.formation.category_scope],
    state: "OBSERVED",
    last_observed_at: src._generated_at,
    claim_ceiling: src.claim_ceiling,
    source_refs: ["data/ops/hot1000/MARKET_FORMATION_GRAPH_GLASS_SKIN_V1.json"],
    evidence_refs: [],
    known: [],
    unknown: (src.known_unknowns || []),
    expandable: true,
    available_relations: ["HAS_MARKET_MOMENT"],
  });

  // Market moment nodes -- structural, UI_GROUP_ONLY per Section 13's spirit
  // (these are adapter-created navigation nodes, not source-native objects).
  for (const [moment, detail] of Object.entries(src.market_moments_with_evidence)) {
    const momentNodeId = `MOMENT_${moment}`;
    nodes.push({
      node_id: momentNodeId,
      object_id: moment,
      object_class: "MARKET_MOMENT",
      display_name: moment,
      market_moment: [moment],
      platform: [],
      market: [src.formation.market_scope],
      category: [src.formation.category_scope],
      state: detail.state,
      last_observed_at: null,
      claim_ceiling: "UI_GROUP_ONLY -- adapter-created structural navigation node, not a source-native relationship.",
      source_refs: [],
      evidence_refs: detail.evidence_refs || [],
      known: detail.state === "EARNED" ? [detail.evidence] : [],
      unknown: detail.state === "NOT_YET_EARNED" ? [detail.evidence] : [],
      expandable: !!(detail.objects && detail.objects.length),
      available_relations: [],
    });
    edges.push({
      edge_id: `E_${formationNodeId}_HAS_MARKET_MOMENT_${momentNodeId}`,
      from: formationNodeId,
      relation: "HAS_MARKET_MOMENT",
      to: momentNodeId,
      state: "DERIVED",
      observed_at: src._generated_at,
      evidence_refs: [],
      claim_ceiling: "UI_GROUP_ONLY structural edge, not a source-native relationship.",
    });

    if (Array.isArray(detail.objects)) {
      for (const obj of detail.objects) {
        // ASK moment objects (MACHINE_ROUTE) and FIND moment objects (RETAILER)
        if (obj.object_class === "MACHINE_ROUTE") {
          const routeNodeId = `MACHINE_ROUTE_${obj.object_id}`;
          nodes.push({
            node_id: routeNodeId,
            object_id: obj.object_id,
            object_class: "MACHINE_ROUTE",
            display_name: obj.provider,
            market_moment: [moment],
            platform: [obj.provider],
            market: [src.formation.market_scope],
            category: [src.formation.category_scope],
            state: "OBSERVED",
            last_observed_at: null,
            claim_ceiling: "Real machine-answer capture; single observation, not a time series.",
            source_refs: [obj.surface_file],
            evidence_refs: [],
            known: [obj.note].filter(Boolean),
            unknown: [],
            expandable: false,
            available_relations: [],
          });
          edges.push({
            edge_id: `E_${momentNodeId}_REPRESENTED_BY_${routeNodeId}`,
            from: momentNodeId, relation: "REPRESENTED_BY", to: routeNodeId,
            state: "OBSERVED", observed_at: null, evidence_refs: [obj.surface_file],
            claim_ceiling: "Real captured machine-answer observation.",
          });
        }
        if (obj.object_class === "RETAILER") {
          const retailerNodeId = `RETAILER_${obj.object_id}`;
          const isTarget = obj.object_id === "TARGET";
          const t = isTarget ? targetReality : null;

          let retailerNode;
          if (isTarget && t && t.available) {
            // Fresher, real, legitimately-obtained evidence (2026-09-10,
            // durable browser execution) supersedes the stale Sep-1
            // BOT_BLOCKED snapshot -- this is a real two-sided finding, not
            // a forced resolution.
            retailerNode = {
              node_id: retailerNodeId,
              object_id: obj.object_id,
              object_class: "RETAILER",
              display_name: obj.object_id,
              market_moment: [moment],
              platform: [],
              market: [src.formation.market_scope],
              category: [src.formation.category_scope],
              state: t.present.length > 0 ? "PARTIALLY_EARNED" : "REJECTED",
              last_observed_at: t.observed_at,
              claim_ceiling: `${t.executor} via ${t.active_road} confirmed real Target beauty-assortment brands as of ${t.observed_at}; Target's own product API (redsky) remains ${t.redsky_api}, so exact SKU/price confirmation for THIS formation's products is still not achievable via API.`,
              source_refs: [obj.evidence_ref, t.source_ref],
              evidence_refs: [],
              known: [
                `${t.present.length}/${allFormationBrandIds.length} of this formation's brands confirmed present in Target's real, browser-observed ${t.total_brands_observed_t1}-brand assortment: ${t.present.join(", ") || "none"}`,
                `Legitimate durable-browser access to Target IS working (${t.active_road}) -- only the product API is blocked, not observation itself.`,
              ],
              unknown: [
                `${t.absent.length}/${allFormationBrandIds.length} of this formation's brands were NOT found in the ${t.total_brands_observed_t1}-brand T1 observation: ${t.absent.join(", ")}. This is real evidence of likely absence, not confirmed non-carriage -- the T1 crawl may not be exhaustive.`,
              ],
              expandable: true,
              available_relations: ["HAS_UNKNOWN"],
            };
          } else {
            retailerNode = {
              node_id: retailerNodeId,
              object_id: obj.object_id,
              object_class: "RETAILER",
              display_name: obj.object_id,
              market_moment: [moment],
              platform: [],
              market: [src.formation.market_scope],
              category: [src.formation.category_scope],
              state: obj.answerability_state === "UNOBSERVABLE" ? "UNRESOLVED" : "OBSERVED",
              last_observed_at: null,
              claim_ceiling: obj.answerability_state,
              source_refs: [obj.evidence_ref],
              evidence_refs: [],
              known: [`requirements_resolved=${obj.requirements_resolved}/${obj.requirements_total}`],
              unknown: obj.requirements_missing ? [`${obj.requirements_missing} requirements unresolved`] : [],
              expandable: isTarget,
              available_relations: isTarget ? ["HAS_UNKNOWN"] : [],
            };
          }
          nodes.push(retailerNode);
          edges.push({
            edge_id: `E_${momentNodeId}_REPRESENTED_BY_${retailerNodeId}`,
            from: momentNodeId, relation: "REPRESENTED_BY", to: retailerNodeId,
            state: retailerNode.state === "REJECTED" || retailerNode.state === "UNRESOLVED" ? "REJECTED" : retailerNode.state === "PARTIALLY_EARNED" ? "CANDIDATE" : "OBSERVED",
            observed_at: retailerNode.last_observed_at, evidence_refs: [obj.evidence_ref],
            claim_ceiling: retailerNode.claim_ceiling,
          });

          // TARGET overlay: first-class unknown + next-best-witness node (Section 10/11).
          // Reframed once real T1 browser evidence existed: the open question is no
          // longer "is the block permanent" (the browser road already proved it isn't --
          // it works) -- it's now "is this formation's brand absence from the T1 crawl
          // real non-carriage or just an incomplete crawl."
          if (obj.object_id === "TARGET") {
            const unknownNodeId = "UNKNOWN_TARGET_ROUTE_BLOCK_PERMANENCE";
            const witnessNodeId = "WITNESS_TARGET_REPROBE";
            const hasReality = targetReality && targetReality.available;
            nodes.push({
              node_id: unknownNodeId,
              object_id: unknownNodeId,
              object_class: "UNKNOWN",
              display_name: hasReality
                ? "Are the brands this formation needs genuinely absent from Target, or just missed by the T1 crawl?"
                : "Is Target's product-page block permanent or transient?",
              market_moment: ["FIND", "SHOP", "BUY"],
              platform: ["TARGET"],
              market: [src.formation.market_scope],
              category: [src.formation.category_scope],
              state: hasReality ? "PARTIALLY_EARNED" : "UNRESOLVED",
              last_observed_at: hasReality ? targetReality.observed_at : null,
              claim_ceiling: hasReality
                ? "Real, durable-browser-observed evidence exists that Target's product ACCESS is not blocked (only their API is) -- the remaining question is crawl completeness for this formation's specific brands, not access."
                : src.target_overlay.claim_ceiling,
              source_refs: hasReality
                ? ["data/ops/hot1000/MARKET_FORMATION_GRAPH_GLASS_SKIN_V1.json", targetReality.source_ref]
                : ["data/ops/hot1000/MARKET_FORMATION_GRAPH_GLASS_SKIN_V1.json"],
              evidence_refs: [],
              known: hasReality
                ? [src.target_overlay.answer, `Legitimate browser access to Target works (${targetReality.active_road}); ${targetReality.present.join(", ") || "none"} confirmed present.`]
                : [src.target_overlay.answer],
              unknown: hasReality
                ? [`Whether ${targetReality.absent.join(", ")} are truly absent from Target's beauty assortment, or simply outside the T1 crawl's ${targetReality.total_brands_observed_t1}-brand scope.`]
                : ["Whether a fresh, authorized re-probe would resolve BOT_BLOCKED to a real product/price observation."],
              expandable: true,
              available_relations: ["NEXT_BEST_WITNESS"],
            });
            nodes.push({
              node_id: witnessNodeId,
              object_id: witnessNodeId,
              object_class: "WITNESS",
              display_name: hasReality
                ? `Re-run the durable-browser Target crawl targeting: ${targetReality.absent.join(", ")}`
                : "Re-probe one Target product URL via a fresh authorized session",
              market_moment: ["FIND", "SHOP", "BUY"],
              platform: ["TARGET"],
              market: [src.formation.market_scope],
              category: [src.formation.category_scope],
              state: "CANDIDATE",
              last_observed_at: null,
              claim_ceiling: "This witness targets the Target retailer road via the same legitimate durable-browser-execution method already proven live -- NOT a bot-detection-bypass tool. It is NOT the Google category canary domain -- the connected canary controller call below only covers the Google domain today; this witness node is informational (Section 21's own scope law).",
              source_refs: [],
              evidence_refs: [],
              known: [],
              unknown: [],
              expandable: false,
              available_relations: [],
            });
            edges.push({
              edge_id: `E_${retailerNodeId}_HAS_UNKNOWN_${unknownNodeId}`,
              from: retailerNodeId, relation: "HAS_UNKNOWN", to: unknownNodeId,
              state: "DERIVED", observed_at: nowIso(), evidence_refs: [],
              claim_ceiling: "Adapter-derived structural edge connecting the real Target evidence to its real open unknown.",
            });
            edges.push({
              edge_id: `E_${unknownNodeId}_NEXT_BEST_WITNESS_${witnessNodeId}`,
              from: unknownNodeId, relation: "NEXT_BEST_WITNESS", to: witnessNodeId,
              state: "DERIVED", observed_at: nowIso(), evidence_refs: [],
              claim_ceiling: "Adapter-derived structural edge, not a source-native relationship.",
            });
          }
        }
        if (obj.object_class === "PRODUCT") {
          const productNodeId = `PRODUCT_${obj.object_id}`;
          nodes.push({
            node_id: productNodeId,
            object_id: obj.object_id,
            object_class: "PRODUCT",
            display_name: obj.object_id,
            market_moment: [moment],
            platform: [],
            market: [src.formation.market_scope],
            category: [src.formation.category_scope],
            state: "OBSERVED",
            last_observed_at: null,
            claim_ceiling: "Real supply-graph row(s); price/inventory are point-in-time observations, not a live feed.",
            source_refs: ["data/ops/commerce/EXECUTABLE_SUPPLY_GRAPH_RECORDS_GLASS_SKIN_V1.ndjson"],
            evidence_refs: [],
            known: [`brand_id=${obj.brand_id}`, `${obj.variants.length} variant/retailer row(s)`],
            unknown: [],
            expandable: true,
            available_relations: ["OFFERED_BY"],
          });
          edges.push({
            edge_id: `E_${momentNodeId}_REPRESENTED_BY_${productNodeId}`,
            from: momentNodeId, relation: "REPRESENTED_BY", to: productNodeId,
            state: "OBSERVED", observed_at: null, evidence_refs: [],
            claim_ceiling: "Real supply-graph product row.",
          });
          for (const v of obj.variants) {
            const retailerRef = `RETAILER_${v.retailer}`;
            edges.push({
              edge_id: `E_${productNodeId}_OFFERED_BY_${retailerRef}_${v.variant_id}`,
              from: productNodeId, relation: "OFFERED_BY", to: retailerRef,
              state: v.edge_state, observed_at: null,
              evidence_refs: ["data/ops/commerce/EXECUTABLE_SUPPLY_GRAPH_RECORDS_GLASS_SKIN_V1.ndjson"],
              claim_ceiling: `price_observed=${v.price_observed}, inventory_state=${v.inventory_state}, routeability_state=${v.routeability_state}`,
            });
          }
        }
      }
    }
  }

  const content = parseContentObjects();
  // attach content nodes/edges under the WATCH moment
  for (const n of content.nodes) nodes.push(n);
  for (const e of content.edges) edges.push(e);
  const watchMomentId = "MOMENT_WATCH";
  for (const n of content.nodes) {
    edges.push({
      edge_id: `E_${watchMomentId}_REPRESENTED_BY_${n.node_id}`,
      from: watchMomentId, relation: "REPRESENTED_BY", to: n.node_id,
      state: n.state === "IDENTITY_PROVEN" ? "IDENTITY_PROVEN" : "CANDIDATE",
      observed_at: n.last_observed_at, evidence_refs: n.source_refs,
      claim_ceiling: n.claim_ceiling,
    });
  }

  return {
    graph_id: `ST_MARKET_GRAPH_${src.formation.formation_id}_${nowIso()}`,
    formation_id: src.formation.formation_id,
    epoch: src._generated_at,
    nodes,
    edges,
    known_unknowns: src.known_unknowns || [],
    next_best_witnesses: src.next_best_witnesses || [],
    coverage: {
      source_traversable_object_count: src.traversable_object_count,
      normalized_node_count: nodes.length,
      normalized_edge_count: edges.length,
      content_objects_parsed: content.contentObjectsParsed,
    },
    claim_ceiling: src.claim_ceiling,
  };
}

function buildCanaryEstate() {
  const reg = readJson("data/registry/GOOGLE_CATEGORY_CANARY_REGISTRY_V1.json");
  const nodes = reg.contracts.map(c => ({
    node_id: `CANARY_${c.canary_id}`,
    object_id: c.canary_id,
    object_class: "CANARY",
    display_name: c.category_label,
    market_moment: [],
    platform: ["GOOGLE_TRENDS"],
    market: [c.default_geo_eligibility],
    category: [],
    state: c.activation_state,
    last_observed_at: c.last_observed_at,
    claim_ceiling: c.claim_ceiling,
    source_refs: ["data/registry/GOOGLE_CATEGORY_CANARY_REGISTRY_V1.json"],
    evidence_refs: [c.raw_evidence_ref].filter(Boolean),
    known: [],
    unknown: c.decision_unknowns || [],
    expandable: false,
    available_relations: [],
    // extra inspector fields, real, not part of the minimal node contract but preserved:
    canary_id: c.canary_id,
    category_id: c.category_id,
    category_label: c.category_label,
    taxonomy_path: c.taxonomy_path,
    parent_id: c.parent_id,
    taxonomy_depth: c.taxonomy_depth,
    activation_state: c.activation_state,
    activation_reason: c.activation_reason,
    handler_ref: c.handler_ref,
    execution_profile_ref: c.execution_profile_ref,
    last_state: c.last_health_state,
    raw_evidence_ref: c.raw_evidence_ref,
    decision_unknowns: c.decision_unknowns,
    next_best_witness: c.next_best_witness,
  }));
  return {
    total_canonical_categories: reg.TOTAL_CONTRACTS,
    total_contracts: nodes.length,
    reconciliation_pass: reg.TOTAL_CONTRACTS === nodes.length,
    state_distribution: reg.activation_state_distribution_snapshot,
    nodes,
  };
}

// Category Truth Coverage Matrix: all 1,133 Google categories x 4 real lenses.
// LAW: no fabricated cells. A category with no crosswalked formation gets
// UNOBSERVED on commerce/ugc/saves -- honestly, because we have never built
// evidence there, not because we're hiding a green cell. Search is the only
// lens with total (1,133/1,133) address coverage today, via the live canary
// registry -- and even that is address coverage, not observation coverage
// (most are still POTENTIAL, unobserved this epoch).
function bestMomentState(states) {
  // Conservative fold: a lens only reads EARNED when EVERY moment folded into
  // it is EARNED. One partial moment pulls the whole lens down to
  // PARTIALLY_EARNED -- taking the best of a mixed set would overstate the
  // lens (e.g. reporting "Commerce: EARNED" when BUY still has real gaps
  // like Target's BOT_BLOCKED state is exactly the kind of claim inflation
  // this system exists to refuse).
  if (!states.length) return "UNOBSERVED";
  if (states.every((s) => s === "EARNED")) return "EARNED";
  if (states.some((s) => s === "EARNED" || s === "PARTIALLY_EARNED")) return "PARTIALLY_EARNED";
  return "NOT_YET_EARNED";
}

function buildCategoryCoverageMatrix() {
  const taxonomy = readJson("data/registry/GOOGLE_TRENDS_CATEGORY_TAXONOMY_V1.json").nodes;
  const canaryReg = readJson("data/registry/GOOGLE_CATEGORY_CANARY_REGISTRY_V1.json");
  const crosswalk = readJson("data/registry/CATEGORY_FORMATION_CROSSWALK_V1.json").entries;
  const canaryByCategory = new Map(canaryReg.contracts.map(c => [c.category_id, c]));
  const crosswalkByCategory = new Map(crosswalk.map(e => [e.category_id, e]));

  // Only ONE formation exists today (Glass Skin) -- read it once, not per row.
  const formationsById = {};
  for (const e of crosswalk) {
    if (formationsById[e.formation_id]) continue;
    let src;
    try {
      src = readJson("data/ops/hot1000/MARKET_FORMATION_GRAPH_GLASS_SKIN_V1.json");
    } catch (err) {
      continue;
    }
    const m = src.market_moments_with_evidence;
    formationsById[e.formation_id] = {
      commerce_lens: bestMomentState([m.SHOP?.state, m.BUY?.state].filter(Boolean)),
      ugc_lens: bestMomentState([m.WATCH?.state, m.CREATE?.state, m.SHARE?.state].filter(Boolean)),
      saves_lens: bestMomentState([m.SAVE?.state].filter(Boolean)),
      commerce_detail: `SHOP=${m.SHOP?.state || "NOT_RECORDED"}, BUY=${m.BUY?.state || "NOT_RECORDED"}`,
      ugc_detail: `WATCH=${m.WATCH?.state || "NOT_RECORDED"}, CREATE=${m.CREATE?.state || "NOT_RECORDED"}, SHARE=${m.SHARE?.state || "NOT_RECORDED"}`,
      saves_detail: `SAVE=${m.SAVE?.state || "NOT_RECORDED"}`,
    };
  }

  const rows = taxonomy.map(t => {
    const canary = canaryByCategory.get(t.category_id);
    const cw = crosswalkByCategory.get(t.category_id);
    const formation = cw ? formationsById[cw.formation_id] : null;
    return {
      category_id: t.category_id,
      category_label: t.label,
      search_lens: canary ? canary.activation_state : "NO_CANARY_ADDRESS",
      search_last_observed: canary ? canary.last_observed_at : null,
      commerce_lens: formation ? formation.commerce_lens : "UNOBSERVED",
      commerce_detail: formation ? formation.commerce_detail : "No formation built for this category yet.",
      ugc_lens: formation ? formation.ugc_lens : "UNOBSERVED",
      ugc_detail: formation ? formation.ugc_detail : "No formation built for this category yet.",
      saves_lens: formation ? formation.saves_lens : "UNOBSERVED",
      saves_detail: formation ? formation.saves_detail : "No formation built for this category yet. Also: the Pinterest Visual Taste Graph Rail is not yet crosswalked to Google's category taxonomy at all -- this lens is structurally dark for every category until that crosswalk exists, not just this one.",
      formation_id: cw ? cw.formation_id : null,
      formation_display_name: cw ? cw.formation_display_name : null,
      crosswalk_match_method: cw ? cw.match_method : null,
    };
  });

  return {
    total_categories: rows.length,
    lenses: [
      { key: "search_lens", label: "Search demand", source: "GOOGLE_CATEGORY_CANARY_REGISTRY_V1.json (live)", coverage_note: `${rows.length}/${rows.length} categories addressable; states reflect the live epoch's real per-category observations so far.` },
      { key: "commerce_lens", label: "Commerce", source: "EXECUTABLE_SUPPLY_GRAPH_RECORDS + RETAILER_ANSWERABILITY (Glass Skin only)", coverage_note: `${crosswalk.length}/${rows.length} categories have any formation built; commerce is a real lens only where a formation exists.` },
      { key: "ugc_lens", label: "UGC / Creators", source: "TikTok CSI + Falcon creator/video observations (Glass Skin only)", coverage_note: `${crosswalk.length}/${rows.length} categories have any formation built.` },
      { key: "saves_lens", label: "Saves / Taste", source: "Pinterest Visual Taste Graph Rail -- NOT YET crosswalked to Google categories", coverage_note: "Structurally dark for all 1,133 categories today; the rail exists (10 Worlds seed) but has no category_id mapping yet." },
    ],
    crosswalked_formation_count: crosswalk.length,
    rows,
  };
}

// Representation Intelligence insight layer -- Joanna's point: a coverage-
// state matrix is an inventory, not an insight. This is the "so what" layer
// on top of it. LAW: every number below is READ from the source file at
// request time, never hand-copied into this code -- if COSRX's real
// machine_surfaces count changes in KBEAUTY_ROUTING_SPLIT_V1.json, this
// endpoint's output changes with it, automatically, including brands a human
// summary might drop (this mechanically includes Paula's Choice, which a
// hand-written version of this same finding silently omitted).
//
// V1 covers exactly ONE category (93, Skin & Nail Care) because exactly one
// real dataset (the K-beauty routing-economy study, commit 36b81cad6) exists
// for it. Every other category honestly returns available=false -- this is
// not "no insight exists anywhere", it's "no insight has been built for you
// yet", and the two must never be conflated.
const REPRESENTATION_INSIGHT_CATEGORY_IDS = [93];

function buildRepresentationInsight(categoryId) {
  if (!REPRESENTATION_INSIGHT_CATEGORY_IDS.includes(categoryId)) {
    return {
      available: false,
      reason: "No representation-intelligence dataset has been built for this category yet -- this is a gap in our coverage, not a claim that nothing is happening here.",
    };
  }

  const split = readJson("data/machine_answer/KBEAUTY_ROUTING_SPLIT_V1.json");
  const vocab = readJson("data/machine_answer/VOCABULARY_ROUTE_DIVERGENCE_V1.json");
  const s = split.kbeauty_brand_split;

  return {
    available: true,
    schema_sources: ["data/machine_answer/KBEAUTY_ROUTING_SPLIT_V1.json", "data/machine_answer/VOCABULARY_ROUTE_DIVERGENCE_V1.json"],
    produced_at: split._produced_at,
    hypothesis: split.kbeauty_hypothesis_test.hypothesis,
    verdict: split.kbeauty_hypothesis_test.verdict,
    magnitude: split.kbeauty_hypothesis_test.magnitude,
    headline: `${s.KBEAUTY_MACHINE_ONLY.count}:${s.KBEAUTY_BOTH.count} -- AI recommends ${s.KBEAUTY_MACHINE_ONLY.count} K-beauty brands with zero Google SERP presence; only ${s.KBEAUTY_BOTH.count} brand(s) reach both surfaces.`,
    machine_only_brands: s.KBEAUTY_MACHINE_ONLY.brands, // mechanically the full real list -- includes Paula's Choice
    machine_only_count: s.KBEAUTY_MACHINE_ONLY.count,
    bridge_brands: s.KBEAUTY_BOTH.brands,
    evidence_for: split.kbeauty_hypothesis_test.evidence_for,
    evidence_against: split.kbeauty_hypothesis_test.evidence_against,
    vocabulary_divergence_pairs: vocab.pairs.map((p) => ({
      pair_id: p.pair_id, title: p.title,
      query_A: p.query_A, query_A_route: p.query_A_serp_route_class,
      query_B: p.query_B, query_B_route: p.query_B_serp_route_class,
      finding: p.divergence.finding,
    })),
    poc_safe_fact: split.poc_safe_fact.fact,
    investor_significance: split.poc_safe_fact.investor_significance,
  };
}

module.exports = { buildFormationGraph, buildCanaryEstate, buildCategoryCoverageMatrix, buildRepresentationInsight, AUTHORITY_REPO };
