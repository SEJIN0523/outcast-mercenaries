import {BATTLE_PRESETS,presetFor} from '../domain/battlePresets';
import equipmentArt from '../data/equipment-art.json';
import {SHIELDS} from '../data/weapons';
import {weaponOf} from '../domain/equipment';
import {appearanceSignature} from '../domain/appearance';
import type {Mercenary} from '../domain/types';
export const EQUIPMENT_ART=equipmentArt;
const images=new Map<string,HTMLImageElement>();
const composites=new Map<string,HTMLCanvasElement>();let pending:Promise<void>|undefined;
function load(id:string,file:string){return new Promise<void>((resolve,reject)=>{const im=new Image(),timer=setTimeout(()=>reject(Error(id)),6000);im.onload=()=>{clearTimeout(timer);images.set(id,im);resolve();};im.onerror=()=>{clearTimeout(timer);reject(Error(id));};im.src=import.meta.env.BASE_URL+file;});}
export function loadBattleArt(){return pending??=Promise.allSettled([...BATTLE_PRESETS.map(p=>load(p.id,p.file)),...equipmentArt.map(p=>load(p.equipmentId,p.imagePath))]).then(()=>{});}
/** Runtime composition only: source PNGs stay unarmed, equipment has an independent grip. */
export function composeBattleArt(m:Mercenary,showSockets=false){
 const preset=presetFor(m);if(!preset)return;
 const body=images.get(preset.id);if(!body)return;
 const key=appearanceSignature(m)+(showSockets?'sockets':'');if(composites.has(key))return {preset,image:composites.get(key)!};
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const c=canvas.getContext('2d')!;c.imageSmoothingEnabled=false;
 const race=m.race,beast=['catkin','foxkin','wolfkin'].includes(race);
 const poly=(points:number[][],color:string)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 if(beast){const color=race==='foxkin'?'#b56f36':race==='wolfkin'?'#737c89':'#66514c';poly([[105,218],[78,236],[46,247],[34,227],[40,203],[51,212],[50,229],[73,227],[91,208]],'#25272b');poly([[102,218],[76,232],[46,242],[39,225],[43,213],[47,232],[74,230],[94,213]],color);if(race==='foxkin')poly([[46,242],[39,225],[43,213],[47,232],[61,233]],'#e8dfc6');}
 const weapon=weaponOf(m),shield=m.equipment.shield?SHIELDS[m.equipment.shield]:undefined;
 const gearLayers=[{id:weapon.assetId,socket:preset.weaponSocket,scale:1,hand:true},...(shield&&!weapon.twoHanded?[{id:shield.assetId,socket:preset.shieldSocket,scale:shield.scale,hand:false}]:[])].sort((a,b)=>(equipmentArt.find(p=>p.equipmentId===a.id)?.layerOrder??20)-(equipmentArt.find(p=>p.equipmentId===b.id)?.layerOrder??20));
 for(const layer of gearLayers)if((equipmentArt.find(p=>p.equipmentId===layer.id)?.layerOrder??20)<10)gear(layer.id,layer.socket,layer.scale);
 c.drawImage(body,0,0);
 if(race==='dark-elf'){
  // Restrict the skin palette transform to face and exposed hand windows.
  const d=c.getImageData(0,0,256,320);for(let y=50;y<210;y++)for(let x=55;x<235;x++){if(!(y<106&&x>95&&x<176||Math.abs(x-preset.weaponSocket.x)<10&&Math.abs(y-preset.weaponSocket.y)<10||Math.abs(x-preset.shieldSocket.x)<12&&Math.abs(y-preset.shieldSocket.y)<12))continue;const i=(y*256+x)*4,r=d.data[i],g=d.data[i+1],b=d.data[i+2];if(d.data[i+3]>200&&r>g*1.1&&g>b*1.1&&r>140){d.data[i]=Math.round(r*.63);d.data[i+1]=Math.round(g*.64);d.data[i+2]=Math.min(255,Math.round(b*.9));}}c.putImageData(d,0,0);
 }
 if(race==='elf'||race==='half-elf'||race==='dark-elf'){
  const n=race==='half-elf'?7:13,color=race==='dark-elf'?'#9e809c':'#d5a67f';poly([[98,77],[82-n,67],[87,86],[99,90]],'#30272c');poly([[95,78],[87-n,72],[91,84],[97,86]],color);
 }
 if(beast){const color=race==='foxkin'?'#be783b':race==='wolfkin'?'#8993a0':'#5f5056';for(const x of [87,157]){poly([[x-9,46],[x-7,18],[x+14,39]],'#29252d');poly([[x-5,42],[x-4,24],[x+9,39]],color);poly([[x-1,38],[x-2,29],[x+5,38]],'#c48b91');}}
 function gear(assetId:string,socket:{x:number;y:number},extraScale=1){const spec=equipmentArt.find(p=>p.equipmentId===assetId),im=images.get(assetId);if(!spec)return;
  c.save();c.translate(socket.x+spec.offsetX,socket.y+spec.offsetY);c.rotate(spec.rotation*Math.PI/180);c.scale(spec.scale*extraScale,spec.scale*extraScale);
  if(im)c.drawImage(im,-spec.gripAnchor.x*spec.width,-spec.gripAnchor.y*spec.height);else{c.fillStyle='#c9c3a2';c.fillRect(-3,-180,6,205);}c.restore();
 }
 const hand=preset.weaponSocket,patch=document.createElement('canvas');patch.width=patch.height=10;patch.getContext('2d')!.drawImage(canvas,hand.x-6,hand.y-5,10,10,0,0,10,10);
 for(const layer of gearLayers)if((equipmentArt.find(p=>p.equipmentId===layer.id)?.layerOrder??20)>=10){gear(layer.id,layer.socket,layer.scale);if(layer.hand)c.drawImage(patch,hand.x-6,hand.y-5);}
 if(showSockets){for(const [p,color]of [[preset.weaponSocket,'#ff7777'],[preset.shieldSocket,'#79ddff'],[{x:128,y:306},'#c6f59a']] as const){c.strokeStyle=color;c.lineWidth=2;c.strokeRect(p.x-4,p.y-4,8,8);}}
 composites.set(key,canvas);if(composites.size>180)composites.delete(composites.keys().next().value!);return {preset,image:canvas};
}
export const battleImage=composeBattleArt;
