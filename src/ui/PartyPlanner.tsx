import {useState} from 'react';
import {SLOT_IDS,formationSlots,formationIds} from '../domain/combat/formation';
import {combatParty} from '../domain/guild';
import {isHero} from '../domain/characters';
import {CLASSES} from '../data/catalog';
import {store} from '../state/store';
import {Avatar} from './components';
import type {Guild,SlotId} from '../domain/types';
export function PartyPlanner({guild,disabled,inspect,navigate}:{guild:Guild;disabled:boolean;inspect:(id:string)=>void;navigate:(screen:'quests')=>void}){
 const [selected,setSelected]=useState('hero'),[name,setName]=useState('나의 진형');const slots=formationSlots(guild),rows=formationIds(guild),party=combatParty(guild);
 const place=(slot:SlotId,id=selected)=>{if(!disabled&&id)store.place(slot,id);};
 return <section className="screen party-screen" aria-label="편성 화면">
  <div className="screen-heading"><span className="eyebrow">MAKE YOUR FORMATION</span><h1>자유 진형 <small>{party.length} / 5</small></h1><p>전열 {rows.front.length} · 후열 {rows.rear.length} · 주인공 포함 최대 5명</p></div>
  <p className="hint">아래 동료를 선택하고 배치할 칸을 누르세요. 이미 배치한 동료는 서로 자리를 바꿉니다.</p>
  <div className="formation-board" aria-label="10슬롯 자유 진형">{(['F','B'] as const).map(row=><div key={row} className="formation-line"><h2>{row==='F'?'전열':'후열'} <small>{row==='F'?'근접 공격의 우선 대상':'전열의 보호를 받는 위치'}</small></h2><div className="formation-five">{SLOT_IDS.filter(s=>s[0]===row).map(slot=>{const m=guild.roster.find(m=>m.id===slots[slot]);return <button key={slot} className={'formation-slot '+(m?.id===selected?'selected':'')} aria-label={slot+' '+(m?.name??'빈 슬롯')} data-slot={slot} data-character={m?.id??''} disabled={disabled} onClick={()=>place(slot)} draggable={!!m} onDragStart={e=>{e.dataTransfer.setData('text/plain',m!.id);setSelected(m!.id);}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();place(slot,e.dataTransfer.getData('text/plain'));}}><small>{slot}</small>{m?<><Avatar m={m}/><b>{m.name}</b></>:<span>＋</span>}</button>;})}</div></div>)}</div>
  <div className="formation-actions" aria-label="기본 진형">{([['balanced','균형형'],['all-front','전원 전열'],['rear-focus','후위 중심'],['all-rear','전원 후열']] as const).map(([id,label])=><button key={id} disabled={disabled} onClick={()=>store.formation(id)}>{label}</button>)}</div>
  <div className="save-formation"><input aria-label="진형 이름" maxLength={24} value={name} onChange={e=>setName(e.target.value)}/><button disabled={disabled} onClick={()=>store.saveFormation(name)}>진형 저장</button></div>
  {!!guild.formationPresets?.length&&<div className="formation-actions">{guild.formationPresets.map(p=><button key={p.id} disabled={disabled} onClick={()=>store.loadFormation(p.id)}>{p.name} 불러오기</button>)}</div>}
  <div className="section-heading"><h2>배치할 동료 선택</h2><span>선택 중 · {guild.roster.find(m=>m.id===selected)?.name??'없음'}</span></div>
  <div className="party-roster">{guild.roster.map(m=><article key={m.id} className="party-row"><button className={'party-person '+(selected===m.id?'selected-person':'')} aria-label={m.name+' 배치 선택'} aria-pressed={selected===m.id} disabled={disabled} onClick={()=>setSelected(m.id)} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',m.id)}><Avatar m={m}/><span><b>{m.name}</b><small>{CLASSES[m.classId].name} · Lv.{m.level}</small></span></button><button className="row-toggle" aria-label={m.name+' 상세 정보'} onClick={()=>inspect(m.id)}>상세</button><button className="party-toggle" disabled={disabled||isHero(m)} onClick={()=>store.toggleParty(m.id)} aria-label={m.name+' '+(party.some(p=>p.id===m.id)?'편성 해제':'편성')}>{isHero(m)?'고정 출전':party.some(p=>p.id===m.id)?'해제':'편성'}</button></article>)}</div>
  <button className="primary full-width" disabled={disabled} onClick={()=>navigate('quests')}>의뢰 선택하기 →</button>
 </section>;
}
