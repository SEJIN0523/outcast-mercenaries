import Phaser from 'phaser';
import {store} from '../state/store';
import {FIELD} from '../data/combat';
import {battleImage} from './battleArt';
import {drawMercenary} from './sprite';
import {drawGoblin} from './goblin';
import {drawBattlefield} from './battlefield';
import {rowOf} from '../domain/combat/formation';
import {appearanceSignature} from '../domain/appearance';
import type {CombatBattle,CombatUnit,CombatEvent} from '../domain/combat/types';
type Actor={root:Phaser.GameObjects.Container;image:Phaser.GameObjects.Image;bar:Phaser.GameObjects.Graphics;label:Phaser.GameObjects.Text;height:number;anchorX:number;anchorY:number;dead:boolean};
export class BattleScene extends Phaser.Scene{
 private unsubscribe?:()=>void;private battle:CombatBattle|null=null;private paused=false;
 private backdrop!:Phaser.GameObjects.Image;private actors=new Map<string,Actor>();private missiles=new Map<number,Phaser.GameObjects.Graphics>();private seen=new Set<number>();private freezeUntil=0;
 constructor(){super('portrait-battle');}
 create(){
  const t=this.textures.createCanvas('quarter-field',360,420)!;drawBattlefield(t.context);t.refresh();this.backdrop=this.add.image(0,0,'quarter-field').setOrigin(0).setDepth(-10);this.background();
  const sync=()=>{const s=store.getSnapshot();this.battle=s.battle;this.paused=s.paused;};sync();this.unsubscribe=store.subscribe(sync);this.scale.on('resize',this.background,this);
  this.events.once('shutdown',()=>{this.unsubscribe?.();this.scale.off('resize',this.background,this);});
 }
 private background(){this.backdrop?.setDisplaySize(this.scale.width,this.scale.height);}
 private art(u:CombatUnit){
  const art=u.mercenary?battleImage(u.mercenary):undefined;
  const kind=u.boss?'chief':u.role==='ranged'?'archer':'fighter';
  const key=art?'quarter-'+appearanceSignature(u.mercenary!):'quarter-fallback-'+u.id;
  if(!this.textures.exists(key)){
   const t=this.textures.createCanvas(key,art?256:64,art?320:80)!;
   if(art)t.context.drawImage(art.image,0,0);else if(u.mercenary)drawMercenary(t.context,u.mercenary,'right',0);else drawGoblin(t.context,kind,'down',0);
   t.refresh();this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
  }
  return {key,height:art?.preset.renderHeight??96,anchorX:art?.preset.anchor.x??.5,anchorY:art?.preset.anchor.y??.925};
 }
 private actor(u:CombatUnit,sx:number,sy:number){let a=this.actors.get(u.id);if(a)return a;
  const art=this.art(u),flip=u.side==='enemy';const image=this.add.image(0,0,art.key).setOrigin(flip?1-art.anchorX:art.anchorX,art.anchorY).setFlipX(flip);
  const shadow=this.add.ellipse(0,0,34,10,0x06140c,.4),bar=this.add.graphics(),label=this.add.text(0,12,u.name,{fontSize:'8px',fontFamily:'sans-serif',color:u.side==='party'?'#dcdec5':'#d7b599',stroke:'#15241e',strokeThickness:2}).setOrigin(.5,0);
  const root=this.add.container(u.x*sx,u.y*sy,[shadow,image,bar,label]);
  a={root,image,bar,label,height:art.height,anchorX:art.anchorX,anchorY:art.anchorY,dead:false};this.actors.set(u.id,a);return a;
 }
 private effect(e:CombatEvent,sx:number,sy:number,scale:number){
  const source=e.sourceId?this.actors.get(e.sourceId):undefined,target=e.targetId?this.actors.get(e.targetId):undefined;
  const unit=this.battle?.units.find(u=>u.id===e.sourceId),sign=unit?.side==='enemy'?-1:1;
  const color=unit?.mercenary?.classId==='alchemist'?0xa8dc8c:unit?.role==='healer'?0xa8e6a6:unit?.mercenary?.classId==='mage'?0xc4a0f4:0xf0d696;
  if(e.type==='attack'&&source){this.tweens.add({targets:source.image,x:sign*6,angle:sign*3,duration:90,yoyo:true,onComplete:()=>{source.image.x=0;source.image.angle=0;}});
   if(unit&&unit.attackMode==='melee'&&target){const slash=this.add.graphics().setDepth(1000);slash.lineStyle(3,color,.9);slash.beginPath();slash.arc(target.root.x,target.root.y-35*scale,22*scale,-1.2,1.2);slash.strokePath();this.tweens.add({targets:slash,alpha:0,duration:190,onComplete:()=>slash.destroy()});}
  }
  if(e.type==='skill'&&source){
   const sigil=this.add.ellipse(source.root.x,source.root.y-2,52*scale,18*scale,color,.12).setStrokeStyle(1,color,.8).setDepth(source.root.depth-1);
   const halo=this.add.circle(source.root.x,source.root.y-34*scale,21*scale,color,.12).setBlendMode(Phaser.BlendModes.ADD).setDepth(source.root.depth-1);
   this.tweens.add({targets:[sigil,halo],scale:1.35,alpha:0,duration:460,onComplete:()=>{sigil.destroy();halo.destroy();}});
   if(target){const ring=this.add.ellipse(target.root.x,target.root.y-26*scale,25*scale,14*scale,color,.15).setStrokeStyle(2,color,.9).setDepth(900);this.tweens.add({targets:ring,scale:3,alpha:0,duration:450,onComplete:()=>ring.destroy()});}
  }
  if(e.type==='damage'&&target){
   this.freezeUntil=this.time.now+35;target.image.setTintFill(0xffd2b5);this.time.delayedCall(65,()=>{if(target.image.active)target.image.clearTint();});
   this.tweens.add({targets:target.image,x:sign*5,duration:65,yoyo:true,onComplete:()=>{if(target.image.active)target.image.x=0;}});
   if((e.amount??0)>=15)this.cameras.main.shake(65,.0025);
   const burst=this.add.graphics().setDepth(1000);burst.lineStyle(2,0xffe5b4,.9);for(let i=0;i<6;i++){const angle=i*Math.PI/3,x=target.root.x,y=target.root.y-32*scale;burst.lineBetween(x+Math.cos(angle)*5,y+Math.sin(angle)*5,x+Math.cos(angle)*16*scale,y+Math.sin(angle)*16*scale);}this.tweens.add({targets:burst,alpha:0,duration:200,onComplete:()=>burst.destroy()});
  }
  if(['damage','heal','skill'].includes(e.type)){
   const text=this.add.text(e.x*sx+(e.id%3-1)*9,e.y*sy-60*scale,e.type==='skill'?(e.label??''):e.type==='heal'?'+'+e.amount:e.amount===0?'방어':'-'+e.amount,{fontFamily:'sans-serif',fontSize:e.type==='skill'?'9px':'13px',color:e.type==='heal'?'#b8eba8':e.type==='skill'?'#eadba8':'#ffe2b8',stroke:'#15261d',strokeThickness:3}).setOrigin(.5).setDepth(1200);
   this.tweens.add({targets:text,y:text.y-22,alpha:0,duration:1000,onComplete:()=>text.destroy()});
  }
 }
 update(_time:number,delta:number){const b=this.battle;if(!b)return;
  const sx=this.scale.width/FIELD.width,sy=this.scale.height/FIELD.height,scale=Math.min(sx,sy);
  this.tweens.timeScale=this.paused?0:b.speed;this.time.timeScale=this.paused?0:b.speed;
  for(const u of b.units){const a=this.actor(u,sx,sy),blend=this.paused?1:this.time.now<this.freezeUntil?0:Math.min(1,delta/45);
   a.root.x=Phaser.Math.Linear(a.root.x,u.x*sx,blend);a.root.y=Phaser.Math.Linear(a.root.y,u.y*sy,blend);a.root.setDepth(u.y+(u.action==='attack'?400:0));
   a.image.setDisplaySize(a.height*scale*a.image.width/a.image.height,a.height*scale);a.image.y=u.hp>0?Math.sin(b.elapsed*2+u.home.y)*1.2*scale:0;
   a.bar.clear();if(u.hp>0&&!u.escaped){a.bar.fillStyle(0x10251b,.95).fillRect(-17*scale,4,34*scale,4);a.bar.fillStyle(u.side==='party'?0xa9cd9c:0xd39377).fillRect(-16*scale,5,32*scale*u.hp/u.maxHp,2);if(u.shield>0)a.bar.fillStyle(0x9bdce3).fillRect(-16*scale,1,32*scale,2);}
   a.label.setText(u.name+' · '+(rowOf(u)==='front'?'전':'후'));
   if(u.hp<=0&&!a.dead){a.dead=true;this.tweens.add({targets:a.image,angle:u.side==='party'?-65:65,alpha:.25,duration:350});a.label.setAlpha(.35);}
   if(u.escaped)a.root.setAlpha(.1);
  }
  for(const e of b.events)if(!this.seen.has(e.id)){this.seen.add(e.id);this.effect(e,sx,sy,scale);}
  const live=new Set(b.projectiles.map(p=>p.id));for(const[id,g]of this.missiles)if(!live.has(id)){g.destroy();this.missiles.delete(id);}
  for(const p of b.projectiles){let g=this.missiles.get(p.id);const source=b.units.find(u=>u.id===p.sourceId),target=b.units.find(u=>u.id===p.targetId),color=source?.mercenary?.classId==='alchemist'?0xb3e291:0xcdb0ff;
   if(!g){g=this.add.graphics().setDepth(900);if(p.kind==='arrow'){g.lineStyle(2,0xead7a4);g.lineBetween(-8,0,6,0);g.fillStyle(0xe9dfb6);g.fillTriangle(8,0,3,-3,3,3);}else{g.fillStyle(color,.2);g.fillCircle(0,0,7);g.fillStyle(color);g.fillCircle(0,0,3);g.lineStyle(1,color,.4);g.lineBetween(-12,0,-4,0);}this.missiles.set(p.id,g);}
   g.setPosition(p.x*sx,p.y*sy-35*scale);if(target)g.rotation=Math.atan2((target.y-p.y)*sy,(target.x-p.x)*sx);
  }
 }
}
