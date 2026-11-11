import { registerPlugin } from '@capacitor/core';
const NativePrint=registerPlugin('NativePrint');
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',minimumFractionDigits:2}).format(Number(n)||0);
const date=s=>{if(!s)return '—';const d=new Date(s+'T00:00:00');return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});};
function table(title,headers,rows){return '<h3>'+esc(title)+'</h3><table><thead><tr>'+headers.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'">No entries</td></tr>')+'</tbody></table>';}
function buildHtml(data,name,lang,paper){
 const a=data.appulu||{},j=data.jamalu||{},net=(Number(a.total)||0)-(Number(j.total)||0);
 const summary=[['Principal',money(a.principal),money(j.principal)],['Interest',money(a.interest),money(j.interest)],['Total with interest',money(a.total),money(j.total)]];
 const app=(a.rows||[]).map(r=>[date(r.date),String(r.days||0),money(r.opening),money(r.interest),money(r.added),money(r.closing),r.detail||'']);
 const jam=(j.rows||[]).map(r=>[date(r.date),String(r.days||0),money(r.opening),money(r.interest),money(r.added),money(r.closing),r.detail||'']);
 const tx=(data.transactions||[]).map(t=>[date(t.date),t.type==='credit'?'APPULU / CREDIT':'JAMALU / DEBIT',money(t.amount)]);
 const width=paper==='58mm'?'58mm':paper==='80mm'?'80mm':'auto',size=paper==='A4'?'A4':width;
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>@page{size:${size};margin:${paper==='A4'?'10mm':'3mm'}}body{font-family:Arial,sans-serif;color:#222;padding:0;margin:0;font-size:10px}h2{color:#51258f;font-size:18px;margin:0 0 5px}h3{font-size:13px;color:#51258f;margin:18px 0 6px}.muted{color:#666;font-size:10px;margin-bottom:12px}table{border-collapse:collapse;width:100%;margin-bottom:12px;table-layout:auto}th{background:#eee6f8;text-align:left}th,td{border:1px solid #ddd;padding:4px;overflow-wrap:anywhere}.net{font-weight:bold;padding:8px;background:#eee6f8;margin:10px 0}</style></head><body><h2>DAILY INTEREST STATEMENT</h2><div><b>${esc(name)}</b></div><div class="muted">As of ${esc(date(data.asOf))} · Interest ₹${esc(data.rate)} per ₹100 per month</div>${table('ACCOUNT SUMMARY',['Particulars','Appulu / Credit','Jamalu / Debit'],summary)}<div class="net">FINAL SETTLEMENT: ${esc(money(net))}</div>${table('APPULU / CREDIT DAY-WISE LEDGER',['Date','Days','Opening','Interest','Added','Closing','Details'],app)}${table('JAMALU / DEBIT DAY-WISE LEDGER',['Date','Days','Opening','Interest','Added','Closing','Details'],jam)}${table('TRANSACTION HISTORY',['Date','Type','Amount'],tx)}</body></html>`;
}
async function print(args){return NativePrint.print(args)}
async function printPdf(args){return NativePrint.printPdf(args)}
window.NativePrint={print,printPdf,buildHtml};
