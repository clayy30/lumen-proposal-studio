/**
 * OpenSolar-style roof face + auto panel layout.
 *
 * OpenSolar workflow we mirror:
 * 1. Aerial / satellite underlay
 * 2. Roof faces as polygons (facets) with ridge/gutter
 * 3. Auto-layout: pack modules into each face with setbacks,
 *    oriented toward the gutter line, small inter-module gaps
 */

export type Pt = { x: number; y: number };

export type RoofFacet = {
  id: string;
  /** Face polygon in plan space (viewBox coords), clockwise */
  polygon: Pt[];
  /** Azimuth the array faces (degrees, 180 = south) */
  azimuth: number;
  /** Tilt degrees (visual only in 2D) */
  tilt: number;
  /** Unit vector along gutter / eave (panel long or short edge alignment) */
  gutterDir: Pt;
  /** Unit vector ridge → eave (down the pitch) */
  pitchDir: Pt;
};

export type PanelRect = {
  /** Four corners of the module in plan space */
  corners: [Pt, Pt, Pt, Pt];
  center: Pt;
};

export type ArrayLayout = {
  facetId: string;
  groupId: string;
  panels: PanelRect[];
  panelCount: number;
  azimuth: number;
  tilt: number;
};

function len(v: Pt): number {
  return Math.hypot(v.x, v.y) || 1;
}

function norm(v: Pt): Pt {
  const l = len(v);
  return { x: v.x / l, y: v.y / l };
}

function add(a: Pt, b: Pt): Pt {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Pt, b: Pt): Pt {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(v: Pt, s: number): Pt {
  return { x: v.x * s, y: v.y * s };
}

function rot(v: Pt, deg: number): Pt {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

function centroid(poly: Pt[]): Pt {
  const n = poly.length || 1;
  const s = poly.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / n, y: s.y / n };
}

/** Point-in-polygon (ray cast) */
function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** All four corners of a panel must sit inside the facet (with optional inset poly) */
function panelFits(corners: Pt[], poly: Pt[]): boolean {
  return corners.every((c) => pointInPoly(c, poly));
}

/**
 * Build a residential roof plan that looks like OpenSolar 2D design:
 * main ridge, two primary pitches, optional hip/wing for extra arrays.
 *
 * viewBox ~ 0..480 × 0..360, house centered.
 */
export function buildResidentialRoof(
  arrayCount: number,
  groups: Array<{ azimuth: number; tilt: number; panels: number; id: string }>
): RoofFacet[] {
  // House footprint roughly 200×140, ridge runs E–W (horizontal)
  // North is up (smaller y). South face is bottom half of roof.

  const ridgeY = 150;
  const ridgeL = { x: 150, y: ridgeY };
  const ridgeR = { x: 330, y: ridgeY };

  // South pitch (main) — larger, where most arrays go
  const southEaveL = { x: 135, y: 248 };
  const southEaveR = { x: 345, y: 248 };

  // North pitch (back side — usually fewer/no panels)
  const northEaveL = { x: 145, y: 72 };
  const northEaveR = { x: 335, y: 72 };

  const facets: RoofFacet[] = [];

  if (arrayCount <= 1) {
    facets.push({
      id: "south",
      polygon: [ridgeL, ridgeR, southEaveR, southEaveL],
      azimuth: 180,
      tilt: groups[0]?.tilt ?? 20,
      gutterDir: { x: 1, y: 0 },
      pitchDir: { x: 0, y: 1 },
    });
    // Show north face empty (roof completeness)
    facets.push({
      id: "north",
      polygon: [ridgeL, northEaveL, northEaveR, ridgeR],
      azimuth: 0,
      tilt: groups[0]?.tilt ?? 20,
      gutterDir: { x: 1, y: 0 },
      pitchDir: { x: 0, y: -1 },
    });
    return facets;
  }

  // Split south pitch into two faces for multi-array (S + SW) like OpenSolar groups
  const splitT = 0.55;
  const ridgeMid = {
    x: ridgeL.x + (ridgeR.x - ridgeL.x) * splitT,
    y: ridgeY,
  };
  const eaveMid = {
    x: southEaveL.x + (southEaveR.x - southEaveL.x) * splitT,
    y: southEaveL.y,
  };

  facets.push({
    id: "south",
    polygon: [ridgeL, ridgeMid, eaveMid, southEaveL],
    azimuth: 180,
    tilt: groups[0]?.tilt ?? 22,
    gutterDir: { x: 1, y: 0 },
    pitchDir: { x: 0, y: 1 },
  });

  // SW face: slight plan rotation via parallelogram skew
  const swEaveR = { x: 355, y: 240 };
  const swRidgeR = { x: 340, y: 155 };
  facets.push({
    id: "southwest",
    polygon: [ridgeMid, swRidgeR, swEaveR, eaveMid],
    azimuth: 225,
    tilt: groups[1]?.tilt ?? 22,
    gutterDir: norm({ x: 0.92, y: -0.15 }),
    pitchDir: norm({ x: 0.12, y: 0.99 }),
  });

  // North face for roof completeness
  facets.push({
    id: "north",
    polygon: [ridgeL, northEaveL, northEaveR, ridgeR],
    azimuth: 0,
    tilt: 22,
    gutterDir: { x: 1, y: 0 },
    pitchDir: { x: 0, y: -1 },
  });

  if (arrayCount >= 3) {
    // West wing — garage / side roof
    facets.push({
      id: "west",
      polygon: [
        { x: 95, y: 130 },
        { x: 150, y: 120 },
        { x: 150, y: 230 },
        { x: 90, y: 220 },
      ],
      azimuth: 270,
      tilt: groups[2]?.tilt ?? 18,
      gutterDir: { x: 0, y: 1 },
      pitchDir: { x: -1, y: 0 },
    });
  }

  return facets;
}

function azimuthDelta(a: number, b: number): number {
  return Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));
}

