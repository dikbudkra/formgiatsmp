/**
 * =========================================================================
 * CERT ENGINE - Generator E-Sertifikat (Canvas + jsPDF) Bidang SMP Karanganyar
 * Dipakai bersama oleh Portal Marshal (editor & unduh panitia) dan Web Publik (unduh mandiri).
 * Ukuran font disimpan dalam satuan "px @96dpi" relatif lebar kertas A4,
 * sehingga hasil di editor dan di PDF 300 DPI selalu proporsional & identik.
 * =========================================================================
 */
(function (global) {
  const MM_PX = 3.7795275591; // 1 mm = 3.78 px @96dpi
  const ELEMENTS = ["nomor", "nama", "unit"];

  function pageMm(orient) {
    return orient === "PORTRAIT" ? { w: 210, h: 297 } : { w: 297, h: 210 };
  }

  function defaultLayout() {
    return {
      nomor: { xPct: 50, yPct: 33, fontSize: 18, fontFamily: "Times New Roman", fontWeight: "bold", color: "#000000" },
      nama: { xPct: 50, yPct: 48, fontSize: 40, fontFamily: "Times New Roman", fontWeight: "bold", color: "#000000" },
      unit: { xPct: 50, yPct: 59, fontSize: 22, fontFamily: "Arial", fontWeight: "bold", color: "#000000" }
    };
  }

  function mergeLayout(l) {
    const def = defaultLayout();
    let src = l;
    if (typeof src === "string") {
      try { src = JSON.parse(src); } catch (e) { src = null; }
    }
    src = src || {};
    const out = {};
    ELEMENTS.forEach(k => {
      out[k] = Object.assign({}, def[k], src[k] || {});
      out[k].xPct = Number(out[k].xPct);
      out[k].yPct = Number(out[k].yPct);
      out[k].fontSize = Number(out[k].fontSize);
    });
    return out;
  }

  function loadImage(src) {
    return new Promise(resolve => {
      if (!src) return resolve(null);
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => resolve(null);
      im.src = src;
    });
  }

  async function ensureFonts(layout) {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all(ELEMENTS.map(k => {
        const el = layout[k];
        return document.fonts.load(`${el.fontWeight === "bold" ? "bold" : "normal"} 40px "${el.fontFamily}"`);
      }));
    } catch (e) {}
  }

  function fontStr(el, scale) {
    const size = Math.max(1, el.fontSize * scale);
    return `${el.fontWeight === "bold" ? "bold" : "normal"} ${size}px "${el.fontFamily}", serif`;
  }

  function scaleFor(W, orient) {
    return W / (pageMm(orient).w * MM_PX);
  }

  /** Gambar 1 halaman sertifikat (blanko + 3 teks dinamis) ke canvas context */
  function drawPage(ctx, W, H, orient, img, layout, texts) {
    const scale = scaleFor(W, orient);
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    if (img) ctx.drawImage(img, 0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ELEMENTS.forEach(k => {
      const el = layout[k];
      const t = texts && texts[k];
      if (!el || !t) return;
      ctx.font = fontStr(el, scale);
      ctx.fillStyle = el.color || "#000000";
      ctx.fillText(String(t), (el.xPct / 100) * W, (el.yPct / 100) * H);
    });
    ctx.restore();
  }

  /** Bangun dokumen PDF A4 (1 atau 2 halaman) */
  function buildPdf(opts) {
    const { jsPDF } = global.jspdf;
    const orient = opts.orient === "PORTRAIT" ? "PORTRAIT" : "LANDSCAPE";
    const pm = pageMm(orient);
    const dpi = opts.dpi || 300;
    const W = Math.round((pm.w / 25.4) * dpi);
    const H = Math.round((pm.h / 25.4) * dpi);
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const jsOrient = orient === "PORTRAIT" ? "portrait" : "landscape";

    drawPage(ctx, W, H, orient, opts.front, opts.layout, opts.texts);
    const doc = new jsPDF({ orientation: jsOrient, unit: "mm", format: "a4", compress: true });
    doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pm.w, pm.h);

    if (opts.back) {
      doc.addPage("a4", jsOrient);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(opts.back, 0, 0, W, H);
      doc.addImage(c.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pm.w, pm.h);
    }
    c.width = 1; c.height = 1; // bebaskan memori
    return doc;
  }

  function safeName(s) {
    return String(s || "Peserta").replace(/[^\w\s.-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Peserta";
  }

  global.CertEngine = { MM_PX, ELEMENTS, pageMm, defaultLayout, mergeLayout, loadImage, ensureFonts, fontStr, scaleFor, drawPage, buildPdf, safeName };
})(window);
