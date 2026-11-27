import { registerPlugin } from '@capacitor/core';
const NativeBackupDownloads=registerPlugin('NativeBackupDownloads');
const DB_NAME='daily-khata-files', STORE='files', DB_VERSION=1;
function safeFolderPart(value,fallback='Customer'){
 const cleaned=String(value||fallback).normalize('NFKC').replace(/[\\\\/:*?"<>|]/g,'_').replace(/[. ]+$/g,'').trim();
 return (cleaned||fallback).slice(0,70);
}
function timestampForRecord(record){
 const date=String(record.date||'').match(/^\d{4}-\d{2}-\d{2}$/)?record.date:new Date(record.createdAt||Date.now()).toISOString().slice(0,10);
 const stamp=new Date(Number(record.createdAt)||Date.now());
 const time=[stamp.getHours(),stamp.getMinutes(),stamp.getSeconds()].map(v=>String(v).padStart(2,'0')).join('-');
 return {date,time};
}
async function mirrorToDownloads(record){
 if(!record?.blob||!record?.id)return false;
 const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result));fr.onerror=reject;fr.readAsDataURL(record.blob)});
 const base64=dataUrl.split(',')[1]||'';
 const sourceFolder=String(record.folder||'');
 const isShopDocument=sourceFolder.startsWith('Shop Documents')||sourceFolder==='Document';
 const isDebit=String(record.type||'').toLowerCase()==='debit'||sourceFolder.includes('Debits');
 const side=isDebit?'Debits':'Credits';
 const customer=safeFolderPart(record.customerName,'Customer');
 const customerKey=safeFolderPart(String(record.customerId||'').slice(0,8),'legacy');
 const folder=isShopDocument?'Shop Documents':(record.customerId?side+'/'+customer+'__'+customerKey:side+'/'+customer);
 const {date,time}=timestampForRecord(record);
 const original=safeFolderPart(record.name||'attachment','attachment');
 const filename=`${date}_${time}_${String(record.id).slice(0,8)}_${original}`;
 await NativeBackupDownloads.saveFile({folder,filename,base64,mimeType:record.mimeType||record.blob.type||'application/octet-stream'});
 return true;
}
function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function put(record){const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({...record,blob:record.blob});tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)};});await mirrorToDownloads(record);return true;}
async function get(id){const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>{db.close();reject(r.error)}});}
async function all(){const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>{db.close();resolve(r.result||[])};r.onerror=()=>{db.close();reject(r.error)}});}
async function remove(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)};});}
async function exportAll(){const rows=await all(),out=[];for(const r of rows){const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result));fr.onerror=reject;fr.readAsDataURL(r.blob)});const {blob,...meta}=r;out.push({...meta,dataUrl});}return out;}
async function importAll(rows){for(const r of rows||[]){if(!r?.id||!r.dataUrl)continue;const blob=await (await fetch(r.dataUrl)).blob();const {dataUrl,...meta}=r;await put({...meta,blob});}}
async function mirrorExisting(){const rows=await all();let copied=0,failed=0;for(const row of rows){try{await mirrorToDownloads(row);copied++;}catch(e){failed++;console.warn('File mirror failed',row.id,e);}}return {copied,failed};}
window.KhataFileStore={put,get,all,remove,exportAll,importAll,mirrorExisting,mirrorToDownloads};
