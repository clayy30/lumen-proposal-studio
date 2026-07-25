"use client";

import { jsPDF } from "jspdf";
import { toJpeg } from "html-to-image";
import html2canvas from "html2canvas";

const PAGE_BG = "#faf9f6";

/**
 * Reliable multi-page proposal PDF export.
 * Strategy:
 *  1) Clone proposal off-screen
 *  2) Inline remote images as data URLs (avoids CORS taint)
 *  3) Capture each [data-pdf-page] with html-to-image, fallback html2canvas
 *  4) Assemble US Letter PDF via jsPDF and download
 */
export async function exportProposalPdf(
  root: HTMLElement,
  filename: string
): Promise<void> {
  const pages = Array.from(
    root.querySelectorAll<HTMLElement>("[data-pdf-page]")
  );
  if (!pages.length) {
    throw new Error("No proposal pages found to export.");
  }

  // Wait for layout + webfonts
  await document.fonts?.ready?.catch?.(() => undefined);
  await wait(80);

  const host = document.createElement("div");
  host.setAttribute("data-pdf-export-host", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    "width:900px",
    "background:" + PAGE_BG,
    "z-index:-1",
    "pointer-events:none",
    "opacity:1",
  ].join(";");
  document.body.appendChild(host);

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
    compress: true,
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  try {
    for (let i = 0; i < pages.length; i++) {
      const source = pages[i];
      // Fresh clone per page so we can mutate safely
      const clone = source.cloneNode(true) as HTMLElement;
      clone.style.cssText = [
        "width:900px",
        "max-width:900px",
        "min-height:auto",
        "background:" + PAGE_BG,
        "box-shadow:none",
        "margin:0",
        "position:relative",
        "overflow:visible",
        "color:#141512",
      ].join(";");
      // Neutralize animations / sticky bits inside clone
      clone.querySelectorAll("*").forEach((node) => {
        const el = node as HTMLElement;
        if (el.style) {
          el.style.animation = "none";
          el.style.transition = "none";
        }
      });

      host.innerHTML = "";
      host.appendChild(clone);

      await inlineImages(clone);
      await wait(40);

      const dataUrl = await captureElement(clone);
      if (!dataUrl) {
        throw new Error(`Failed to capture page ${i + 1} of ${pages.length}.`);
      }

      // Measure image natural size
      const dims = await imageSize(dataUrl);
      const imgWidth = pageWidth;
      const imgHeight = (dims.h * imgWidth) / dims.w;

      if (i > 0) pdf.addPage();

      if (imgHeight <= pageHeight) {
        pdf.addImage(dataUrl, "JPEG", 0, 0, imgWidth, imgHeight, undefined, "FAST");
      } else {
        // Multi-slice tall page onto sequential letter pages
        const sliceHeightPx = (pageHeight / imgWidth) * dims.w;
        let offsetY = 0;
        let slice = 0;
        while (offsetY < dims.h - 1) {
          if (slice > 0) pdf.addPage();
          const canvas = document.createElement("canvas");
          const h = Math.min(sliceHeightPx, dims.h - offsetY);
          canvas.width = dims.w;
          canvas.height = Math.max(1, Math.floor(h));
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas unavailable");
          ctx.fillStyle = PAGE_BG;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const img = await loadImage(dataUrl);
          ctx.drawImage(
            img,
            0,
            offsetY,
            dims.w,
            h,
            0,
            0,
            dims.w,
            h
          );
          const sliceUrl = canvas.toDataURL("image/jpeg", 0.92);
          const sliceHmm = (h * imgWidth) / dims.w;
          pdf.addImage(sliceUrl, "JPEG", 0, 0, imgWidth, sliceHmm, undefined, "FAST");
          offsetY += h;
          slice++;
        }
      }
    }

    const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(name);
  } finally {
    host.remove();
  }
}

async function captureElement(el: HTMLElement): Promise<string | null> {
  // Primary: html-to-image (better modern CSS / SVG support)
  try {
    const url = await toJpeg(el, {
      quality: 0.92,
      pixelRatio: 2,
      backgroundColor: PAGE_BG,
      cacheBust: true,
      includeQueryParams: true,
      preferredFontFormat: "woff2",
      filter: (node) => {
        if (!(node instanceof HTMLElement)) return true;
        if (node.classList?.contains("no-print")) return false;
        if (node.getAttribute("data-pdf-export-host") != null && node !== el)
          return true;
        return true;
      },
      style: {
        transform: "none",
        margin: "0",
      },
    });
    if (url && url.startsWith("data:image")) return url;
  } catch (e) {
    console.warn("[pdf] html-to-image failed, trying html2canvas", e);
  }

  // Fallback: html2canvas
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: PAGE_BG,
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      onclone: (_doc, cloned) => {
        cloned.style.background = PAGE_BG;
        cloned.style.color = "#141512";
        // Strip filters/backdrop that break capture
        cloned.querySelectorAll("*").forEach((n) => {
          const h = n as HTMLElement;
          if (!h.style) return;
          h.style.backdropFilter = "none";
          h.style.filter = "none";
          h.style.animation = "none";
        });
      },
    });
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (e) {
    console.error("[pdf] html2canvas failed", e);
    return null;
  }
}

/** Fetch remote images and rewrite to data URLs so canvas is never tainted */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:")) return;
      try {
        const dataUrl = await fetchAsDataUrl(src);
        img.src = dataUrl;
        img.removeAttribute("srcset");
        img.crossOrigin = "anonymous";
        await waitForImage(img);
      } catch {
        // Replace broken remote image with neutral block so export still works
        const ph = document.createElement("div");
        ph.style.cssText = `width:100%;height:${img.clientHeight || 160}px;background:#e8e4dc;display:flex;align-items:center;justify-content:center;color:#888;font:12px system-ui;`;
        ph.textContent = "";
        img.replaceWith(ph);
      }
    })
  );
}

async function fetchAsDataUrl(url: string): Promise<string> {
  // Same-origin or CORS-enabled
  const res = await fetch(url, { mode: "cors", credentials: "omit", cache: "force-cache" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    setTimeout(done, 8000);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

function imageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return loadImage(dataUrl).then((img) => ({
    w: img.naturalWidth || img.width,
    h: img.naturalHeight || img.height,
  }));
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
