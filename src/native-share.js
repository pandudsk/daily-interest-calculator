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
function renderStatementPages(data) {
  const W=1240,H=1754,M=64, pages=[];
  const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2}).format(Number(n)||0);
  const date=s=>{if(!s)return '—';const d=new Date(s+'T00:00:00');return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})};
  const sections=[
    {title:'APPULU / CREDIT LEDGER',rows:(data.appulu?.rows||[]).map(r=>[date(r.date),String(r.days||0),money(r.opening),money(r.interest),money(r.added),money(r.closing),r.detail||''])},
    {title:'JAMALU / DEBIT LEDGER',rows:(data.jamalu?.rows||[]).map(r=>[date(r.date),String(r.days||0),money(r.opening),money(r.interest),money(r.added),money(r.closing),r.detail||''])},
    {title:'TRANSACTION HISTORY',rows:(data.transactions||[]).map(t=>[date(t.date),t.type==='credit'?'APPULU / CREDIT':'JAMALU / DEBIT',money(t.amount)])}
  ];
  let pageNo=0,ctx,canvas,y;
  function newPage(){
    canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#51258f';ctx.fillRect(0,0,W,18);
    pageNo++;
    if(pageNo===1){
      ctx.fillStyle='#241b2d';ctx.font='bold 34px Arial, sans-serif';ctx.fillText('DAILY INTEREST STATEMENT',M,82);
      ctx.fillStyle='#766b84';ctx.font='25px Arial, sans-serif';ctx.fillText(String(data.customerName||''),M,125);
      ctx.font='21px Arial, sans-serif';ctx.fillText('Statement date: '+date(data.asOf)+'   |   Interest: ₹'+data.rate+' per ₹100 / month',M,164);
      ctx.strokeStyle='#d9c9ed';ctx.beginPath();ctx.moveTo(M,190);ctx.lineTo(W-M,190);ctx.stroke();
      y=224;
    } else { y=82; }
  }
  function footer(){ctx.fillStyle='#766b84';ctx.font='18px Arial';ctx.fillText("Dintakurthi's Finsol  •  Page "+pageNo,W-M-250,H-30);pages.push(canvas.toDataURL('image/jpeg',0.9).split(',')[1]);}
  function ensure(h){if(y+h>H-75){footer();newPage()}}
  function heading(t){ensure(64);ctx.fillStyle='#51258f';ctx.font='bold 25px Arial';ctx.fillText(t,M,y);y+=38}
  function table(headers,rows,widths){
    const total=W-2*M, rowH=44, colW=widths.map(v=>total*v);
    ensure(48);ctx.fillStyle='#eee6f8';ctx.fillRect(M,y,total,42);ctx.fillStyle='#3b2450';ctx.font='bold 17px Arial';
    let x=M;headers.forEach((h,i)=>{ctx.fillText(h,x+8,y+27);x+=colW[i]});y+=42;
    rows.forEach((r,ri)=>{ensure(rowH);ctx.fillStyle=ri%2?'#fff':'#faf8fd';ctx.fillRect(M,y,total,rowH);ctx.strokeStyle='#e5deec';ctx.beginPath();ctx.moveTo(M,y+rowH);ctx.lineTo(W-M,y+rowH);ctx.stroke();ctx.fillStyle='#30283a';ctx.font='16px Arial';let xx=M;r.forEach((v,i)=>{let text=String(v??'');while(ctx.measureText(text).width>colW[i]-14&&text.length>4)text=text.slice(0,-2)+'…';ctx.fillText(text,xx+7,y+27);xx+=colW[i]});y+=rowH});
    y+=22;
  }
  newPage();
  heading('ACCOUNT SUMMARY');
  table(['Description','Appulu / Credit','Jamalu / Debit'],[['Principal',money(data.appulu?.principal),money(data.jamalu?.principal)],['Interest',money(data.appulu?.interest),money(data.jamalu?.interest)],['Total with interest',money(data.appulu?.total),money(data.jamalu?.total)]],[0.42,0.29,0.29]);
  heading('FINAL SETTLEMENT');
  table(['Particulars','Amount'],[['Appulu total with interest',money(data.appulu?.total)],['Less: Jamalu total with interest',money(data.jamalu?.total)],['Net settlement',money((data.appulu?.total||0)-(data.jamalu?.total||0))]],[0.68,0.32]);
  sections.forEach(sec=>{heading(sec.title);if(!sec.rows.length){ctx.fillStyle='#766b84';ctx.font='20px Arial';ctx.fillText('No entries',M,y);y+=48;return}
    if(sec.title==='TRANSACTION HISTORY')table(['Date','Transaction type','Amount'],sec.rows,[0.28,0.48,0.24]);
    else table(['Date','Days','Opening','Interest','Added','Closing','Details'],sec.rows,[0.15,0.08,0.15,0.14,0.13,0.15,0.20]);
  });
  footer();return pages;
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
async function shareStatement(data) {
  const customerName=data.customerName;
  const pages = renderStatementPages(data).map(base64ToBytes);
  const pdf = makePdfFromJpegs(pages, 1240, 1754);
  const safeName = String(customerName || 'customer').trim().replace(/[^\p{L}\p{N}-]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'customer';
  const shareDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const filename = `${safeName}_${shareDate}.pdf`;
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
