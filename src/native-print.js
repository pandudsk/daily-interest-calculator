import { registerPlugin } from '@capacitor/core';
const NativePrint=registerPlugin('NativePrint');
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function buildHtml(text,name,lang,paper){const width=paper==='58mm'?'58mm':paper==='80mm'?'80mm':'auto';const size=paper==='A4'?'A4':width;return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>@page{size:'+size+';margin:'+(paper==='A4'?'12mm':'3mm')+'}body{font-family:Arial,sans-serif;color:#222;padding:0;margin:0}h2{color:#51258f;font-size:18px}h3{font-size:14px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.55 Arial,sans-serif}hr{border:0;border-top:1px solid #ddd}</style></head><body><h2>Daily Interest Statement</h2><h3>'+esc(name)+'</h3><hr><pre>'+esc(text)+'</pre></body></html>'}
async function print(args){return NativePrint.print(args)}
window.NativePrint={print,buildHtml};