export function assignGroupsToFacets(
  groups: Array<{ id: string; azimuth: number; tilt: number; panels: number }>,
  facets: RoofFacet[]
): Array<{ group: (typeof groups)[0]; facet: RoofFacet }> {
  // Prefer facets that are "arrayable" (not pure north unless needed)
  const arrayable = facets.filter((f) => f.id !== "north" || groups.length > facets.length - 1);
  const used = new Set<string>();

  return groups.map((group) => {
    let best = arrayable[0] ?? facets[0];
    let bestScore = Infinity;
    for (const facet of arrayable.length ? arrayable : facets) {
      if (facet.id === "north" && groups.length <= 2) continue;
      const score =
        azimuthDelta(group.azimuth, facet.azimuth) + (used.has(facet.id) ? 80 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = facet;
      }
    }
    used.add(best.id);
    return { group, facet: best };
  });
}

/**
 * OpenSolar auto-layout approximation:
 * - Module portrait: short side along gutter, long side down pitch
 *   (or landscape if that packs better)
 * - Setback from all edges
 * - Uniform gap between modules
 * - Pack until count reached or face full
 */
export function autoLayoutPanels(
  facet: RoofFacet,
  panelCount: number,
  opts: {
    /** Module width along gutter (plan units) */
    moduleW?: number;
    /** Module height down pitch (plan units) */
    moduleH?: number;
    gap?: number;
    setback?: number;
  } = {}
): PanelRect[] {
  const moduleW = opts.moduleW ?? 14;
  const moduleH = opts.moduleH ?? 22;
  const gap = opts.gap ?? 1.6;
  const setback = opts.setback ?? 8;

  const poly = facet.polygon;
  const c = centroid(poly);

  // Local basis: u along gutter, v along pitch
  let u = norm(facet.gutterDir);
  let v = norm(facet.pitchDir);
  // Ensure right-handed-ish for consistent layout
  const cross = u.x * v.y - u.y * v.x;
  if (cross < 0) v = scale(v, -1);

  // Bounding box in local UV of polygon vertices
  const local = poly.map((p) => {
    const d = sub(p, c);
    return { u: d.x * u.x + d.y * u.y, v: d.x * v.x + d.y * v.y };
  });
  const uMin = Math.min(...local.map((p) => p.u)) + setback;
  const uMax = Math.max(...local.map((p) => p.u)) - setback;
  const vMin = Math.min(...local.map((p) => p.v)) + setback;
  const vMax = Math.max(...local.map((p) => p.v)) - setback;

  if (uMax <= uMin || vMax <= vMin) return [];

  // Try portrait then landscape; pick orientation that fits more modules
  const orientations = [
    { w: moduleW, h: moduleH },
    { w: moduleH, h: moduleW },
  ];

  let bestPanels: PanelRect[] = [];

  for (const ori of orientations) {
    const cellW = ori.w + gap;
    const cellH = ori.h + gap;
    const cols = Math.max(1, Math.floor((uMax - uMin + gap) / cellW));
    const rows = Math.max(1, Math.floor((vMax - vMin + gap) / cellH));

    // Center grid in available UV
    const gridW = cols * cellW - gap;
    const gridH = rows * cellH - gap;
    const u0 = uMin + ((uMax - uMin) - gridW) / 2;
    const v0 = vMin + ((vMax - vMin) - gridH) / 2;

    const panels: PanelRect[] = [];
    for (let r = 0; r < rows && panels.length < panelCount; r++) {
      for (let col = 0; col < cols && panels.length < panelCount; col++) {
        const cu = u0 + col * cellW + ori.w / 2;
        const cv = v0 + r * cellH + ori.h / 2;
        const center = add(c, add(scale(u, cu), scale(v, cv)));

        const hw = ori.w / 2;
        const hh = ori.h / 2;
        // Corners: TL, TR, BR, BL in local u/v
        const corners: [Pt, Pt, Pt, Pt] = [
          add(c, add(scale(u, cu - hw), scale(v, cv - hh))),
          add(c, add(scale(u, cu + hw), scale(v, cv - hh))),
          add(c, add(scale(u, cu + hw), scale(v, cv + hh))),
          add(c, add(scale(u, cu - hw), scale(v, cv + hh))),
        ];

        // Slight inset check: require center + corners inside
        if (!panelFits(corners, poly)) continue;
        if (!pointInPoly(center, poly)) continue;

        panels.push({ corners, center });
      }
    }

    if (panels.length > bestPanels.length) bestPanels = panels;
  }

  // If we still have fewer panels than requested, shrink modules and retry once
  if (bestPanels.length < panelCount && bestPanels.length < panelCount * 0.85) {
    return autoLayoutPanels(facet, panelCount, {
      moduleW: moduleW * 0.85,
      moduleH: moduleH * 0.85,
      gap: gap * 0.9,
      setback: setback * 0.75,
    });
  }

  return bestPanels.slice(0, panelCount);
}

