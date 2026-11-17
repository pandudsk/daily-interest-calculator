import { LocalNotifications } from '@capacitor/local-notifications';
const BASE=730000;
const idsFor=id=>{let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;const b=BASE+(h%1000000)*3;return [b,b+1,b+2]};
window.NativeReminders={
 async checkPermission(){return await LocalNotifications.checkPermissions();},
 async requestPermission(){return await LocalNotifications.requestPermissions();},
 async cancel(){
  const pending=await LocalNotifications.getPending();
  const old=pending.notifications.filter(x=>x.id>=BASE&&x.id<2147483000).map(x=>({id:x.id}));
  if(old.length)await LocalNotifications.cancel({notifications:old});
  return {cancelled:old.length};
 },
 async sync(docs){
  const permission=await LocalNotifications.checkPermissions();
  if(permission.display!=='granted')return {scheduled:0,permission:permission.display};
  const pending=await LocalNotifications.getPending();
  const old=pending.notifications.filter(n=>n.id>=BASE&&n.id<2147483000).map(n=>({id:n.id}));
  if(old.length)await LocalNotifications.cancel({notifications:old});
  const now=new Date(),items=[];
  for(const doc of docs){
   const [id30,id7,id0]=idsFor(doc.id);
   for(const [days,id,title] of [[30,id30,'Licence renewal due in 30 days'],[7,id7,'Licence renewal due in 7 days'],[0,id0,'Licence expires today']]){
    const at=new Date(doc.expiry+'T09:00:00');
    at.setDate(at.getDate()-days);
    if(at>now)items.push({id,title,body:doc.label+' · Expiry: '+doc.expiry, schedule:{at,allowWhileIdle:true}, extra:{documentId:doc.id}});
   }
  }
  if(items.length)await LocalNotifications.schedule({notifications:items});
  return {scheduled:items.length};
 },
 async listen(){return LocalNotifications.addListener('localNotificationActionPerformed',e=>{window.dispatchEvent(new CustomEvent('shop-document-reminder',{detail:e.notification?.extra||{}}));});}
};
