/* =====================================================================
   avatar-eleve.js — le personnage gymnaste de chaque élève (chargé après app.js et plus.js)
   - Sur « Ma fiche » : le personnage de l'élève, sa forme, et le bouton « Changer ».
   - 1 personnage au départ, +1 tous les 3 niveaux validés (E ou P).
   - La forme (taille, figure) suit le meilleur niveau validé P : A–B → 1, C–D → 2, E–F → 3.
   - Écran de fête quand un personnage se débloque ou que le personnage grandit.
   - Le choix part avec l'envoi (champ « av ») pour s'afficher dans l'outil prof.
   Données dans le carnet chiffré : S.av = {idElève: idPersonnage}, S.avVu = {idElève: {n, f}}.
   ===================================================================== */
(function(){
'use strict';
if(!window.GYMAV)return;
const A=GYMAV,NOMF=['Forme 1 · niveaux A–B','Forme 2 · niveaux C–D','Forme 3 · niveaux E–F'];
const CLE_NIV=/^\d[A-F]$/;
function stats(id){const V=S.val[id]||{};let n=0,best='';
  Object.entries(V).forEach(([k,v])=>{if(!CLE_NIV.test(k))return;if(v.e||v.p)n++;if(v.p&&k[1]>best)best=k[1]});
  return {n,best,f:A.forme(best),nb:A.nbDebloques(n)}}
const dispo=(E,nb)=>A.ordre(E.nom).slice(0,nb);
function choix(E){S.av=S.av||{};const st=stats(E.id),L=dispo(E,st.nb);let id=S.av[E.id];if(!id||!L.includes(id))id=L[0];return id}
const reste=n=>A.PAS-(n%A.PAS);

/* ---------- carte sur la fiche ---------- */
function carte(E){const st=stats(E.id),id=choix(E),a=A.parId[id];
  const suite=st.nb>=A.AV.length?'Tous les personnages sont débloqués !':`Prochain personnage dans <b>${reste(st.n)}</b> niveau${reste(st.n)>1?'x':''} validé${reste(st.n)>1?'s':''}.`;
  const grandir=st.f<2?`<br>Pour grandir : un niveau <b>${st.f===0?'C':'E'}</b> validé par le professeur.`:'';
  return `<section class="carte gav-carte"><div class="gav-fig">${A.svg(id,st.f,{px:104})}</div>
  <div class="gav-txt"><b style="font-size:1.1em">${esc(a.n)}</b><small>${NOMF[st.f]} · ${esc(A.FIG[st.f===0?'salut':st.f===1?a.f2:a.f3])}</small>
  <span class="small">${st.n} niveau${st.n>1?'x':''} validé${st.n>1?'s':''} · ${st.nb} / ${A.AV.length} personnages<br>${suite}${grandir}</span>
  <button class="bt mini" type="button" data-act="gavchoix">Changer de personnage</button></div></section>`}
const vF=vFiche;
window.vFiche=function(){let h=vF();if(!S||!S.eleves.length)return h;const E=elv();
  return h.replace(/(<h2>Fiche de [^<]*<\/h2>)/,'$1'+carte(E))};

/* ---------- choisir son personnage ---------- */
function picker(){const E=elv(),st=stats(E.id),L=dispo(E,st.nb),cur=choix(E),O=A.ordre(E.nom);
  fen(`<h3>Choisis ton personnage</h3><p class="small muted" style="margin-top:-4px">${st.nb} / ${A.AV.length} débloqués. Sa taille et sa figure suivent ton meilleur niveau validé par le professeur.</p>
  <div class="gav-grille">${O.map((id,i)=>{const ok=L.includes(id),a=A.parId[id];
    if(!ok){const manque=(i)*A.PAS-st.n;return `<div class="gav-c gav-off">${A.svg(id,0,{px:80,gris:1,titre:'Personnage verrouillé'})}<small>🔒 dans ${manque} niveau${manque>1?'x':''}</small></div>`}
    return `<button type="button" class="gav-c${id===cur?' on':''}" data-act="gavpris" data-v="${id}">${A.svg(id,st.f,{px:80,anim:id===cur})}<small>${esc(a.n)}</small></button>`}).join('')}</div>
  <div class="rangee"><button class="bt" type="button" data-act="fermer">Fermer</button></div>`)}

/* ---------- fêtes : nouveau personnage, personnage qui grandit ---------- */
function fete(){if(!S||S.tab!=='fiche'||NAV.length||!S.eleves.length||$('#modal').innerHTML)return;
  S.avVu=S.avVu||{};
  for(const E of S.eleves){const st=stats(E.id),vu=S.avVu[E.id];
    if(!vu){S.avVu[E.id]={n:st.nb,f:st.f};sauver();continue} // première fois : pas de fête rétroactive
    if(st.nb>vu.n||st.f>vu.f){const nouv=dispo(E,st.nb).slice(vu.n),grand=st.f>vu.f,id=choix(E);
      S.avVu[E.id]={n:Math.max(vu.n,st.nb),f:Math.max(vu.f,st.f)};sauver();
      fen(`<div class="gav-fete"><h3>${grand?'Ton personnage a grandi !':'Nouveau personnage débloqué !'}</h3><p style="margin:0 0 6px"><b>${esc(prenom(E.nom))}</b></p>
      <div class="gav-grille" style="justify-content:center">${(grand?[id]:nouv).map(x=>`<div class="gav-c on">${A.svg(x,st.f,{px:grand?150:96})}<small>${esc(A.parId[x].n)}</small></div>`).join('')}</div>
      <p class="small">${grand?`${esc(NOMF[st.f])} : ${esc(A.FIG[st.f===1?A.parId[id].f2:A.parId[id].f3])}.`:'Tu peux le choisir dès maintenant.'}</p>
      <div class="rangee" style="justify-content:center">${grand?'':`<button class="bt" type="button" data-act="gavchoix" data-e="${esc(E.id)}">Choisir</button>`}<button class="bt noir" type="button" data-act="fermer">Super !</button></div></div>`);
      return}}}
const r0=rendre;window.rendre=function(){r0();try{fete()}catch(e){}};

/* ---------- envoi au professeur ---------- */
const oE=objetEnvoi;window.objetEnvoi=function(){const o=oE();(o.el||[]).forEach((x,i)=>{const E=S.eleves[i];if(E)x.av=choix(E)});return o};

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b||!S)return;
  if(b.dataset.act==='gavchoix'){e.stopImmediatePropagation();if(b.dataset.e){const i=S.eleves.findIndex(x=>x.id===b.dataset.e);if(i>=0)S.cur=i}fermer();picker();return}
  if(b.dataset.act==='gavpris'){e.stopImmediatePropagation();S.av=S.av||{};S.av[elv().id]=b.dataset.v;S.mod=Date.now();sauver();fermer();rendre();return}
},true);

const css=document.createElement('style');css.textContent=`
.gav-carte{display:flex;gap:12px;align-items:center;padding:8px 12px}.gav-fig{flex:none;background:#f7f5f2;border-radius:14px}
.gav-txt{display:flex;flex-direction:column;gap:3px;align-items:flex-start}.gav-txt small{color:#6b6f85}
.gav-grille{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0}.gav-fete .gav-grille{display:flex;flex-wrap:wrap}
.gav-c{display:flex;flex-direction:column;align-items:center;background:#f7f5f2;border:2px solid transparent;border-radius:14px;padding:4px 6px 6px;font:inherit;color:inherit;cursor:pointer;min-width:0}
.gav-c.on{border-color:#7c3aed;background:#f1ecfb}.gav-off{opacity:.75;cursor:default}.gav-c small{font-size:12px}
.gav-fete{text-align:center}`;document.head.appendChild(css);
})();