export function layoutSystem(
  groups: Array<{ id: string; azimuth: number; tilt: number; panels: number }>
): { facets: RoofFacet[]; arrays: ArrayLayout[]; ridge: [Pt, Pt] } {
  const facets = buildResidentialRoof(Math.max(1, groups.length), groups);
  const assigned = assignGroupsToFacets(groups, facets);

  const arrays: ArrayLayout[] = assigned.map(({ group, facet }) => {
    // Scale module size to face so dense OpenSolar-like packing
    const poly = facet.polygon;
    const c = centroid(poly);
    const span = Math.max(
      ...poly.map((p) => Math.hypot(p.x - c.x, p.y - c.y)),
      40
    );
    // Target ~ panel area packing; larger faces → slightly larger modules
    const scaleMod = Math.min(1.15, Math.max(0.75, span / 90));
    const panels = autoLayoutPanels(facet, group.panels, {
      moduleW: 13 * scaleMod,
      moduleH: 21 * scaleMod,
      gap: 1.5,
      setback: 7,
    });

    return {
      facetId: facet.id,
      groupId: group.id,
      panels,
      panelCount: group.panels,
      azimuth: group.azimuth,
      tilt: group.tilt,
    };
  });

  return {
    facets,
    arrays,
    ridge: [
      { x: 150, y: 150 },
      { x: 330, y: 150 },
    ],
  };
}

export function polyPoints(poly: Pt[]): string {
  return poly.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** Satellite imagery URL (Esri World Imagery) — no API key, CORS-friendly for <img> */
export function satelliteUrl(
  lat: number,
  lon: number,
  opts: { width?: number; height?: number; meters?: number } = {}
): string {
  const width = opts.width ?? 900;
  const height = opts.height ?? 700;
  // ~ half-span in degrees (rough: 1° lat ≈ 111km)
  const meters = opts.meters ?? 55;
  const dLat = meters / 111_320;
  const dLon = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const minLon = lon - dLon;
  const maxLon = lon + dLon;
  const minLat = lat - dLat;
  const maxLat = lat + dLat;
  const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=${width},${height}&format=jpg&f=image`;
}

// silence unused helpers if tree-shaken later
void rot;
