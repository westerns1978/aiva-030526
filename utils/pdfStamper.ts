/**
 * pdfStamper.ts  —  src/utils/pdfStamper.ts
 *
 * Browser-side PDF signing using pdf-lib.
 * No edge function, no server round-trip — runs entirely in the browser.
 *
 * Two entry points:
 *   stampEmployeeSignature()  — called after step 7 completes
 *   stampCountersignature()   — called after Deon countersigns in ManagerHub
 *
 * What gets stamped:
 *   • Employee drawn signature on Page 19 (employee sig line)
 *   • Employee initials (small) on EVERY page footer (3 boxes, right side)
 *   • Deon countersign (styled text) on Page 18 sig line + Page 21 Deon line
 *   • ECTA audit block stamped on Page 19 (below sig) after countersign
 *
 * Install: npm install pdf-lib
 */

import { PDFDocument, rgb, StandardFonts, PDFPage, PDFImage } from 'pdf-lib';

// ── Supabase config (matches what OnboardingJourney already uses) ───────────
const SUPABASE_URL = 'https://ldzzlndsspkyohvzfiiu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkenpsbmRzc3BreW9odnpmaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3MTEzMDUsImV4cCI6MjA3NzI4NzMwNX0.SK2Y7XMzeGQoVMq9KAmEN1vwy7RjtbIXZf6TyNneFnI';
const STORAGE_BUCKET = 'project-aiva-afridroids';

// ── Page geometry (A4 = 595.4 x 841.8 pt, pdf-lib origin = bottom-left) ─────
const PAGE_H = 841.8;
const PAGE_W = 595.4;

// Exact positions measured from the actual contract PDF
const COORDS = {
  // ── Footer initials — 3 boxes, right-aligned, on EVERY page ──────────────
  // The "______ ______ ______" sits at ~52pt from bottom, right side of page
  initials: [
    { x: 338, y: 46 },  // box 1
    { x: 378, y: 46 },  // box 2
    { x: 418, y: 46 },  // box 3
  ],
  initialsSize: { w: 32, h: 18 },  // small — fits in the footer box

  // ── Page 19 (index 18): Employee signature line ───────────────────────────
  // "______________________________" above "Name" label
  employeeSig: {
    page: 18,           // 0-indexed
    x: 57,
    y: 505,
    w: 200,
    h: 55,
  },

  // ── Page 18 (index 17): Deon countersignature ────────────────────────────
  // Long line above "FOR PAARL AND WEST COAST..."
  deonSig: {
    page: 17,
    x: 57,
    y: 470,
    w: 200,
    h: 50,
  },

  // ── Page 21 / Annexure B (index 20): Name + Deon Boshoff lines ───────────
  // Two sig lines at same y — "Name" left, "Deon Boshoff" right
  annexureEmployee: {
    page: 20,
    x: 57,
    y: 548,
    w: 170,
    h: 40,
  },
  annexureDeon: {
    page: 20,
    x: 310,
    y: 548,
    w: 160,
    h: 40,
  },
};

// ── Colours ──────────────────────────────────────────────────────────────────
const TEAL = rgb(0.051, 0.580, 0.533);
const DARK = rgb(0.059, 0.090, 0.165);
const GREY = rgb(0.392, 0.455, 0.545);
const WHITE = rgb(1, 1, 1);
const LIGHT = rgb(0.973, 0.980, 0.992);

// ── Helpers ──────────────────────────────────────────────────────────────────

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatDateSAST(iso: string): string {
  return new Date(iso).toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  }) + ' SAST';
}

async function embedImage(pdfDoc: PDFDocument, dataUrl: string): Promise<PDFImage> {
  const bytes = dataUrlToBytes(dataUrl);
  try {
    return await pdfDoc.embedPng(bytes);
  } catch {
    return await pdfDoc.embedJpg(bytes);
  }
}

async function uploadToSupabase(
  bytes: Uint8Array,
  path: string,
): Promise<string> {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true',
      },
      body: blob,
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Storage upload failed: ${err}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

// ── Stamp initials on every page footer ──────────────────────────────────────

async function stampInitialsAllPages(
  pdfDoc: PDFDocument,
  initialsImage: PDFImage,
): Promise<void> {
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    const { w, h } = COORDS.initialsSize;
    // Stamp into all 3 initials boxes
    for (const box of COORDS.initials) {
      page.drawImage(initialsImage, {
        x: box.x,
        y: box.y,
        width: w,
        height: h,
        opacity: 0.92,
      });
    }
  }
}

// ── Employee signature stamp ──────────────────────────────────────────────────

