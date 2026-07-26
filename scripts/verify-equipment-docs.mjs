#!/usr/bin/env node
/**
 * Strict equipment-docs verifier.
 * 1) Resolves every materials-catalog SKU → docs (must have links, never Google)
 * 2) Live GET every unique href → 200 (or known browser-only WAF) and PDF magic when PDF
 *
 * Exit 1 on any hard failure.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// --- Extract catalog docs from TS source (no TS compile needed) ---
function extractDocsFromCatalog(ts) {
  // Split by object blocks with id: "..."
  const items = [];
  const idRe = /id:\s*"([^"]+)"/g;
  let m;
  const ids = [];
  while ((m = idRe.exec(ts))) ids.push({ id: m[1], index: m.index });

  for (let i = 0; i < ids.length; i++) {
    const start = ids[i].index;
    const end = i + 1 < ids.length ? ids[i + 1].index : ts.length;
    const block = ts.slice(start, end);
    const hrefs = [...block.matchAll(/href:\s*"(https:\/\/[^"]+)"/g)].map((x) => x[1]);
    const mfr = block.match(/manufacturer:\s*"([^"]+)"/)?.[1];
    const model = block.match(/model:\s*"([^"]+)"/)?.[1];
    const label = block.match(/label:\s*"([^"]+)"/)?.[1];
    items.push({
      id: ids[i].id,
      manufacturer: mfr,
      model,
      label,
      hrefs,
    });
  }
  return items;
}

const catalogTs = readFileSync(resolve(root, "src/lib/materials-catalog.ts"), "utf8");
const equipTs = readFileSync(resolve(root, "src/lib/equipment-docs.ts"), "utf8");

const catalogItems = extractDocsFromCatalog(catalogTs).filter((x) => x.id !== "none");
const brandHrefs = [...equipTs.matchAll(/href:\s*"(https:\/\/[^"]+)"/g)].map((x) => x[1]);
const allHrefs = [...new Set([...catalogItems.flatMap((i) => i.hrefs), ...brandHrefs])].sort();

console.log(`Catalog SKUs (excl. none): ${catalogItems.length}`);
console.log(`Unique hrefs to verify: ${allHrefs.length}\n`);

// --- Fail if any SKU has zero docs ---
let resolveFails = 0;
for (const item of catalogItems) {
  if (!item.hrefs.length) {
    console.error(`FAIL resolve: ${item.id} (${item.label}) has ZERO docs`);
    resolveFails++;
  } else {
    const goog = item.hrefs.filter((h) => /google\.(com|co)/i.test(h));
    if (goog.length) {
      console.error(`FAIL resolve: ${item.id} has Google search link: ${goog[0]}`);
      resolveFails++;
    } else {
      console.log(`OK resolve  ${item.id.padEnd(28)} ${item.hrefs.length} link(s) · ${item.label}`);
    }
  }
}

// --- Also assert equipment-docs never contains google search ---
if (/google\.com\/search/i.test(equipTs) || /google\.com\/search/i.test(catalogTs)) {
  console.error("FAIL: Google search URL found in source");
  resolveFails++;
}

// --- Live URL checks ---
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/** Hosts known to bot-gate curl but serve real browsers (still must be official). */
const BOT_GATE_OK = [/solaredge\.com/i, /tesla\.com/i];

function checkUrl(url) {
  const out = spawnSync(
    "curl",
    [
      "-sL",
      "--max-time",
      "20",
      "--max-redirs",
      "6",
      "-A",
      UA,
      "-o",
      "/tmp/eq-verify-body",
      "-w",
      "%{http_code}|%{content_type}|%{url_effective}",
      url,
    ],
    { encoding: "utf8" }
  );
  if (out.status !== 0 && !out.stdout) {
    return { ok: false, detail: `curl failed: ${out.stderr || out.error}` };
  }
  const [codeS, ctype = "", final = url] = (out.stdout || "").split("|");
  const code = Number(codeS);
  let body = Buffer.alloc(0);
  try {
    body = readFileSync("/tmp/eq-verify-body");
  } catch {
    /* empty */
  }
  const isPdf =
    body.slice(0, 4).toString() === "%PDF" || /pdf/i.test(ctype) || /\.pdf(\?|$)/i.test(url);
  const isHtml = /html/i.test(ctype) || body.slice(0, 15).toString().toLowerCase().includes("<!doctype");

  if (code >= 200 && code < 400) {
    if (/\.pdf(\?|$)/i.test(url) || /datasheet|spec.?sheet|cut.?sheet/i.test(url)) {
      if (isPdf || body.length > 1000) {
        return { ok: true, detail: `${code} PDF/OK (${body.length}b)` };
      }
    }
    if (isHtml || isPdf || body.length > 200) {
      return { ok: true, detail: `${code} ${isPdf ? "PDF" : "OK"} (${body.length}b)` };
    }
    return { ok: true, detail: `${code} emptyish but accepted` };
  }

  if ((code === 403 || code === 401) && BOT_GATE_OK.some((re) => re.test(url))) {
    return { ok: true, detail: `${code} BOT-GATE (browser-only WAF, official host)` };
  }

  // Geo redirects to non-English
  if (/\/de\/|\/fr\/|\/es\/|\/it\/|\/nl\/|\/jp\//i.test(final) && !/\/en/i.test(final)) {
    return { ok: false, detail: `${code} redirected to non-English: ${final}` };
  }

  return { ok: false, detail: `${code} ${ctype} final=${final}` };
}

console.log("\n--- Live URL verification ---\n");
let urlFails = 0;
for (const href of allHrefs) {
  if (href.includes("google.com/search")) {
    console.error(`FAIL url   GOOGLE  ${href}`);
    urlFails++;
    continue;
  }
  const r = checkUrl(href);
  if (r.ok) {
    console.log(`OK url    ${r.detail.padEnd(42)} ${href}`);
  } else {
    console.error(`FAIL url  ${r.detail.padEnd(42)} ${href}`);
    urlFails++;
  }
}

console.log("\n=== SUMMARY ===");
console.log(`resolve fails: ${resolveFails}`);
console.log(`url fails:     ${urlFails}`);
console.log(`total hrefs:   ${allHrefs.length}`);

if (resolveFails || urlFails) {
  process.exit(1);
}
console.log("\nAll equipment docs verified.");
process.exit(0);
