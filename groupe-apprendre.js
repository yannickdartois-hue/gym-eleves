/* =====================================================================
   groupe-apprendre.js — onglet « Apprendre » pensé pour une tablette de groupe (chargé après app.js)
   1. Volet repliable « Où en est le groupe » : meilleure lettre de chaque élève dans chaque atelier
      (pleine = validée P par le professeur, contour = validée E par un camarade). Toucher une ligne
      rend cet élève actif, sans quitter Apprendre.
   2. Page d'un atelier : sous chaque niveau, les élèves qui l'ont validé.
   3. Tuiles d'atelier : les pastilles A–F sont précédées de l'abréviation de l'élève actif.
   Abréviation : 3 premières lettres du prénom ; si deux élèves commencent pareil, + initiale du nom.
   Volet replié mémorisé sur l'appareil (localStorage « gym-volet-groupe »).
   ===================================================================== */
(function(){
'use strict';
const CLE_VOLET='gym-volet-groupe';
const ouvert=()=>{try{return localStorage.getItem(CLE_VOLET)!=='0'}catch(e){return true}};
const maj=n=>n.charAt(0).toUpperCase()+n.slice(1);
function abrev(){const L=S.eleves.map(e=>{const p=prenom(e.nom)||e.nom,nomF=String(e.nom).split(/\s+/).filter(x=>x!==p&&!p.split(/\s+/).includes(x))[0]||'';return {p,nomF,a:maj(p.slice(0,3))}});
  const nb={};L.forEach(x=>{const k=x.a.toLowerCase();nb[k]=(nb[k]||0)+1});
  return L.map(x=>nb[x.a.toLowerCase()]>1?(x.p.length<=4?maj(x.p):x.a)+(x.nomF?' '+x.nomF[0].toUpperCase()+'.':''):x.a)}
// meilleure lettre d'un élève dans un atelier : P d'abord, sinon E
function meilleure(id,a){let p='',e='';NIVS.forEach(n=>{const s=etat(id,a+n);if(s==='p')p=n;if(s)e=n});return {p,e}}
const groupe=()=>S&&S.eleves.length>1;

function volet(){const A=abrev(),at=GYM.ateliers;
  const lig=(E,i)=>`<tr data-act="quiapp" data-v="${i}" class="${i===S.cur?'ici':''}"><th>${esc(A[i])}</th>${at.map(x=>{const m=meilleure(E.id,x.n);
    return `<td>${m.p?`<i class="p">${m.p}</i>`:''}${m.e&&m.e!==m.p?`<i class="e">${m.e}</i>`:''}${!m.p&&!m.e?'<span class="vide">–</span>':''}</td>`}).join('')}</tr>`;
  return `<details class="carte vgr"${ouvert()?' open':''}><summary><b>👥 Où en est le groupe</b><small> · touchez un nom pour le choisir</small></summary>
  <div class="vgr-t"><table><thead><tr><th></th>${at.map(x=>`<th ${st(x.n)}><span class="vgr-n">${x.n}</span></th>`).join('')}</tr></thead>
  <tbody>${S.eleves.map(lig).join('')}</tbody></table></div>
  <p class="small muted" style="margin:6px 0 0"><i class="vgr-l p">C</i> validé par le professeur · <i class="vgr-l e">C</i> validé par un camarade, à confirmer</p></details>`}

const oA=vApprendre;window.vApprendre=function(){let h=oA();if(!groupe())return h;
  const A=abrev(),c=A[S.cur]||'';
  h=h.replace(/<div class="etat-at">/g,`<div class="etat-at"><span class="qui-at">${esc(c)}</span>`);
  const i=h.indexOf('<div class="ateliers">');return i<0?h+volet():h.slice(0,i)+volet()+h.slice(i)};

const oT=vAtelier;window.vAtelier=function(n){let h=oT(n);if(!groupe())return h;const A=abrev(),a=atelier(n);
  a.niv.forEach(x=>{const k=a.n+x.n,qui=S.eleves.map((E,i)=>({s:etat(E.id,k),a:A[i]})).filter(q=>q.s);if(!qui.length)return;
    const tag=`<div class="qui-niv">${qui.map(q=>`<span class="${q.s}">${esc(q.a)}</span>`).join('')}</div>`;
    const deb=h.indexOf(`data-act="niveau" data-v="${k}"`);if(deb<0)return;const j=h.indexOf('<div class="crit">',deb);if(j<0)return;h=h.slice(0,j)+tag+h.slice(j)});
  return h};

document.addEventListener('click',e=>{const t=e.target.closest('[data-act="quiapp"]');if(!t||!S)return;e.stopImmediatePropagation();
  S.cur=+t.dataset.v;sauver();rendre()},true);
document.addEventListener('toggle',e=>{const d=e.target;if(!d.classList||!d.classList.contains('vgr'))return;try{localStorage.setItem(CLE_VOLET,d.open?'1':'0')}catch(x){}},true);

const css=document.createElement('style');css.textContent=`
.vgr summary{cursor:pointer;list-style-position:inside}.vgr summary small{color:var(--repere,#6b7280)}
.vgr-t{overflow-x:auto;margin-top:8px}.vgr table{border-collapse:collapse;width:100%}
.vgr th,.vgr td{padding:4px 2px;text-align:center;border-top:1px solid var(--trait,#e5e7eb)}
.vgr tbody th{text-align:left;font:800 15px var(--d,inherit);padding-left:6px;white-space:nowrap}
.vgr tbody tr{cursor:pointer}.vgr tbody tr.ici{background:#eef6ff}.vgr tbody tr.ici th{box-shadow:inset 4px 0 0 #2563eb}
.vgr-n{display:inline-block;min-width:24px;border-bottom:4px solid var(--at,#999);font:800 14px var(--d,inherit)}
.vgr td{white-space:nowrap}.vgr td i,.vgr-l{display:inline-block;width:26px;height:26px;border-radius:7px;font:800 15px/26px var(--d,inherit);font-style:normal;text-align:center;margin:0 1px;vertical-align:middle}.vgr td i.e{width:19px;height:19px;font-size:12px;line-height:19px;border-radius:5px;margin-left:-3px}
.vgr td i.p,.vgr-l.p{background:var(--ok,#15803d);color:#fff}.vgr td i.e,.vgr-l.e{background:#fff3c4;color:#6b4e00;box-shadow:inset 0 0 0 2px #d6a400}
.vgr .vide{color:var(--repere,#9ca3af)}
.qui-at{font:800 13px/26px var(--d,inherit);margin-right:2px;min-width:30px}
.qui-niv{display:flex;flex-wrap:wrap;gap:4px;margin:3px 0}.qui-niv span{font:700 12px/1 system-ui,sans-serif;padding:3px 6px;border-radius:6px}
.qui-niv .p{background:var(--ok,#15803d);color:#fff}.qui-niv .e{background:#fff3c4;color:#6b4e00;box-shadow:inset 0 0 0 1.5px #d6a400}`;document.head.appendChild(css);
try{if(S)rendre()}catch(e){}
})();