async function stampEmployeeSigPage(
  pdfDoc: PDFDocument,
  sigImage: PDFImage,
  signerName: string,
  signedAt: string,
  method: string,
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // ── Page 19: main employee sig ───────────────────────────────────────────
  const c = COORDS.employeeSig;
  const page19 = pdfDoc.getPage(c.page);

  page19.drawImage(sigImage, {
    x: c.x, y: c.y, width: c.w, height: c.h, opacity: 0.95,
  });

  // Underline
  page19.drawLine({
    start: { x: c.x, y: c.y - 1 },
    end: { x: c.x + c.w, y: c.y - 1 },
    thickness: 0.4, color: GREY,
  });

  // Labels below sig
  page19.drawText(signerName, {
    x: c.x, y: c.y - 11, size: 7.5, font: fontBold, color: DARK,
  });
  page19.drawText(`Signed: ${formatDateSAST(signedAt)}`, {
    x: c.x, y: c.y - 20, size: 6.5, font, color: GREY,
  });
  page19.drawText(`Via AIVA · Method: ${method}`, {
    x: c.x, y: c.y - 29, size: 6, font, color: GREY,
  });

  // ── Page 21 Annexure B: employee sig (left column) ───────────────────────
  const a = COORDS.annexureEmployee;
  const page21 = pdfDoc.getPage(a.page);

  page21.drawImage(sigImage, {
    x: a.x, y: a.y, width: a.w, height: a.h, opacity: 0.95,
  });
  page21.drawLine({
    start: { x: a.x, y: a.y - 1 },
    end: { x: a.x + a.w, y: a.y - 1 },
    thickness: 0.4, color: GREY,
  });
  page21.drawText(signerName, {
    x: a.x, y: a.y - 10, size: 7, font: fontBold, color: DARK,
  });
  page21.drawText(formatDateSAST(signedAt), {
    x: a.x, y: a.y - 19, size: 6, font, color: GREY,
  });
}

// ── Deon countersignature stamp ───────────────────────────────────────────────

async function stampDeonSigPages(
  pdfDoc: PDFDocument,
  countersignerName: string,
  countersignedAt: string,
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

  const drawDeon = (page: PDFPage, x: number, y: number, w: number, h: number) => {
    // Subtle background
    page.drawRectangle({
      x: x - 2, y: y - 2, width: w + 4, height: h + 4,
      color: LIGHT, borderColor: TEAL, borderWidth: 0.4, opacity: 0.5,
    });
    // Styled name as signature
    page.drawText(countersignerName, {
      x: x + 2, y: y + h - 16, size: 14,
      font: fontItalic, color: DARK, opacity: 0.88,
    });
    // Underline
    page.drawLine({
      start: { x, y: y + h - 20 },
      end: { x: x + w, y: y + h - 20 },
      thickness: 0.4, color: GREY,
    });
    // Labels
    page.drawText('Managing Director', {
      x: x + 2, y: y + h - 30, size: 6.5, font: fontBold, color: DARK,
    });
    page.drawText(`Countersigned: ${formatDateSAST(countersignedAt)}`, {
      x: x + 2, y: y + h - 39, size: 6, font, color: GREY,
    });
  };

  // Page 18 — main company sig block
  const d = COORDS.deonSig;
  drawDeon(pdfDoc.getPage(d.page), d.x, d.y, d.w, d.h);

  // Page 21 Annexure B — right column "Deon Boshoff"
  const a = COORDS.annexureDeon;
  drawDeon(pdfDoc.getPage(a.page), a.x, a.y, a.w, a.h);
}

// ── ECTA audit block — stamped onto Page 19 below the employee sig ────────────

