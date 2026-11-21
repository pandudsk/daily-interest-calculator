import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeBackupDownloads = registerPlugin('NativeBackupDownloads');
window.NativeBackupDownloads = NativeBackupDownloads;
const AUTO_BACKUP = 'automatic-backup.json';
const PUBLIC_BACKUP_PATH = 'Download/Daily Khata Book/Backup/automatic-backup.json';

async function shareBackup(json, filename) {
 if (!Capacitor.isNativePlatform()) throw new Error('Backup sharing is available only in the Android app.');
 const result = await Filesystem.writeFile({path:filename,data:json,directory:Directory.Cache,encoding:'utf8',recursive:true});
 await Share.share({title:'Daily Khata Book Backup',text:'Keep this backup file safe. It contains your customers and transactions.',url:result.uri,dialogTitle:'Share backup'});
 return true;
}

function counts(data) {
 const customers = Array.isArray(data?.customers) ? data.customers : [];
 return {customers:customers.length,transactions:customers.reduce((n,c)=>n+(Array.isArray(c.transactions)?c.transactions.length:0),0)};
}

function validateBackup(raw) {
 let data;
 try { data = JSON.parse(raw); } catch (_) { throw new Error('Backup file is not valid JSON.'); }
 if (!data || typeof data !== 'object' || !Array.isArray(data.customers) || !data.settings || typeof data.settings !== 'object') {
  throw new Error('Backup structure is incomplete. The existing backup was not accepted.');
 }
 const c = counts(data);
 return {data, ...c};
}

async function readRaw(path=AUTO_BACKUP) {
 if (!Capacitor.isNativePlatform()) return null;
 try {
  const result=await Filesystem.readFile({path,directory:Directory.Data,encoding:'utf8'});
  return typeof result.data==='string'?result.data:null;
 } catch (_) { return null; }
}

async function readDownloadsRaw() {
 if (!Capacitor.isNativePlatform() || !NativeBackupDownloads?.readDownloadsBackup) return null;
 try {
  const result=await NativeBackupDownloads.readDownloadsBackup();
  return typeof result?.content==='string' && result.content.length ? result.content : null;
 } catch (_) { return null; }
}

async function saveSafetyCopy(json, filename = AUTO_BACKUP) {
 if (!Capacitor.isNativePlatform()) throw new Error('Local backup is available only in the Android app.');
 const incoming=validateBackup(json);
 if(NativeBackupDownloads?.ensureFolderStructure) await NativeBackupDownloads.ensureFolderStructure();
 if (filename===AUTO_BACKUP) {
  const previousRaw=await readRaw(AUTO_BACKUP) || await readDownloadsRaw();
  if (previousRaw) {
   try {
    const previous=validateBackup(previousRaw);
    if (previous.customers>0 && incoming.customers===0) {
     throw new Error('Backup protection: refusing to replace a backup containing customers with an empty backup.');
    }
   } catch(e) {
    if (String(e?.message||'').startsWith('Backup protection:')) throw e;
    // An unreadable old copy is retained in Downloads if the internal copy is the one being replaced.
   }
  }
 }
 await Filesystem.writeFile({path:filename,data:json,directory:Directory.Data,encoding:'utf8',recursive:true});
 const internalVerified=await readRaw(filename);
 if (internalVerified!==json) throw new Error('Local app-storage backup verification failed. The backup is not marked successful.');
 if (filename===AUTO_BACKUP) {
  const publicCopy=await NativeBackupDownloads.saveToDownloads({filename:'automatic-backup.json',content:json});
  window.__dailyKhataBackupDownloadUri=publicCopy?.uri||null;
  const downloadsVerified=await readDownloadsRaw();
  if (downloadsVerified!==json) throw new Error('Phone Downloads backup could not be verified. The app-storage copy was saved, but the two-copy backup is incomplete.');
 }
 return {success:true,customers:incoming.customers,transactions:incoming.transactions,verified:true};
}

async function readSafetyCopy() {
 const internal=await readRaw(AUTO_BACKUP);
 if (internal) {
  try { validateBackup(internal); return internal; } catch (_) { /* Try the independent Downloads copy. */ }
 }
 const downloads=await readDownloadsRaw();
 if (downloads) { validateBackup(downloads); return downloads; }
 return null;
}

async function getSafetyCopyInfo() {
 const internalRaw=await readRaw(AUTO_BACKUP);
 const downloadsRaw=await readDownloadsRaw();
 let internal=null, downloads=null;
 try { if(internalRaw) internal=validateBackup(internalRaw); } catch (_) {}
 try { if(downloadsRaw) downloads=validateBackup(downloadsRaw); } catch (_) {}
 const selected=downloads||internal;
 if(!selected) return {available:false,verified:false,internalVerified:false,downloadsVerified:false,customers:0,transactions:0,exportedAt:null,source:null,downloadPath:PUBLIC_BACKUP_PATH};
 return {
  available:true,
  verified:!!downloads,
  internalVerified:!!internal,
  downloadsVerified:!!downloads,
  customers:selected.customers,
  transactions:selected.transactions,
  exportedAt:selected.data.exportedAt||null,
  source:downloads?'Phone Downloads':'App storage only',
  downloadPath:PUBLIC_BACKUP_PATH
 };
}

window.NativeBackup={shareBackup,saveSafetyCopy,readSafetyCopy,getSafetyCopyInfo};
if(Capacitor.isNativePlatform() && NativeBackupDownloads?.ensureFolderStructure){
 NativeBackupDownloads.ensureFolderStructure().then(result=>console.info('Daily Khata Book folders ready:',result?.path)).catch(error=>console.warn('Could not prepare shared folders:',error));
}
