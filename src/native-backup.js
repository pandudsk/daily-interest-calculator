import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor, registerPlugin } from '@capacitor/core';
const NativeBackupDownloads = registerPlugin('NativeBackupDownloads');
const AUTO_BACKUP = 'automatic-backup.json';

async function shareBackup(json, filename) {
 if (!Capacitor.isNativePlatform()) return false;
 const result = await Filesystem.writeFile({path:filename,data:json,directory:Directory.Cache,encoding:'utf8',recursive:true});
 await Share.share({title:'Daily Khata Book Backup',text:'Keep this backup file safe. It contains your customers and transactions.',url:result.uri,dialogTitle:'Share backup'});
 return true;
}

function counts(data) {
 const customers = Array.isArray(data?.customers) ? data.customers : [];
 return {customers:customers.length,transactions:customers.reduce((n,c)=>n+(Array.isArray(c.transactions)?c.transactions.length:0),0)};
}

async function readRaw(path=AUTO_BACKUP) {
 if (!Capacitor.isNativePlatform()) return null;
 try {
  const result=await Filesystem.readFile({path,directory:Directory.Data,encoding:'utf8'});
  return typeof result.data==='string'?result.data:null;
 } catch (_) { return null; }
}

async function saveSafetyCopy(json, filename = AUTO_BACKUP) {
 if (!Capacitor.isNativePlatform()) return false;
 const incoming=JSON.parse(json);
 const next=counts(incoming);
 // Never replace a known non-empty automatic backup with an empty state.
 if(filename===AUTO_BACKUP) {
  const previousRaw=await readRaw(AUTO_BACKUP);
  if(previousRaw) {
   try {
    const previous=JSON.parse(previousRaw), before=counts(previous);
    if(before.customers>0 && next.customers===0) {
     throw new Error('Automatic backup protected: refusing to overwrite non-empty backup with empty data.');
    }
   } catch(e) {
    if(String(e?.message||'').includes('protected')) throw e;
   }
  }
 }
 await Filesystem.writeFile({path:filename,data:json,directory:Directory.Data,encoding:'utf8',recursive:true});
 if(filename===AUTO_BACKUP) {
  const publicCopy = await NativeBackupDownloads.saveToDownloads({filename:'automatic-backup.json', content:json});
  window.__dailyKhataBackupDownloadUri = publicCopy?.uri || null;
  const verified=await readRaw(AUTO_BACKUP);
  if(!verified || verified!==json) throw new Error('Automatic backup verification failed after write.');
 }
 return true;
}

async function readSafetyCopy() { return readRaw(AUTO_BACKUP); }

async function getSafetyCopyInfo() {
 const raw=await readRaw(AUTO_BACKUP);
 if(!raw) return {available:false,verified:false,customers:0,transactions:0,exportedAt:null,downloadPath:'Downloads/Daily Khata Book/automatic-backup.json'};
 try {
  const data=JSON.parse(raw), c=counts(data);
  return {available:true,verified:Array.isArray(data.customers)&&!!data.settings,customers:c.customers,transactions:c.transactions,exportedAt:data.exportedAt||null,downloadPath:'Downloads/Daily Khata Book/automatic-backup.json'};
 } catch (_) { return {available:true,verified:false,customers:0,transactions:0,exportedAt:null}; }
}

window.NativeBackup={shareBackup,saveSafetyCopy,readSafetyCopy,getSafetyCopyInfo};
