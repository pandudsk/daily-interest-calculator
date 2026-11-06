import { Share } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

function bytesFromString(s) { return new TextEncoder().encode(s); }
function joinBytes(parts) {
  const length = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(length); let offset = 0;
  for (const part of parts) { out.set(part, offset); offset += part.length; }
  return out;
}
function makePdfFromJpegs(jpegs, width, height) {
  const pageW = 595, pageH = 842, objects = [];
  objects[1] = bytesFromString('<< /Type /Catalog /Pages 2 0 R >>');
  const kids = jpegs.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
  objects[2] = bytesFromString(`<< /Type /Pages /Kids [${kids}] /Count ${jpegs.length} >>`);
  jpegs.forEach((jpeg, i) => {
    const pageId = 3 + i * 3, contentId = pageId + 1, imageId = pageId + 2;
    objects[pageId] = bytesFromString(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = bytesFromString('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ');
    objects[contentId] = joinBytes([bytesFromString(`<< /Length ${stream.length} >>\nstream\n`), stream, bytesFromString('\nendstream')]);
    objects[imageId] = joinBytes([bytesFromString(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`), jpeg, bytesFromString('\nendstream')]);
  });
  const parts = [bytesFromString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')], offsets = [0]; let pos = parts[0].length;
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pos;
    const chunk = joinBytes([bytesFromString(`${id} 0 obj\n`), objects[id], bytesFromString('\nendobj\n')]);
    parts.push(chunk); pos += chunk.length;
  }
  const xrefPos = pos;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  parts.push(bytesFromString(xref));
  return joinBytes(parts);
}
function renderStatementPages(customerName, statementText) {
  const width = 1240, height = 1754, margin = 90, lineHeight = 42;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = '28px "Noto Sans Telugu", Arial, sans-serif';
  const maxWidth = width - margin * 2, lines = [];
  for (const raw of statementText.split(/\r?\n/)) {
    if (!raw) { lines.push(''); continue; }
    let line = '';
    for (const word of raw.split(/\s+/)) {
      const candidate = line ? line + ' ' + word : word;
      if (line && probe.measureText(candidate).width > maxWidth) { lines.push(line); line = word; }
      else line = candidate;
    }
    lines.push(line);
  }
  const perPage = Math.floor((height - margin * 2 - 115) / lineHeight);
  const pages = [];
  for (let p = 0; p < lines.length; p += perPage) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#51258f'; ctx.font = 'bold 34px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText('DAILY INTEREST STATEMENT', margin, 95);
    ctx.fillStyle = '#766b84'; ctx.font = '24px "Noto Sans Telugu", Arial, sans-serif';
    ctx.fillText(customerName, margin, 140);
    ctx.strokeStyle = '#d9c9ed'; ctx.beginPath(); ctx.moveTo(margin, 170); ctx.lineTo(width - margin, 170); ctx.stroke();
    ctx.fillStyle = '#241b2d'; ctx.font = '28px "Noto Sans Telugu", Arial, sans-serif';
    const pageLines = lines.slice(p, p + perPage);
    pageLines.forEach((line, idx) => ctx.fillText(line, margin, 225 + idx * lineHeight));
    ctx.fillStyle = '#766b84'; ctx.font = '20px Arial, sans-serif';
    ctx.fillText(`Page ${pages.length + 1}`, width - margin - 100, height - 45);
    pages.push(canvas.toDataURL('image/jpeg', 0.88).split(',')[1]);
  }
  return pages;
}
function base64ToBytes(base64) {
  const binary = atob(base64), out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
async function shareStatement(customerName, statementText) {
  const pages = renderStatementPages(customerName, statementText).map(base64ToBytes);
  const pdf = makePdfFromJpegs(pages, 1240, 1754);
  const safeName = String(customerName || 'customer').replace(/[^\w-]+/g, '_').slice(0, 40) || 'customer';
  const filename = `Statement_${safeName}_${Date.now()}.pdf`;
  if (Capacitor.isNativePlatform()) {
    const saved = await Filesystem.writeFile({ path: filename, data: bytesToBase64(pdf), directory: Directory.Cache, recursive: true });
    await Share.share({ title: `Daily Interest Statement - ${customerName}`, text: 'Customer ledger statement PDF', url: saved.uri, dialogTitle: 'Share PDF Statement' });
    return true;
  }
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] }) && navigator.share) await navigator.share({ files: [file], title: `Daily Interest Statement - ${customerName}` });
  else { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
  return true;
}
window.NativeShare = { shareStatement };
