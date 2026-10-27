import {createServer} from 'vite';import {chromium} from '@playwright/test';import {writeFileSync,mkdirSync} from 'node:fs';
const jobs=[["warrior","전사","warrior","sword","front","warrior","mixed"],["knight","기사","guardian","sword-shield","front","knight","mixed"],["archer","궁수","archer","bow","rear","archer-female","female"],["archer","궁수","archer","bow","rear","archer-male","male"],["mage","마법사","mage","staff","rear","mage","mixed"],["priest","사제","priest","staff","rear","priest","mixed"],["thief","도적","rogue","dagger","front","thief","mixed"],["lancer","창병","lancer","spear","front","lancer","mixed"],["alchemist","연금술사","alchemist","staff","rear","alchemist","mixed"]];
const server=await createServer({server:{host:'127.0.0.1',port:0},clearScreen:false});server.middlewares.use('/__preset_bake',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end('<!doctype html><body></body>');});let browser;
try{await server.listen();browser=await chromium.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__preset_bake`);
 const out=await page.evaluate(async jobs=>{
 const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const preview=canvas(640,1800),pc=preview.getContext('2d');pc.imageSmoothingEnabled=false;pc.fillStyle='#1c2c30';pc.fillRect(0,0,640,1800);const files={},presets=[],checks=[];
 for(const [ji,[job,label,classId,weapon,row,sheet,sex]]of jobs.entries()){
  const img=new Image();img.src='/docs/art/v4-body-sources/'+sheet+'.png';await img.decode();const src=canvas(img.width,img.height),sc=src.getContext('2d',{willReadFrequently:true});sc.drawImage(img,0,0);const pixels=sc.getImageData(0,0,img.width,img.height).data;
  let transparent=0;for(let p=3;p<pixels.length;p+=4)if(pixels[p]===0)transparent++;if(transparent/pixels.length*4<.2)throw Error('No alpha '+job);
  for(let slot=0;slot<4;slot++){
   const col=slot%2,ri=Math.floor(slot/2),x0=Math.max(0,col*768-24),x1=Math.min(img.width,(col+1)*768+24),y0=Math.max(0,ri*512-24),y1=Math.min(img.height,(ri+1)*512+24),rw=x1-x0,rh=y1-y0;
   const visited=new Uint8Array(rw*rh),queue=new Int32Array(rw*rh);let best=[],count=0;
   for(let n=0;n<rw*rh;n++){
    if(visited[n])continue;visited[n]=1;const x=n%rw,y=Math.floor(n/rw);if(pixels[((y+y0)*img.width+x+x0)*4+3]<=24)continue;
    let head=0,tail=1;queue[0]=n;
    while(head<tail){const q=queue[head++],qx=q%rw,qy=Math.floor(q/rw);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const ax=qx+dx,ay=qy+dy;if(ax<0||ay<0||ax>=rw||ay>=rh)continue;const z=ay*rw+ax;if(visited[z])continue;visited[z]=1;if(pixels[((ay+y0)*img.width+ax+x0)*4+3]>24)queue[tail++]=z;}}
    if(tail>count){count=tail;best=Array.from(queue.subarray(0,tail));}
   }
   if(count<5000)throw Error('Missing figure '+job+' '+slot);
   let left=img.width,right=0,top=img.height,bottom=0;
   for(const n of best){const x=x0+n%rw,y=y0+Math.floor(n/rw);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   if(bottom-top>545)throw Error('Overlapping figures '+job+' '+slot);
   const foot=best.filter(n=>y0+Math.floor(n/rw)>=bottom-(bottom-top)*.06);const footX=foot.reduce((s,n)=>s+x0+n%rw,0)/foot.length;
   const w=right-left+1,h=bottom-top+1,scale=Math.min(292/h,118/Math.max(1,footX-left),118/Math.max(1,right-footX));
   const cropped=canvas(w,h),cc=cropped.getContext('2d'),data=cc.createImageData(w,h);
   // Extract the connected cutout, retaining original generated colors and alpha.
   for(const n of best){const x=x0+n%rw,y=y0+Math.floor(n/rw),p=(y*img.width+x)*4,d=((y-top)*w+x-left)*4;for(let c=0;c<4;c++)data.data[d+c]=pixels[p+c];}
   cc.putImageData(data,0,0);const packed=canvas(256,320),c=packed.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(cropped,Math.round(128-(footX-left)*scale),Math.round(306-h*scale),Math.round(w*scale),Math.round(h*scale));
   const gender=sex!=='mixed'?sex:slot<2?'female':'male',id=job+'_'+(gender==='female'?'f':'m')+'_0'+(sex!=='mixed'?slot+1:slot%2+1),name=label+' '+['새벽','월영','길잡이','황혼'][slot];
   const file='assets/battle_units/'+job+'/'+id+'.png';files[file]=packed.toDataURL();presets.push({id,job,classId,label,gender,name,bodyType:sex==='female'?['petite','slim','standard','curvy'][slot]:sex==='male'?['slim','standard','broad','standard'][slot]:slot===0?(job==='warrior'?'petite':'slim'):slot===1?'curvy':slot===2?(job==='warrior'?'slim':'standard'):'broad',bodyAssetId:id,advancementTier:1,weaponSocket:{x:Math.round(128-(footX-left)*scale+w*.94*scale),y:Math.round(306-h*scale+h*.58*scale)},shieldSocket:{x:Math.round(128-(footX-left)*scale+w*.44*scale)-5,y:Math.round(306-h*scale+h*.58*scale)},race:slot===2?'human':'elf',file,weapon,row,facing:'right',renderHeight:Math.round(84*320/(h*scale)),resolution:{width:256,height:320},anchor:{x:.5,y:306/320},source:{file:'docs/art/v4-body-sources/'+sheet+'.png',slot,bounds:{left,top,right,bottom}},style:'quarter-unarmed-v4'});
   pc.drawImage(packed,slot*160+16,ji*200+5,128,160);pc.fillStyle='#e4d5af';pc.font='12px sans-serif';pc.textAlign='center';pc.fillText(label+' · '+id,slot*160+80,ji*200+188);
   const alpha=c.getImageData(0,0,256,320).data;let solid=0;for(let i=3;i<alpha.length;i+=4)if(alpha[i]>0)solid++;if(solid<3000)throw Error('Sparse packed frame '+id);checks.push({id,solid,sourceHeight:h});
  }
 }
 return {files,presets,preview:preview.toDataURL(),checks};
 },jobs);
 for(const [path,url]of Object.entries(out.files)){mkdirSync('public/'+path.slice(0,path.lastIndexOf('/')),{recursive:true});writeFileSync('public/'+path,Buffer.from(url.split(',')[1],'base64'));}
 writeFileSync('src/data/battle-presets.json',JSON.stringify(out.presets,null,2)+'\n');writeFileSync('public/assets/battle_units/manifest.json',JSON.stringify({version:1,presets:out.presets},null,2)+'\n');writeFileSync('public/assets/battle_units/contact-sheet.png',Buffer.from(out.preview.split(',')[1],'base64'));console.log('Packed and validated '+out.presets.length+' actual 256×320 RGBA cutouts across '+jobs.length+' classes.');console.log(JSON.stringify(out.checks));
}finally{await browser?.close();await server.close();}
