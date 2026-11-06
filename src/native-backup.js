import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

async function shareBackup(json, filename) {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: 'utf8',
    recursive: true
  });
  await Share.share({
    title: 'Daily Interest Calculator Backup',
    text: 'Keep this backup file safe. It contains your customers and transactions.',
    url: result.uri,
    dialogTitle: 'Share backup'
  });
  return true;
}
async function saveSafetyCopy(json, filename) {
  if (!Capacitor.isNativePlatform()) return false;
  await Filesystem.writeFile({
    path: filename,
    data: json,
    directory: Directory.Cache,
    encoding: 'utf8',
    recursive: true
  });
  return true;
}
window.NativeBackup = { shareBackup, saveSafetyCopy };