async function stampAuditBlock(
  pdfDoc: PDFDocument,
  data: {
    hireId: string;
    employeeName: string;
    signedAt: string;
    method: string;
    countersignerName?: string;
    countersignedAt?: string;
    documentHash: string;
  }
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.getPage(COORDS.employeeSig.page); // page 19
  const x = COORDS.employeeSig.x;
  // Place audit block below the sig labels — roughly y=460
  const blockY = 430;
  const blockW = PAGE_W - x - 57; // symmetric margins

  // Background box
  page.drawRectangle({
    x: x - 4, y: blockY - 4,
    width: blockW + 8, height: 80,
    color: LIGHT, borderColor: TEAL, borderWidth: 0.5, opacity: 0.7,
  });

  // Header strip
  page.drawRectangle({
    x: x - 4, y: blockY + 72, width: blockW + 8, height: 12,
    color: TEAL,
  });
  page.drawText('ECTA 2002 ELECTRONIC SIGNATURE CERTIFICATE', {
    x, y: blockY + 75, size: 6.5, font: fontBold, color: WHITE,
  });

  // Rows
  const rows: [string, string][] = [
    ['Ref:', data.hireId.slice(0, 8).toUpperCase()],
    ['Employee:', data.employeeName],
    ['Signed:', formatDateSAST(data.signedAt)],
    ['Method:', data.method],
  ];
  if (data.countersignerName) {
    rows.push(['Countersigned by:', data.countersignerName]);
    rows.push(['Countersigned:', formatDateSAST(data.countersignedAt!)]);
  }
  rows.push(['SHA-256:', data.documentHash.slice(0, 40) + '...']);
  rows.push(['Platform:', 'AIVA — Nashua Workforce Central (Gemynd WestFlow)']);

  let ry = blockY + 65;
  rows.forEach(([label, value]) => {
    page.drawText(label, { x, y: ry, size: 6, font: fontBold, color: GREY });
    page.drawText(value, { x: x + 75, y: ry, size: 6, font, color: DARK });
    ry -= 9;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

export interface StampResult {
  success: boolean;
  pdfUrl: string;
  storagePath: string;
  documentHash: string;
  error?: string;
}

export interface EmployeeStampParams {
  hireId: string;
  sourcePdfUrl: string;        // GCS template URL
  signatureDataUrl: string;    // base64 PNG from canvas
  initialsDataUrl: string;     // base64 PNG — initials
  signerName: string;
  signedAt: string;            // ISO timestamp
  signatureMethod: string;     // 'drawn' | 'typed' | 'styled'
}

export interface CountersignStampParams {
  hireId: string;
  sourcePdfUrl: string;        // URL of employee-signed PDF
  countersignerName: string;
  countersignedAt: string;
  employeeName: string;
  signedAt: string;
  signatureMethod: string;
}

/**
 * Called after employee completes step 7 (contract signing).
 * Fetches template, stamps sig + initials on all pages, uploads to Supabase.
 */
export async function stampEmployeeSignature(
  params: EmployeeStampParams
): Promise<StampResult> {
  try {
    // 1. Fetch source PDF
    const pdfResp = await fetch(params.sourcePdfUrl);
    if (!pdfResp.ok) throw new Error(`Failed to fetch PDF: ${pdfResp.status}`);
    const pdfBytes = new Uint8Array(await pdfResp.arrayBuffer());

    // 2. Load into pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // 3. Embed images
    const sigImage = await embedImage(pdfDoc, params.signatureDataUrl);
    const initialsImage = await embedImage(pdfDoc, params.initialsDataUrl);

    // 4. Stamp initials on ALL 21 pages
    await stampInitialsAllPages(pdfDoc, initialsImage);

    // 5. Stamp signature on pages 19 and 21
    await stampEmployeeSigPage(
      pdfDoc, sigImage,
      params.signerName, params.signedAt, params.signatureMethod
    );

    // 6. Serialise + hash
    const finalBytes = await pdfDoc.save();
    const hash = await sha256Hex(finalBytes);

    // 7. Stamp audit block (requires hash, so second pass)
    const pdfDoc2 = await PDFDocument.load(finalBytes, { ignoreEncryption: true });
    await stampAuditBlock(pdfDoc2, {
      hireId: params.hireId,
      employeeName: params.signerName,
      signedAt: params.signedAt,
      method: params.signatureMethod,
      documentHash: hash,
    });
    const finalBytes2 = await pdfDoc2.save();
    const finalHash = await sha256Hex(finalBytes2);

    // 8. Upload
    const ts = Date.now();
    const path = `contracts/${params.hireId}/contract_signed_${ts}.pdf`;
    const url = await uploadToSupabase(finalBytes2, path);

    return { success: true, pdfUrl: url, storagePath: path, documentHash: finalHash };

  } catch (err: any) {
    console.error('[pdfStamper] stampEmployeeSignature failed:', err);
    return { success: false, pdfUrl: '', storagePath: '', documentHash: '', error: String(err) };
  }
}

/**
 * Called after Deon countersigns in ManagerHub.
 * Fetches employee-signed PDF, adds Deon's stamps + updated audit block.
 */
export async function stampCountersignature(
  params: CountersignStampParams
): Promise<StampResult> {
  try {
    // 1. Fetch employee-signed PDF
    const pdfResp = await fetch(params.sourcePdfUrl);
    if (!pdfResp.ok) throw new Error(`Failed to fetch signed PDF: ${pdfResp.status}`);
    const pdfBytes = new Uint8Array(await pdfResp.arrayBuffer());

    // 2. Load
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // 3. Stamp Deon on pages 18 + 21
    await stampDeonSigPages(pdfDoc, params.countersignerName, params.countersignedAt);

    // 4. First serialise to get hash for the audit block
    const interim = await pdfDoc.save();
    const interimHash = await sha256Hex(interim);

    // 5. Update audit block with countersign info (second pass)
    const pdfDoc2 = await PDFDocument.load(interim, { ignoreEncryption: true });
    await stampAuditBlock(pdfDoc2, {
      hireId: params.hireId,
      employeeName: params.employeeName,
      signedAt: params.signedAt,
      method: params.signatureMethod,
      countersignerName: params.countersignerName,
      countersignedAt: params.countersignedAt,
      documentHash: interimHash,
    });
    const finalBytes = await pdfDoc2.save();
    const finalHash = await sha256Hex(finalBytes);

    // 6. Upload
    const ts = Date.now();
    const path = `contracts/${params.hireId}/contract_countersigned_${ts}.pdf`;
    const url = await uploadToSupabase(finalBytes, path);

    return { success: true, pdfUrl: url, storagePath: path, documentHash: finalHash };

  } catch (err: any) {
    console.error('[pdfStamper] stampCountersignature failed:', err);
    return { success: false, pdfUrl: '', storagePath: '', documentHash: '', error: String(err) };
  }
}
