/* =====================================================================
   avatars-gym.js — personnages gymnastes (élèves) pour les applis gym
   12 personnages pastel, chacun en 3 formes selon le meilleur niveau validé P :
     forme 1 (A–B ou rien) : petit, salut du gymnaste
     forme 2 (C–D)         : plus grand, sa figure (ATR, roue ou saut)
     forme 3 (E–F)         : grand et athlétique, sa figure experte (salto, vrille, écart)
   Débloqués : 1 au départ, +1 tous les 3 niveaux validés (E ou P).
   Fichier IDENTIQUE dans gym-eleves et gym-prof.
   window.GYMAV = {AV, svg(id, forme, opts), forme(bestP), nbDebloques(nVal), ordre(nom), parDefaut(nom), PAS}
   ===================================================================== */
(function(root){
'use strict';
const PAS=3; // un nouveau personnage tous les PAS niveaux validés
// [id, nom, peau, cheveux, coiffure, maillot, maillot foncé, accent, figure forme 2, figure forme 3]
const L=[
['iris','Iris','#f3d9c4','#6b4f3f','queue','#b8d8f0','#8fb8de','#f4c2c2','roue','salto'],
['noam','Noam','#d9b48f','#2f2a3a','court','#cfe8cf','#9ccc9c','#e6d3f5','atr','vrille'],
['lou','Lou','#f1d3b6','#c98a4b','chignon','#f9d9b8','#f2b98a','#bfe3ea','saut','ecart'],
['sami','Sami','#c68b5e','#1f1b24','boucles','#e6d3f5','#c9b3e6','#fde2a7','atr','salto'],
['jade','Jade','#f6dfcb','#2f2a3a','chignon','#f6c6d0','#eaa1b3','#cfe8cf','roue','vrille'],
['eli','Éli','#e9c8a8','#8a5a3b','court','#fde2a7','#f5c96a','#b8d8f0','saut','salto'],
['mila','Mila','#8d5b3e','#1f1b24','queue','#bfe3ea','#8fcad6','#f6c6d0','atr','ecart'],
['tom','Tom','#f3d9c4','#d4a24c','court','#d6d3f0','#aaa5dc','#f9d9b8','roue','salto'],
['nina','Nina','#e2b48c','#4a2f22','boucles','#f9d9b8','#f2b98a','#d6d3f0','saut','vrille'],
['yan','Yan','#f1d3b6','#3b2f2a','court','#c8e6d8','#93cdb2','#f4c2c2','atr','ecart'],
['lina','Lina','#c99b72','#2f2a3a','queue','#f4c2c2','#e79e9e','#bfe3ea','roue','salto'],
['axel','Axel','#f6dfcb','#a0522d','boucles','#b8d8f0','#8fb8de','#fde2a7','saut','vrille']];
const AV=L.map(([id,n,peau,che,coif,mai,mai2,acc,f2,f3])=>({id,n,peau,che,coif,mai,mai2,acc,f2,f3}));
const parId=Object.fromEntries(AV.map(a=>[a.id,a]));
const FIG={salut:'Salut',atr:'ATR',roue:'Roue',saut:'Saut extension',salto:'Salto arrière',vrille:'Vrille',ecart:'Saut écart'};
const T='#3b3f5c';
const SC=[.78,.9,1],LW=[[5.2,4],[6.2,5],[8.4,6.6]]; // échelle, épaisseurs [jambes, bras]

/* ---------- styles et animations (injectés une fois) ---------- */
function css(){if(typeof document==='undefined'||document.getElementById('gav-css'))return;const s=document.createElement('style');s.id='gav-css';s.textContent=`
@keyframes gav-bg{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(-150deg)}}
@keyframes gav-bd{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(150deg)}}
@keyframes gav-vac{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes gav-roue{0%{transform:translateX(-24px) rotate(0)}70%,100%{transform:translateX(24px) rotate(360deg)}}
@keyframes gav-saut{0%,100%{transform:translateY(0)}40%,60%{transform:translateY(-26px)}}
@keyframes gav-salto{0%,12%{transform:translateY(22px) rotate(0)}30%{transform:translateY(-14px) rotate(-120deg)}50%{transform:translateY(-22px) rotate(-240deg)}72%{transform:translateY(16px) rotate(-360deg)}100%{transform:translateY(22px) rotate(-360deg)}}
@keyframes gav-vrille{0%,10%{transform:translateY(0) scaleX(1)}25%{transform:translateY(-22px) scaleX(-1)}40%{transform:translateY(-30px) scaleX(1)}55%{transform:translateY(-22px) scaleX(-1)}70%,100%{transform:translateY(0) scaleX(1)}}
@keyframes gav-ombre{0%,100%{transform:scaleX(1);opacity:.18}50%{transform:scaleX(.6);opacity:.08}}
.gav-a .gav-bg{animation:gav-bg 2.4s ease-in-out infinite}.gav-a .gav-bd{animation:gav-bd 2.4s ease-in-out infinite}
.gav-a .gav-vac{animation:gav-vac 1.8s ease-in-out infinite}.gav-a .gav-roue{animation:gav-roue 2.4s ease-in-out infinite}
.gav-a .gav-saut{animation:gav-saut 1.4s ease-in-out infinite}.gav-a .gav-salto{animation:gav-salto 2.2s cubic-bezier(.4,0,.3,1) infinite}
.gav-a .gav-vrille{animation:gav-vrille 2.2s ease-in-out infinite}.gav-a .gav-om{animation:gav-ombre 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.gav-a *{animation:none!important}}`;document.head.appendChild(s)}

/* ---------- briques de dessin ---------- */
const membre=(x1,y1,x2,y2,w,col)=>`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${T}" stroke-width="${w+3}" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
function cheveuxFace(a,cx,cy){ // tête de face, centre (cx,cy), rayon 10
  const base=`<path d="M${cx-10} ${cy-1} Q${cx-10} ${cy-12} ${cx} ${cy-12} Q${cx+11} ${cy-12} ${cx+10} ${cy} Q${cx+6} ${cy-7} ${cx-2} ${cy-6} Q${cx-7} ${cy-5} ${cx-10} ${cy-1} Z" fill="${a.che}" stroke="${T}" stroke-width="2"/>`;
  if(a.coif==='queue')return `<path d="M${cx+8} ${cy-6} Q${cx+19} ${cy-2} ${cx+15} ${cy+12} Q${cx+12} ${cy+4} ${cx+8} ${cy+1} Z" fill="${a.che}" stroke="${T}" stroke-width="2"/>`+base;
  if(a.coif==='chignon')return `<circle cx="${cx}" cy="${cy-14}" r="5" fill="${a.che}" stroke="${T}" stroke-width="2"/>`+base;
  if(a.coif==='boucles')return [[-9,-7],[-5,-11],[0,-13],[5,-11],[9,-7],[11,-2],[-11,-2]].map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="4.2" fill="${a.che}" stroke="${T}" stroke-width="1.8"/>`).join('')+`<path d="M${cx-9} ${cy-3} Q${cx} ${cy-10} ${cx+9} ${cy-3} Z" fill="${a.che}"/>`;
  return base;
}
function tete(a,cx,cy,heureux){
  return `<circle cx="${cx}" cy="${cy}" r="10" fill="${a.peau}" stroke="${T}" stroke-width="2.2"/>${cheveuxFace(a,cx,cy)}
  <circle cx="${cx-3.5}" cy="${cy+2}" r="1.3" fill="${T}"/><circle cx="${cx+3.5}" cy="${cy+2}" r="1.3" fill="${T}"/>
  <path d="M${cx-2.5} ${cy+6} Q${cx} ${cy+(heureux?8.5:7.5)} ${cx+2.5} ${cy+6}" stroke="${T}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
}
// Corps de face : bras et jambes donnés par leurs extrémités. o.ga/o.gd = classes d'animation des bras.
function face(a,f,o){
  const [wj,wb]=LW[f];
  const bras=(x,y,ex,ey,cl)=>`<g${cl?` class="${cl}" style="transform-origin:${x}px ${y}px"`:''}>${membre(x,y,ex,ey,wb,a.peau)}</g>`;
  return membre(55,100,o.j[0],o.j[1],wj,a.mai2)+membre(65,100,o.j[2],o.j[3],wj,a.mai2)
   +bras(52,73,o.b[0],o.b[1],o.ga)+bras(68,73,o.b[2],o.b[3],o.gd)
   +`<path d="M${f===2?47:50} 70 Q60 ${f===2?65:67} ${f===2?73:70} 70 L67 102 L53 102 Z" fill="${a.mai}" stroke="${T}" stroke-width="2.2" stroke-linejoin="round"/>
   <path d="M53 90 L67 90" stroke="${a.acc}" stroke-width="4"/>
   <path d="M57 62 L57 69 L63 69 L63 62" fill="${a.peau}" stroke="${T}" stroke-width="2"/>`+tete(a,60,54,o.h)
   +(o.croise?membre(52,73,64,84,wb,a.peau)+membre(68,73,56,84,wb,a.peau):'');
}
// Salto arrière groupé, de profil (tourné vers la droite)
function profil(a,f){
  const [wj,wb]=LW[f];
  const queue=a.coif==='queue'?`<path d="M62 42 Q48 40 50 56 Q55 48 62 47 Z" fill="${a.che}" stroke="${T}" stroke-width="2"/>`:a.coif==='chignon'?`<circle cx="60" cy="40" r="5" fill="${a.che}" stroke="${T}" stroke-width="2"/>`:'';
  const boucles=a.coif==='boucles'?[[61,40],[66,36],[72,35],[62,47],[77,38]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.2" fill="${a.che}" stroke="${T}" stroke-width="1.8"/>`).join(''):'';
  return membre(50,80,74,76,wj+1,a.mai2)+membre(74,76,66,96,wj,a.mai2)+membre(66,96,74,98,3,a.peau)
   +`<path d="M46 82 Q42 66 52 56 Q62 50 68 58 L62 74 Q56 82 46 82 Z" fill="${a.mai}" stroke="${T}" stroke-width="2.2" stroke-linejoin="round"/>
   <path d="M48 72 Q54 66 63 66" stroke="${a.acc}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
   +membre(62,60,72,82,wb,a.peau)+queue
   +`<circle cx="70" cy="47" r="10.5" fill="${a.peau}" stroke="${T}" stroke-width="2.2"/>${boucles}
   <path d="M60 46 Q58 34 70 35 Q79 36 80 44 Q72 41 66 46 Q63 49 60 46 Z" fill="${a.che}" stroke="${T}" stroke-width="2"/>
   <circle cx="75.5" cy="48" r="1.5" fill="${T}"/><path d="M74 53 Q77 54 79 52" stroke="${T}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
}
const DEBOUT={j:[53,128,67,128]};
function figure(a,f){
  const fig=f===0?'salut':f===1?a.f2:a.f3,sol=`<ellipse class="gav-om" cx="60" cy="131" rx="${18+f*4}" ry="3" fill="${T}" opacity=".16" style="transform-origin:60px 131px"/>`;
  let g;
  switch(fig){
    case 'atr':g=`<g class="gav-vac" style="transform-origin:60px 128px"><g transform="rotate(180 60 84)">${face(a,f,{j:[54,128,66,128],b:[54,40,66,40]})}</g></g>`;break;
    case 'roue':g=`<g class="gav-roue" style="transform-origin:60px 84px">${face(a,f,{j:[40,124,80,124],b:[34,46,86,46],h:1})}</g>`;break;
    case 'saut':g=`<g class="gav-saut">${face(a,f,{j:[56,128,64,128],b:[44,42,76,42],h:1})}</g>`;break;
    case 'vrille':g=`<g class="gav-vrille" style="transform-origin:60px 84px">${face(a,f,{j:[57,128,63,128],b:[52,73,68,73],croise:1})}</g>`;break;
    case 'ecart':g=`<g class="gav-saut" style="transform:translateY(-14px)">${face(a,f,{j:[32,82,88,82],b:[34,80,86,80],h:1})}</g><path d="M38 120 L44 112 M82 120 L76 112 M60 122 L60 114" stroke="${a.mai2}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;break;
    case 'salto':g=`<path d="M30 92 A34 34 0 1 1 90 92" stroke="${a.mai2}" stroke-width="3" fill="none" stroke-dasharray="2 7" stroke-linecap="round" opacity=".8"/><g class="gav-salto" style="transform-box:fill-box;transform-origin:center">${profil(a,f)}</g>`;break;
    default:g=face(a,f,Object.assign({b:[44,96,76,96],ga:'gav-bg',gd:'gav-bd'},DEBOUT));
  }
  return sol+`<g transform="translate(60 131) scale(${SC[f]}) translate(-60 -131)">${g}</g>`;
}
/* ---------- API ---------- */
// opts : {px, anim (défaut true), gris (verrouillé), titre}
function svg(id,forme,o){o=o||{};css();const a=parId[id]||AV[0],f=Math.max(0,Math.min(2,forme|0));
  const corps=o.gris?figure(Object.assign({},a,{peau:'#d4d6de',che:'#b9bcc8',mai:'#e3e5ec',mai2:'#c9ccd6',acc:'#d4d6de'}),0):figure(a,f);
  return `<svg class="gav${o.anim===false||o.gris?'':' gav-a'}" viewBox="0 0 120 140" width="${o.px||120}" height="${Math.round((o.px||120)*140/120)}" role="img" aria-label="${o.titre||a.n+' · '+FIG[f===0?'salut':f===1?a.f2:a.f3]}">${corps}</svg>`}
const forme=bestP=>{const i='ABCDEF'.indexOf(bestP||'');return i>=4?2:i>=2?1:0};
const nbDebloques=nVal=>Math.min(AV.length,1+Math.floor((nVal||0)/PAS));
const hash=s=>{let h=0;String(s||'').split('').forEach(c=>h=(h*31+c.charCodeAt(0))>>>0);return h};
// ordre de déblocage propre à chaque élève : on commence par « son » personnage, puis les suivants
const ordre=nom=>{const d=hash(nom)%AV.length;return AV.map((_,i)=>AV[(d+i)%AV.length].id)};
const parDefaut=nom=>ordre(nom)[0];
root.GYMAV={AV,parId,FIG,svg,forme,nbDebloques,ordre,parDefaut,PAS};
})(typeof window!=='undefined'?window:globalThis);
