"use client";

import { useMemo } from "react";
import type { SystemDesign, Address, PanelGroup } from "@/lib/types";
import { kw, number } from "@/lib/format";

/**
 * Permit-set style engineered roof / array plan.
 * Orthographic drafting — not a marketing 3D/roof render.
 * Modeled after city/county solar plan sheets: title block, north arrow,
 * scale, roof outline, dimensioned module arrays, equipment schedule.
 */
export function DesignPreview({
  system,
  address,
  orgName,
  projectId,
  compact = false,
}: {
  system: SystemDesign;
  address?: Address;
  orgName?: string;
  projectId?: string;
  compact?: boolean;
}) {
  const plan = useMemo(() => {
    const groups: PanelGroup[] = system.panelGroups.length
      ? system.panelGroups
      : [
          {
            id: "default",
            panels: system.panelCount,
            azimuth: 180,
            tilt: 20,
            orientation: "South",
          },
        ];
    return buildEngineeringPlan(system, groups);
  }, [system]);

  const siteLabel = address
    ? [address.street, address.city, address.state, address.zip]
        .filter(Boolean)
        .join(", ")
    : "PROJECT SITE";

  const sheetId = (projectId ?? system.id).slice(0, 12).toUpperCase();
  const company = orgName ?? "LUMEN SOLAR";
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return (
    <div
      className={
        compact
          ? "overflow-hidden rounded-lg border border-neutral-400 bg-white"
          : "overflow-hidden rounded-xl border border-neutral-400 bg-[#f7f6f2] shadow-sm"
      }
    >
      {/* Drawing sheet frame */}
      <div className="border-b border-neutral-400 bg-white">
        <svg
          viewBox="0 0 720 520"
          className="h-auto w-full"
          role="img"
          aria-label="Engineered solar array plan for permit submittal"
        >
          {/* Sheet border (double line like plan sets) */}
          <rect
            x="12"
            y="12"
            width="696"
            height="496"
            fill="#fafaf8"
            stroke="#1a1a1a"
            strokeWidth="1.5"
          />
          <rect
            x="18"
            y="18"
            width="684"
            height="484"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="0.6"
          />

          {/* Drawing area border */}
          <rect
            x="28"
            y="36"
            width="500"
            height="400"
            fill="#ffffff"
            stroke="#1a1a1a"
            strokeWidth="0.75"
          />

          {/* Light grid (construction) */}
          <g opacity="0.12" stroke="#333" strokeWidth="0.3">
            {Array.from({ length: 24 }).map((_, i) => (
              <line
                key={`vg${i}`}
                x1={28 + (i + 1) * 20}
                y1={36}
                x2={28 + (i + 1) * 20}
                y2={436}
              />
            ))}
            {Array.from({ length: 19 }).map((_, i) => (
              <line
                key={`hg${i}`}
                x1={28}
                y1={36 + (i + 1) * 20}
                x2={528}
                y2={36 + (i + 1) * 20}
              />
            ))}
          </g>

          {/* Drawing title above plan */}
          <text
            x="278"
            y="52"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="9"
            fontWeight="700"
            fill="#111"
            letterSpacing="1.2"
          >
            ROOF PLAN — PV MODULE LAYOUT
          </text>
          <text
            x="278"
            y="64"
            textAnchor="middle"
            fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
            fontSize="7"
            fill="#444"
          >
            NOT FOR CONSTRUCTION · PRELIMINARY FOR PROPOSAL · FINAL PER SITE SURVEY
          </text>

          {/* North arrow */}
          <g transform="translate(68 92)">
            <circle cx="0" cy="0" r="16" fill="none" stroke="#111" strokeWidth="0.8" />
            <polygon points="0,-12 4,6 0,3 -4,6" fill="#111" />
            <text
              y="28"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="8"
              fontWeight="700"
              fill="#111"
            >
              N
            </text>
          </g>

          {/* Scale bar */}
          <g transform="translate(400 420)">
            <text
              y="-6"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6.5"
              fill="#333"
            >
              SCALE: 1&quot; ≈ 10&apos;-0&quot; (NTS)
            </text>
            <line x1="0" y1="0" x2="80" y2="0" stroke="#111" strokeWidth="1.2" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#111" strokeWidth="1" />
            <line x1="40" y1="-2" x2="40" y2="2" stroke="#111" strokeWidth="0.8" />
            <line x1="80" y1="-3" x2="80" y2="3" stroke="#111" strokeWidth="1" />
            <text
              y="12"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#333"
            >
              0
            </text>
            <text
              x="36"
              y="12"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#333"
            >
              5&apos;
            </text>
            <text
              x="72"
              y="12"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#333"
            >
              10&apos;
            </text>
          </g>

          {/* Building footprint + roof plan */}
          <g transform="translate(278 248)">
            {/* Property setback dashed line */}
            <rect
              x={-plan.footprint.w / 2 - 28}
              y={-plan.footprint.h / 2 - 28}
              width={plan.footprint.w + 56}
              height={plan.footprint.h + 56}
              fill="none"
              stroke="#888"
              strokeWidth="0.5"
              strokeDasharray="4 3"
            />
            <text
              x={-plan.footprint.w / 2 - 24}
              y={-plan.footprint.h / 2 - 18}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#666"
            >
              PROPERTY / FIRE SETBACK (TYP.)
            </text>

            {/* Structure outline */}
            <rect
              x={-plan.footprint.w / 2}
              y={-plan.footprint.h / 2}
              width={plan.footprint.w}
              height={plan.footprint.h}
              fill="#f0efe9"
              stroke="#111"
              strokeWidth="1.4"
            />

            {/* Ridge line + no-module clearance band (modules never cross) */}
            <rect
              x={-plan.footprint.w / 2 + 4}
              y={-8}
              width={plan.footprint.w - 8}
              height={16}
              fill="rgba(180,40,40,0.06)"
              stroke="none"
            />
            <line
              x1={-plan.footprint.w / 2 + 8}
              y1={0}
              x2={plan.footprint.w / 2 - 8}
              y2={0}
              stroke="#111"
              strokeWidth="1.1"
              strokeDasharray="6 2"
            />
            <text
              x={plan.footprint.w / 2 - 10}
              y={-10}
              textAnchor="end"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              RIDGE — NO MODULES
            </text>

            {/* Eave labels */}
            <text
              y={plan.footprint.h / 2 + 14}
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#333"
            >
              EAVE (S)
            </text>
            <text
              y={-plan.footprint.h / 2 - 8}
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#333"
            >
              EAVE (N)
            </text>

            {/* Overall building dimensions */}
            <DimensionH
              x1={-plan.footprint.w / 2}
              x2={plan.footprint.w / 2}
              y={plan.footprint.h / 2 + 28}
              label={plan.footprint.wLabel}
            />
            <DimensionV
              y1={-plan.footprint.h / 2}
              y2={plan.footprint.h / 2}
              x={-plan.footprint.w / 2 - 18}
              label={plan.footprint.hLabel}
            />

            {/* Module arrays */}
            {plan.arrays.map((arr) => (
              <g key={arr.id} transform={`translate(${arr.ox} ${arr.oy})`}>
                {/* Array boundary */}
                <rect
                  x={0}
                  y={0}
                  width={arr.gridW}
                  height={arr.gridH}
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="1"
                />
                {/* Modules */}
                {arr.modules.map((m, i) => (
                  <g key={i}>
                    <rect
                      x={m.x}
                      y={m.y}
                      width={m.w}
                      height={m.h}
                      fill="#e8eef4"
                      stroke="#1a3a5c"
                      strokeWidth="0.65"
                    />
                    {/* Module diagonal hatch (eng drawing convention for PV) */}
                    <line
                      x1={m.x}
                      y1={m.y + m.h}
                      x2={m.x + m.w}
                      y2={m.y}
                      stroke="#4a6a8a"
                      strokeWidth="0.25"
                      opacity="0.5"
                    />
                  </g>
                ))}
                {/* Array tag bubble */}
                <g transform={`translate(${arr.gridW / 2} ${-12})`}>
                  <circle r="9" fill="#fff" stroke="#111" strokeWidth="0.9" />
                  <text
                    y="3"
                    textAnchor="middle"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    fontSize="8"
                    fontWeight="700"
                    fill="#111"
                  >
                    {arr.tag}
                  </text>
                </g>
                {/* Array callout */}
                <text
                  x={arr.gridW / 2}
                  y={arr.gridH + 11}
                  textAnchor="middle"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="5.5"
                  fill="#222"
                >
                  {arr.label}
                </text>
              </g>
            ))}

            {/* Fire setback note on roof edge */}
            <text
              x={plan.footprint.w / 2 - 4}
              y={plan.footprint.h / 2 - 6}
              textAnchor="end"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5"
              fill="#555"
            >
              3&apos;-0&quot; SETBACK (TYP.)
            </text>
          </g>

          {/* Legend */}
          <g transform="translate(40 380)">
            <text
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6.5"
              fontWeight="700"
              fill="#111"
            >
              LEGEND
            </text>
            <rect
              x="0"
              y="8"
              width="12"
              height="8"
              fill="#e8eef4"
              stroke="#1a3a5c"
              strokeWidth="0.6"
            />
            <line x1="0" y1="16" x2="12" y2="8" stroke="#4a6a8a" strokeWidth="0.3" />
            <text
              x="16"
              y="15"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#222"
            >
              PV MODULE
            </text>
            <line
              x1="70"
              y1="12"
              x2="90"
              y2="12"
              stroke="#111"
              strokeWidth="0.8"
              strokeDasharray="5 2"
            />
            <text
              x="94"
              y="15"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#222"
            >
              RIDGE
            </text>
            <rect
              x="130"
              y="8"
              width="16"
              height="10"
              fill="none"
              stroke="#888"
              strokeWidth="0.5"
              strokeDasharray="3 2"
            />
            <text
              x="150"
              y="15"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fill="#222"
            >
              SETBACK
            </text>
          </g>

          {/* ── Right column: equipment schedule + notes ── */}
          <g transform="translate(540 36)">
            <rect
              x="0"
              y="0"
              width="150"
              height="400"
              fill="#fff"
              stroke="#1a1a1a"
              strokeWidth="0.75"
            />

            {/* Schedule header */}
            <rect x="0" y="0" width="150" height="18" fill="#1a1a1a" />
            <text
              x="75"
              y="12"
              textAnchor="middle"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="7"
              fontWeight="700"
              fill="#fff"
              letterSpacing="0.8"
            >
              EQUIPMENT SCHEDULE
            </text>

            {plan.scheduleRows.map((row, i) => (
              <g key={row.k} transform={`translate(0 ${18 + i * 28})`}>
                <line
                  x1="0"
                  y1="28"
                  x2="150"
                  y2="28"
                  stroke="#ccc"
                  strokeWidth="0.4"
                />
                <text
                  x="6"
                  y="11"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="5.5"
                  fill="#666"
                >
                  {row.k}
                </text>
                <text
                  x="6"
                  y="21"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="7"
                  fontWeight="600"
                  fill="#111"
                >
                  {row.v}
                </text>
              </g>
            ))}

            {/* Array table */}
            <g transform={`translate(0 ${18 + plan.scheduleRows.length * 28 + 8})`}>
              <rect x="0" y="0" width="150" height="14" fill="#eee" />
              <text
                x="6"
                y="10"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="6"
                fontWeight="700"
                fill="#111"
              >
                ARRAY SCHEDULE
              </text>
              <text
                x="6"
                y="26"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontSize="5.5"
                fill="#444"
              >
                ID  QTY  AZ  TILT  FACE
              </text>
              {plan.arrays.map((arr, i) => (
                <text
                  key={arr.id}
                  x="6"
                  y={40 + i * 12}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontSize="6.5"
                  fill="#111"
                >
                  {arr.tag}   {String(arr.count).padStart(2, " ")}   {arr.az}°  {arr.tilt}°  {arr.face}
                </text>
              ))}
            </g>
          </g>

          {/* General notes strip */}
          <g transform="translate(28 448)">
            <text
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6"
              fontWeight="700"
              fill="#111"
            >
              GENERAL NOTES
            </text>
            <text
              y="11"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              1. ALL WORK SHALL COMPLY WITH NEC, IBC/IRC, AND LOCAL AHJ REQUIREMENTS. 2. MODULE LAYOUT SUBJECT TO FINAL ROOF MEASUREMENTS &amp; STRUCTURAL REVIEW.
            </text>
            <text
              y="21"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              3. FIRE ACCESS PATHWAYS PER IFC / LOCAL CODE. 4. RACKING &amp; ATTACHMENT PER MANUFACTURER SPECS &amp; SEALED ENGINEERING AS REQUIRED.
            </text>
            <text
              y="31"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              5. ELECTRICAL RISER / SLD ON SEPARATE SHEET. 6. THIS SHEET IS A PROPOSAL EXHIBIT — FINAL PERMIT SET BY DESIGN PROFESSIONAL OF RECORD.
            </text>
          </g>

          {/* Title block (bottom right — classic plan set) */}
          <g transform="translate(480 448)">
            <rect
              x="0"
              y="0"
              width="210"
              height="52"
              fill="#fff"
              stroke="#1a1a1a"
              strokeWidth="1"
            />
            <line x1="0" y1="16" x2="210" y2="16" stroke="#1a1a1a" strokeWidth="0.5" />
            <line x1="140" y1="16" x2="140" y2="52" stroke="#1a1a1a" strokeWidth="0.5" />
            <line x1="0" y1="34" x2="140" y2="34" stroke="#1a1a1a" strokeWidth="0.4" />

            <text
              x="4"
              y="11"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="6.5"
              fontWeight="700"
              fill="#111"
            >
              {company.toUpperCase()}
            </text>
            <text
              x="4"
              y="28"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              PROJECT: {truncate(siteLabel.toUpperCase(), 36)}
            </text>
            <text
              x="4"
              y="46"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              SYSTEM: {kw(system.kwStc)} DC · {system.panelCount} MODULES
            </text>

            <text
              x="145"
              y="28"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              DATE {dateStr}
            </text>
            <text
              x="145"
              y="40"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#333"
            >
              DWG NO.
            </text>
            <text
              x="145"
              y="49"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="8"
              fontWeight="700"
              fill="#111"
            >
              PV-1
            </text>
            <text
              x="206"
              y="11"
              textAnchor="end"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              fontSize="5.5"
              fill="#555"
            >
              {sheetId}
            </text>
          </g>
        </svg>
      </div>

      {/* Spec strip under drawing (readable on web / PDF) */}
      {!compact && (
        <div className="grid grid-cols-2 gap-px border-t border-neutral-300 bg-neutral-200 sm:grid-cols-4">
          {[
            {
              label: "DC system size",
              value: kw(system.kwStc),
            },
            {
              label: "Module qty",
              value: `${system.panelCount} × ${system.hardware.modules?.watts ?? 400}W`,
            },
            {
              label: "Inverter",
              value: system.hardware.inverter?.code ?? "—",
            },
            {
              label: "Est. annual",
              value: `${number(system.production.annualKwh)} kWh`,
            },
          ].map((c) => (
            <div key={c.label} className="bg-[#f7f6f2] px-3 py-2.5">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                {c.label}
              </div>
              <div className="mt-0.5 truncate font-mono text-[12px] font-semibold text-neutral-900">
                {c.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Geometry helpers ─── */

type EngModule = { x: number; y: number; w: number; h: number };
type EngArray = {
  id: string;
  tag: string;
  ox: number;
  oy: number;
  gridW: number;
  gridH: number;
  modules: EngModule[];
  count: number;
  az: number;
  tilt: number;
  face: string;
  label: string;
};

/**
 * Roof faces never share modules across the ridge.
 * Plan coords: +Y = south pitch, −Y = north pitch, ridge at Y = 0.
 * Each array is placed wholly on one face with ridge & eave setbacks.
 */
function buildEngineeringPlan(system: SystemDesign, groups: PanelGroup[]) {
  // Module plan dimensions (portrait) — proportional, not CAD-true
  const MOD_W = 10;
  const MOD_H = 16;
  const GAP = 1.2;

  // Building footprint (plan units)
  const fw = 200;
  const fh = 140;

  // Clear zone each side of ridge — modules cannot enter
  const RIDGE_CLEAR = 10;
  const EDGE_SETBACK = 14; // side / eave setback (fire access)

  // Usable band on each pitch (exclusive of ridge clearance)
  const southUsable = {
    yMin: RIDGE_CLEAR, // just south of ridge
    yMax: fh / 2 - EDGE_SETBACK,
    xMin: -fw / 2 + EDGE_SETBACK,
    xMax: fw / 2 - EDGE_SETBACK,
  };
  const northUsable = {
    yMin: -fh / 2 + EDGE_SETBACK,
    yMax: -RIDGE_CLEAR, // just north of ridge
    xMin: -fw / 2 + EDGE_SETBACK,
    xMax: fw / 2 - EDGE_SETBACK,
  };

  // Free-space cursors per face: next X along eave, and occupied Y depth from ridge
  const faceState: Record<
    "S" | "N",
    { nextX: number; occupiedTowardEave: number }
  > = {
    S: { nextX: southUsable.xMin, occupiedTowardEave: 0 },
    N: { nextX: northUsable.xMin, occupiedTowardEave: 0 },
  };

  const arrays: EngArray[] = [];

  groups.forEach((g, i) => {
    const face = resolveFace(g); // "S" | "N" only — never straddles ridge
    const band = face === "S" ? southUsable : northUsable;
    const faceDepth = band.yMax - band.yMin;
    const faceWidth = band.xMax - band.xMin;
    const state = faceState[face];

    // Fit grid so height never exceeds remaining face depth (cannot cross ridge)
    const depthLeft = faceDepth - state.occupiedTowardEave;
    const maxRows = Math.max(1, Math.floor((Math.max(depthLeft, faceDepth) + GAP) / (MOD_H + GAP)));
    let cols = pickCols(g.panels);
    let rows = Math.ceil(g.panels / cols);
    if (rows > maxRows) {
      rows = maxRows;
      cols = Math.ceil(g.panels / rows);
    }
    const maxCols = Math.max(1, Math.floor((faceWidth + GAP) / (MOD_W + GAP)));
    if (cols > maxCols) {
      cols = maxCols;
      rows = Math.min(maxRows, Math.ceil(g.panels / cols));
    }

    let gridW = cols * (MOD_W + GAP) - GAP;
    let gridH = rows * (MOD_H + GAP) - GAP;

    // If still deeper than face, force single-row strip along eave
    if (gridH > faceDepth) {
      rows = Math.max(1, Math.floor((faceDepth + GAP) / (MOD_H + GAP)));
      cols = Math.ceil(g.panels / rows);
      const maxC = Math.max(1, Math.floor((faceWidth + GAP) / (MOD_W + GAP)));
      cols = Math.min(cols, maxC);
      gridW = cols * (MOD_W + GAP) - GAP;
      gridH = rows * (MOD_H + GAP) - GAP;
    }

    // Place left-to-right; if no room in X, start a new "row" of arrays toward the eave
    let ox = state.nextX;
    let rowOffsetFromRidge = state.occupiedTowardEave;
    if (ox + gridW > band.xMax + 0.1) {
      ox = band.xMin;
      rowOffsetFromRidge = state.occupiedTowardEave; // already accounts for prior rows
      // bump toward eave by prior max height on this packing row — use gridH of this array
      // (simple: stack below previous occupied depth)
    }
    ox = Math.min(Math.max(band.xMin, ox), band.xMax - gridW);

    // Y placement: entire array strictly on one side of ridge
    let oy: number;
    if (face === "S") {
      // South: +Y from ridge; top of array at ridge setback + packing offset
      oy = RIDGE_CLEAR + rowOffsetFromRidge;
      if (oy + gridH > band.yMax) {
        oy = band.yMax - gridH;
      }
      oy = Math.max(RIDGE_CLEAR, oy);
      // Hard rule: top edge never north of ridge clearance
      if (oy < RIDGE_CLEAR) oy = RIDGE_CLEAR;
    } else {
      // North: −Y from ridge; bottom of array at −ridge setback − packing
      oy = -RIDGE_CLEAR - rowOffsetFromRidge - gridH;
      if (oy < band.yMin) {
        oy = band.yMin;
      }
      // Hard rule: bottom edge never south of ridge clearance
      if (oy + gridH > -RIDGE_CLEAR) {
        oy = -RIDGE_CLEAR - gridH;
      }
    }

    const modules: EngModule[] = [];
    let n = 0;
    for (let r = 0; r < rows && n < g.panels; r++) {
      const remaining = g.panels - n;
      const colsThis = Math.min(cols, remaining);
      const xPad = ((cols - colsThis) * (MOD_W + GAP)) / 2;
      for (let c = 0; c < colsThis; c++) {
        modules.push({
          x: xPad + c * (MOD_W + GAP),
          y: r * (MOD_H + GAP),
          w: MOD_W,
          h: MOD_H,
        });
        n++;
      }
    }

    const tag = `A${i + 1}`;
    arrays.push({
      id: g.id,
      tag,
      ox,
      oy,
      gridW,
      gridH,
      modules,
      count: g.panels,
      az: Math.round(g.azimuth),
      tilt: Math.round(g.tilt),
      face,
      label: `${g.panels} MOD · AZ ${Math.round(g.azimuth)}° · ${Math.round(g.tilt)}° TILT · ${face} FACE`,
    });

    // Advance packing cursors on this face only
    state.nextX = ox + gridW + 10;
    if (state.nextX + MOD_W > band.xMax) {
      // next array on this face starts a new band toward the eave
      state.nextX = band.xMin;
      state.occupiedTowardEave += gridH + 8;
    } else {
      // same band — track max height so a wrap clears this row
      state.occupiedTowardEave = Math.max(state.occupiedTowardEave, gridH + 4);
    }
  });

  const modCode = system.hardware.modules?.code ?? "PV MODULE";
  const invCode = system.hardware.inverter?.code ?? "INVERTER";
  const bat =
    system.hasBattery && system.hardware.battery
      ? `${system.hardware.battery.code} (${system.batteryKwh ?? system.hardware.battery.kwh} kWh)`
      : "N/A";

  const scheduleRows = [
    { k: "MODULE", v: truncate(modCode, 22) },
    {
      k: "MODULE RATING",
      v: `${system.hardware.modules?.watts ?? 400} W STC`,
    },
    { k: "QUANTITY", v: `${system.panelCount} EA` },
    { k: "DC CAPACITY", v: `${system.kwStc.toFixed(2)} kW` },
    { k: "INVERTER", v: truncate(invCode, 22) },
    {
      k: "INVERTER QTY",
      v: `${system.hardware.inverter?.quantity ?? system.panelCount} EA`,
    },
    { k: "STORAGE", v: truncate(bat, 22) },
    {
      k: "RACKING",
      v: "FLUSH ROOF MOUNT",
    },
  ];

  return {
    footprint: {
      w: fw,
      h: fh,
      wLabel: `${Math.round(fw / 5)}'-0"`,
      hLabel: `${Math.round(fh / 5)}'-0"`,
    },
    arrays,
    scheduleRows,
  };
}

/** Map OpenSolar group → roof face. Gable plan only has N/S pitches. */
function resolveFace(g: PanelGroup): "S" | "N" {
  const o = (g.orientation ?? "").toLowerCase();
  if (o.includes("north") || o === "n") return "N";
  if (o.includes("south") || o === "s" || o.includes("southwest") || o.includes("southeast"))
    return "S";
  // Azimuth: 0=N, 90=E, 180=S, 270=W — E/W put on south pitch for this simple plan
  const az = ((g.azimuth % 360) + 360) % 360;
  if (az >= 315 || az < 45) return "N";
  return "S"; // S, SE, SW, E, W → south pitch (primary production face)
}

function pickCols(count: number): number {
  if (count <= 6) return Math.min(count, 3);
  if (count <= 12) return 4;
  if (count <= 18) return 5;
  if (count <= 24) return 6;
  if (count <= 36) return 7;
  return Math.min(8, Math.ceil(Math.sqrt(count * 1.2)));
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function DimensionH({
  x1,
  x2,
  y,
  label,
}: {
  x1: number;
  x2: number;
  y: number;
  label: string;
}) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#111" strokeWidth="0.5" />
      <line x1={x1} y1={y - 3} x2={x1} y2={y + 3} stroke="#111" strokeWidth="0.5" />
      <line x1={x2} y1={y - 3} x2={x2} y2={y + 3} stroke="#111" strokeWidth="0.5" />
      <text
        x={(x1 + x2) / 2}
        y={y + 10}
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="6"
        fill="#111"
      >
        {label}
      </text>
    </g>
  );
}

function DimensionV({
  y1,
  y2,
  x,
  label,
}: {
  y1: number;
  y2: number;
  x: number;
  label: string;
}) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2} stroke="#111" strokeWidth="0.5" />
      <line x1={x - 3} y1={y1} x2={x + 3} y2={y1} stroke="#111" strokeWidth="0.5" />
      <line x1={x - 3} y1={y2} x2={x + 3} y2={y2} stroke="#111" strokeWidth="0.5" />
      <text
        x={x - 6}
        y={(y1 + y2) / 2}
        textAnchor="middle"
        transform={`rotate(-90 ${x - 6} ${(y1 + y2) / 2})`}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontSize="6"
        fill="#111"
      >
        {label}
      </text>
    </g>
  );
}

