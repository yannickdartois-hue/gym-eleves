/* =====================================================================
   app.js — Gymnastique · appli élève (fiche CA3 + fiches de travail interactives)
   Lycée Georges Pompidou · une tablette pour un groupe de 2 à 4 élèves
   Données gardées sur la tablette uniquement (localStorage), carnet de
   chaque groupe chiffré avec son code secret.
   E = co-évaluation par un camarade · P = validation par le professeur
   ===================================================================== */
'use strict';
const CLE='gym-eleves-v1',VERSION=1,MAX_GROUPE=4;
const NIVS=['A','B','C','D','E','F'];
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dateFr=ms=>{const d=new Date(ms);return d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})};
const prenom=n=>String(n||'').split(/\s+/)[0];
const atelier=a=>GYM.ateliers.find(x=>x.n===+a);
const niveau=k=>{const a=atelier(k[0]);return a&&a.niv.find(x=>x.n===k[1])};
const fiche=id=>GYM.fiches[id];

/* ---------- Stockage : un carnet chiffré par groupe ---------- */
/* ROOT = {v:1, groupes:{id:{classe,noms,sel,iv,data,vu}}, classes:{classe:{eleves,lien,pin,barres}}} */
function vide(){return {v:VERSION,classe:'',eleves:[],cur:0,tab:'fiche',val:{},envoi:null,cfg:null}}
function charger(){let o=null;try{o=JSON.parse(localStorage.getItem(CLE))}catch(e){}return Object.assign({v:1,groupes:{},classes:{}},o&&o.groupes?o:{})}
let ROOT=charger(),S=null,ACTIF=null,CLEF=null;
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
function ecrireRoot(){try{localStorage.setItem(CLE,JSON.stringify(ROOT))}catch(e){toast('Mémoire pleine : envoyez les fichiers puis supprimez les anciens groupes.')}}
const b64=u=>{let x='';new Uint8Array(u).forEach(c=>x+=String.fromCharCode(c));return btoa(x)};
const deb64=t=>Uint8Array.from(atob(t),c=>c.charCodeAt(0));
async function deriver(code,sel){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode('gym|'+code),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt:sel,iterations:150000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
let tSauve=null;
function sauver(){clearTimeout(tSauve);tSauve=setTimeout(enregistrer,200)}
async function enregistrer(){
  clearTimeout(tSauve);
  if(!S||!ACTIF||!CLEF){ecrireRoot();return}
  const g=ROOT.groupes[ACTIF]||(ROOT.groupes[ACTIF]={});
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},CLEF,new TextEncoder().encode(JSON.stringify(S)));
  Object.assign(g,{classe:S.classe,noms:S.eleves.map(e=>prenom(e.nom)),iv:b64(iv),data:b64(ct),vu:Date.now(),aEnvoyer:aEnvoyer()});
  ecrireRoot();
}
async function ouvrir(id,code){
  const g=ROOT.groupes[id];
  const E=g.essais||{n:0,t:0};
  if(E.t>Date.now())throw new Error('Trop d’essais. Réessayez dans '+Math.ceil((E.t-Date.now())/1000)+' s.');
  const k=await deriver(code,deb64(g.sel));
  let txt;try{txt=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(g.iv)},k,deb64(g.data)))}
  catch(e){E.n++;const att=Math.min(300,30*2**(E.n-5));if(E.n>=5)E.t=Date.now()+att*1000;g.essais=E;ecrireRoot();
    throw new Error(E.n>=5?'Code faux. Trop d’essais : attendez '+(att<60?att+' s':att/60+' min')+'.':'Code faux ('+(5-E.n)+' essai'+(5-E.n>1?'s':'')+' avant attente).')}
  delete g.essais;CLEF=k;S=Object.assign(vide(),JSON.parse(txt));ACTIF=id;
  if(S.classe&&ROOT.classes[S.classe])S.cfg=JSON.parse(JSON.stringify(ROOT.classes[S.classe]));
  S.tab=S.eleves.length?'fiche':'groupe';S.cur=0;NAV=[];
  await enregistrer();
}
async function verrouiller(){await enregistrer();S=null;ACTIF=null;CLEF=null;NAV=[]}
async function nouveauGroupe(classe,code){
  const id=uid(),sel=crypto.getRandomValues(new Uint8Array(16));
  ROOT.groupes[id]={classe:classe||'',noms:[],sel:b64(sel)};
  CLEF=await deriver(code,sel);ACTIF=id;S=vide();
  if(classe&&ROOT.classes[classe]){S.classe=classe;S.cfg=JSON.parse(JSON.stringify(ROOT.classes[classe]))}
  S.tab='groupe';NAV=[];await enregistrer();
}
// Verrouillage automatique : 10 min sans toucher l'écran.
let tInactif=null;
function reveil(){clearTimeout(tInactif);if(S)tInactif=setTimeout(async()=>{if(S){await verrouiller();fermer();rendre();toast('Carnet verrouillé (10 min sans activité).')}},10*60*1000)}
['click','input','touchstart'].forEach(e=>document.addEventListener(e,reveil,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S)enregistrer()});

/* ---------- Code secret du groupe ---------- */
let CODE_CB=null;
function demanderCode(titre,texte,cb,creer){
  CODE_CB={cb,creer,premier:null};
  fen(`<h3>${esc(titre)}</h3><p class="small muted">${esc(texte)}</p>
    <input id="code" class="code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Code à 4 chiffres">
    <p id="code-msg" class="small" style="min-height:1.4em;font-weight:700;color:var(--alerte)"></p>
    <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt noir" type="button" data-act="codeok">Valider</button></div>
    ${creer?'':'<p class="small" style="margin-top:12px"><button class="lien" type="button" data-act="codeoubli">Code oublié ?</button></p>'}`);
  setTimeout(()=>{const i=$('#code');if(i)i.focus()},50);
}
async function validerCode(){
  const i=$('#code'),m=$('#code-msg'),c=(i.value||'').trim(),st=CODE_CB;
  if(!/^\d{4}$/.test(c)){m.textContent='4 chiffres.';return}
  if(st.creer&&!st.premier){st.premier=c;i.value='';m.textContent='Retapez le même code pour confirmer.';i.focus();return}
  if(st.creer&&st.premier!==c){st.premier=null;i.value='';m.textContent='Les deux codes sont différents : recommencez.';return}
  m.textContent='Ouverture…';
  try{await st.cb(c);CODE_CB=null;fermer();rendre();window.scrollTo(0,0)}catch(e){i.value='';m.textContent=e.message||'Erreur';i.focus()}
}

/* ---------- Code du professeur (validation P) ---------- */
// Le code n'est jamais écrit sur la tablette : seule son empreinte arrive par le QR de la classe.
async function empreinte(code){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('gym-prof|'+code));return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('').slice(0,24)}
const pinProf=()=>(S&&S.cfg&&S.cfg.pin)||'';
let PROF_CB=null,PROF_ESSAIS={n:0,t:0};
function demanderProf(titre,cb){
  if(!pinProf()){fen(`<h3>Validation professeur</h3><p>Le code du professeur n’est pas encore réglé sur cette tablette.</p><p class="small muted">Le professeur fait scanner le QR de la classe (outil prof → Classes → QR de démarrage), puis ouvre de nouveau le carnet.</p><div class="rangee"><button class="bt noir" type="button" data-act="fermer">Compris</button></div>`);return}
  PROF_CB=cb;
  fen(`<h3>🔐 ${esc(titre)}</h3><p class="small muted">Réservé au professeur.</p>
    <input id="pin" class="code" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off" aria-label="Code du professeur">
    <p id="pin-msg" class="small" style="min-height:1.4em;font-weight:700;color:var(--alerte)"></p>
    <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt prof" type="button" data-act="pinok">Valider</button></div>`);
  setTimeout(()=>{const i=$('#pin');if(i)i.focus()},50);
}
async function validerPin(){
  const i=$('#pin'),m=$('#pin-msg');
  if(PROF_ESSAIS.t>Date.now()){m.textContent='Attendez '+Math.ceil((PROF_ESSAIS.t-Date.now())/1000)+' s.';return}
  if(await empreinte((i.value||'').trim())!==pinProf()){PROF_ESSAIS.n++;if(PROF_ESSAIS.n>=3)PROF_ESSAIS.t=Date.now()+60000;i.value='';m.textContent='Code faux.';return}
  PROF_ESSAIS={n:0,t:0};const cb=PROF_CB;PROF_CB=null;fermer();cb();
}

/* ---------- Validations ---------- */
// S.val[idEleve]['1C'] = {e:{t,par}, p:{t}, deb:{t}}  (deb = niveau débloqué par le prof)
const elv=()=>S.eleves[S.cur]||S.eleves[0];
const V=(id,k)=>((S.val[id]||{})[k])||null;
const etat=(id,k)=>{const v=V(id,k);return v&&v.p?'p':v&&v.e?'e':''};
function ouvert(id,k){
  const i=NIVS.indexOf(k[1]);if(i<=0)return true;
  const prec=k[0]+NIVS[i-1],v=V(id,prec),me=V(id,k);
  return !!((v&&(v.e||v.p))||(me&&(me.deb||me.e||me.p)));
}
function maj(id,k,f){S.val[id]=S.val[id]||{};const v=S.val[id][k]=S.val[id][k]||{};f(v);if(!v.e&&!v.p&&!v.deb)delete S.val[id][k];S.mod=Date.now();sauver()}
function meilleur(id,a,quoi){let best='';NIVS.forEach(n=>{const s=etat(id,a+n);if(quoi==='p'?s==='p':s)best=n});return best}
function aEnvoyer(){return S&&S.mod&&(!S.envoi||S.mod>S.envoi)}
const barresVisibles=()=>S?!!(S.cfg&&S.cfg.barres):Object.values(ROOT.classes).some(c=>c.barres);

/* ---------- Rendu ---------- */
let NAV=[]; // pile de pages « Apprendre » : {v:'atelier',a} | {v:'niveau',k} | {v:'fiche',id} | {v:'bonus',id} | {v:'info',x}
function rendre(){
  const app=$('#app');
  $('#sous').textContent=S?(S.classe?S.classe+' · ':'')+(S.eleves.map(e=>prenom(e.nom)).join(', ')||'nouveau groupe'):'Lycée Georges Pompidou';
  $('#haut').innerHTML=S?`<button class="bt mini" type="button" data-act="verrou" aria-label="Verrouiller le carnet">🔒 Fermer</button>`:'';
  let h='';
  if(NAV.length)h=vPile();
  else if(!S)h=VUE==='apprendre'?vApprendre():vAccueil();
  else h={fiche:vFiche,apprendre:vApprendre,envoi:vEnvoi,groupe:vGroupe}[S.tab]();
  app.innerHTML=h;
  const T=S?[['fiche','📋','Ma fiche'],['apprendre','🎬','Apprendre'],['envoi','📤','Envoyer'],['groupe','👥','Groupe']]:[['accueil','🏠','Accueil'],['apprendre','🎬','Apprendre']];
  const cur=S?S.tab:VUE;
  $('#onglets').innerHTML=T.map(([k,i,l])=>`<button type="button" class="${cur===k&&!NAV.length?'ici':''}" data-act="onglet" data-v="${k}"><i>${i}</i>${l}${k==='envoi'&&aEnvoyer()?' •':''}</button>`).join('');
  brancherVideos();
}
let VUE='accueil';

function vAccueil(){
  const G=Object.entries(ROOT.groupes).sort((a,b)=>(b[1].vu||0)-(a[1].vu||0));
  return `<h2>Bonjour !</h2>
  <p class="muted">Ouvrez le carnet de votre groupe avec votre code secret.</p>
  ${G.length?G.map(([id,g])=>`<button class="groupe" type="button" data-act="ouvrir" data-v="${id}"><span style="font-size:28px">🔒</span><b>${esc(g.noms&&g.noms.length?g.noms.join(', '):'Groupe sans élève')}<br><span class="small muted">${esc(g.classe||'classe ?')}${g.vu?' · '+dateFr(g.vu):''}${g.aEnvoyer?' · <span style="color:var(--alerte)">à envoyer</span>':''}</span></b><span aria-hidden="true">›</span></button>`).join(''):'<p class="carte small">Aucun groupe sur cette tablette pour l’instant.</p>'}
  <div class="rangee" style="margin-top:14px"><button class="bt act" type="button" data-act="nouveau">＋ Nouveau groupe</button><button class="bt" type="button" data-act="scanclasse">📷 QR de la classe (prof)</button></div>
  <section class="carte" style="margin-top:20px"><h3>🎬 Apprendre sans ouvrir de carnet</h3><p class="small muted">Vidéos, consignes et aides de tous les ateliers.</p><button class="bt" type="button" data-act="onglet" data-v="apprendre">Voir les ateliers</button></section>
  <details class="carte"><summary class="small" style="min-height:44px;font-weight:700">Réglages de la tablette</summary>
    <p class="small muted">Vidéos gardées pour le gymnase sans Wi-Fi : <b id="nb-hl">…</b></p>
    <button class="bt" type="button" data-act="toutcharger">⬇ Garder toutes les vidéos hors ligne (≈ 66 Mo)</button>
    <div class="progres" id="prog" hidden><i></i></div>
    <p class="small muted" style="margin-top:14px">Supprimer un groupe : ouvrez-le, puis Groupe → Supprimer.</p>
  </details>`;
}
function vGroupe(){
  const C=S.cfg;
  return `<h2>Notre groupe</h2>
  <section class="carte"><p class="small muted">${S.classe?'Classe <b>'+esc(S.classe)+'</b>':'Classe non choisie'}${C&&C.eleves&&C.eleves.length?' · liste du professeur reçue':''}</p>
  ${S.eleves.length?S.eleves.map((e,i)=>`<div class="rangee" style="justify-content:space-between;border-top:1px solid var(--trait);padding:8px 0"><b>${esc(e.nom)}</b><button class="bt mini danger" type="button" data-act="retirer" data-v="${i}">Retirer</button></div>`).join(''):'<p>Ajoutez les 2 à 4 élèves du groupe.</p>'}
  ${S.eleves.length<MAX_GROUPE?`<div class="rangee" style="margin-top:10px">${C&&C.eleves&&C.eleves.length?'<button class="bt act" type="button" data-act="choisirnoms">＋ Choisir dans la liste de la classe</button>':''}<button class="bt" type="button" data-act="ajoutnom">＋ Écrire un prénom</button></div>`:''}
  </section>
  <section class="carte"><h3>Classe</h3><p class="small muted">Le QR de la classe (affiché par le professeur) donne la liste des élèves et le code de validation du professeur.</p><button class="bt" type="button" data-act="scanclasse">📷 Scanner le QR de la classe</button></section>
  <section class="carte"><h3>Fin d’année ou erreur</h3><button class="bt danger" type="button" data-act="suppgroupe">Supprimer ce groupe de la tablette</button></section>`;
}
function puces(id,a){return `<div class="etat-at">${NIVS.map(n=>{const s=etat(id,a+n);return `<i class="${s}">${n}</i>`}).join('')}</div>`}
function vFiche(){
  if(!S.eleves.length)return `<h2>Ma fiche</h2><p class="carte">Ajoutez d’abord les élèves du groupe (onglet Groupe).</p>`;
  const E=elv();
  return `<div class="qui">${S.eleves.map((e,i)=>`<button type="button" class="${i===S.cur?'ici':''}" data-act="qui" data-v="${i}">${esc(prenom(e.nom))}</button>`).join('')}</div>
  <h2>Fiche de ${esc(prenom(E.nom))}</h2>
  <p class="small muted">Touchez un niveau pour voir la vidéo, les consignes et le faire valider. <b>E</b> = validé par un camarade · <b>P</b> = validé par le professeur.</p>
  ${GYM.ateliers.map(a=>`<section class="atelier"><header><span class="n">${a.n}</span><b>${esc(a.nom)}</b><span class="small">${(()=>{const p=meilleur(E.id,a.n,'p');return p?'Niveau '+p:''})()}</span></header>
    ${a.niv.map(n=>{const k=a.n+n.n,s=etat(E.id,k),o=ouvert(E.id,k);
      return `<button class="niv ${o?'':'verrou'}" type="button" data-act="niveau" data-v="${k}"><span class="L L${n.n}">${n.n}</span>
      <span><span class="nom">${o?'':'🔒 '}${esc(n.nom)}${n.prof?' <span title="en présence du professeur">⚠️</span>':''}</span><div class="crit">${n.crit.map(esc).join(' · ')}</div>${n.picto?`<img class="picto" src="${n.picto}" alt="" loading="lazy">`:''}</span>
      <span class="ep"><span class="${s?'e v':''}">E</span><span class="${s==='p'?'p':''}">P</span></span></button>`}).join('')}
  </section>`).join('')}`;
}
function vApprendre(){
  const a=GYM.ateliers;
  return `<h2>Apprendre</h2>
  <div class="ateliers">
    <button class="tuile info" type="button" data-act="info" data-v="securite"><span class="num">Avant tout</span><b>🛡️ Sécurité, parade et aide</b></button>
    <button class="tuile info" type="button" data-act="info" data-v="validation"><span class="num">Règle du jeu</span><b>✅ Valider un niveau</b></button>
  </div>
  <h4>Les 6 ateliers</h4>
  <div class="ateliers">${a.map(x=>`<button class="tuile" type="button" data-act="atelier" data-v="${x.n}"><span class="num">Atelier ${x.n}</span><b>${esc(x.nom)}</b>${S&&S.eleves.length?puces(elv().id,x.n):''}</button>`).join('')}</div>
  <h4>Pour aller plus loin</h4>
  <div class="ateliers">${GYM.bonus.filter(b=>!b.cache||barresVisibles()).map(b=>`<button class="tuile bonus" type="button" data-act="bonus" data-v="${b.id}"><b>${esc(b.nom)}</b><span class="small muted">${esc(b.info)}</span></button>`).join('')}</div>`;
}
function vPile(){
  const p=NAV[NAV.length-1];
  const ret=`<button class="retour" type="button" data-act="retour">‹ Retour</button>`;
  if(p.v==='atelier')return ret+vAtelier(p.a);
  if(p.v==='niveau')return ret+vNiveau(p.k);
  if(p.v==='fiche')return ret+`<div class="carte">${blocFiche(p.id,true)}</div>`;
  if(p.v==='bonus')return ret+vBonus(p.id);
  if(p.v==='info')return ret+vInfo(p.x);
  return ret;
}
function vAtelier(n){
  const a=atelier(n),id=S&&S.eleves.length?elv().id:null;
  return `<h2><span class="muted">Atelier ${a.n} ·</span> ${esc(a.nom)}</h2>
  ${n===6?`<div class="carte">${blocTrampo()}</div>`:''}
  <div class="atelier">${a.niv.map(x=>{const k=a.n+x.n,s=id?etat(id,k):'';return `<button class="niv" type="button" data-act="niveau" data-v="${k}"><span class="L L${x.n}">${x.n}</span><span><span class="nom">${esc(x.nom)}${x.prof?' ⚠️':''}</span><div class="crit">${x.crit.map(esc).join(' · ')}</div>${x.picto?`<img class="picto" src="${x.picto}" alt="" loading="lazy">`:''}</span><span class="ep">${id?`<span class="${s?'e v':''}">E</span><span class="${s==='p'?'p':''}">P</span>`:'›'}</span></button>`}).join('')}</div>`;
}
function video(v,id){
  const [src,leg]=v,base=src.replace('.mp4','');
  return `<div class="video"><video controls playsinline preload="none" poster="media/${base}.jpg" src="media/${src}" data-vid="${base}"></video>${leg?`<div class="leg">${esc(leg)}</div>`:''}</div>
  <div class="ralenti" data-pour="${base}"><button type="button" class="ici" data-act="vitesse" data-v="1">Normal</button><button type="button" data-act="vitesse" data-v="0.5">Ralenti ×½</button><button type="button" data-act="vitesse" data-v="0.25">×¼</button><button type="button" data-act="boucle">🔁 En boucle</button></div>`;
}
function blocFiche(id,titre){
  const f=fiche(id);if(!f)return '';
  return `${titre?`<h3>${esc(f.t)}</h3>`:''}
  ${f.vid.map(v=>video(v,id)).join('')}
  ${f.cons.length?`<h4>Consignes</h4><ol class="cons">${f.cons.map(c=>`<li>${esc(c)}</li>`).join('')}</ol>`:''}
  ${f.mat.length?`<h4>Matériel</h4><div class="mat">${f.mat.map(c=>`<span>${esc(c)}</span>`).join('')}</div>`:''}
  ${f.img.length?`<div class="imgs">${f.img.map(i=>`<img src="img/${i}" alt="" loading="lazy">`).join('')}</div>`:''}`;
}
function blocTrampo(){const t=GYM.trampo;return `<h3>Trampoline : les bases</h3><h4>Consignes</h4><ol class="cons">${t.cons.map(c=>`<li>${esc(c)}</li>`).join('')}</ol><h4>Matériel</h4><div class="mat">${t.mat.map(c=>`<span>${esc(c)}</span>`).join('')}</div><div class="imgs">${t.img.map(i=>`<img src="img/${i}" alt="" loading="lazy">`).join('')}</div>`}
function carteRem(id,i){const f=fiche(id),v=f.vid[0];return `<button class="rem" type="button" data-act="fiche" data-v="${id}">${v?`<img src="media/${v[0].replace('.mp4','.jpg')}" alt="" loading="lazy">`:'<span style="width:96px;text-align:center;font-size:28px">📄</span>'}<span><b>${typeof i==='number'?'Aide '+(i+1)+' · ':''}${esc(f.t)}</b>${f.cons[0]?`<br><span class="small muted">${esc(f.cons[0])}</span>`:''}</span></button>`}
function vNiveau(k){
  const a=atelier(k[0]),n=niveau(k);
  let h=`<h2><span class="L L${n.n}" style="vertical-align:4px">${n.n}</span> ${esc(n.nom)}</h2><p class="muted small" style="margin-top:-2px">Atelier ${a.n} · ${esc(a.nom)}</p>`;
  if(n.prof)h+=`<div class="alerte">⚠️ Seulement en présence du professeur, avec la parade en place.</div>`;
  h+=`<div class="critbox"><b>Critères de réussite</b><ul>${n.crit.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>${n.picto?`<img src="${n.picto}" alt="" style="max-height:80px">`:''}</div>`;
  h+=S&&S.eleves.length?blocValid(k):'';
  if(n.f.length)h+=n.f.map(id=>`<div class="carte">${blocFiche(id,n.f.length>1||fiche(id).t!==n.nom)}</div>`).join('');
  else if(+k[0]===6)h+=`<div class="carte">${blocTrampo()}</div>`;
  else h+=`<p class="carte small muted">Pas de vidéo pour ce niveau : regardez le pictogramme et les critères.</p>`;
  if(n.r.length)h+=`<h4>Je n’y arrive pas encore ? Essaie d’abord :</h4><div class="remlist">${n.r.map((id,i)=>carteRem(id,i)).join('')}</div>`;
  return h;
}
function blocValid(k){
  const E=elv(),v=V(E.id,k)||{},o=ouvert(E.id,k),n=niveau(k);
  const autres=S.eleves.filter(x=>x.id!==E.id);
  if(v.p)return `<div class="valid"><span class="tampon p">✅ P · validé par le professeur le ${dateFr(v.p.t)}</span>${v.e?`<p class="small muted">E par ${esc(prenom(v.e.par))} le ${dateFr(v.e.t)}</p>`:''}<div class="rangee" style="margin-top:8px"><button class="bt mini" type="button" data-act="annulerP" data-v="${k}">Retirer P (professeur)</button></div></div>`;
  if(!o)return `<div class="valid"><p><b>🔒 Niveau fermé pour ${esc(prenom(E.nom))}</b> : il faut d’abord valider le niveau ${NIVS[NIVS.indexOf(k[1])-1]} (E).</p><p class="small muted">Tu peux regarder la vidéo, mais on ne travaille pas un niveau au-dessus sans avoir validé le précédent.</p><button class="bt mini" type="button" data-act="debloquer" data-v="${k}">Le professeur ouvre ce niveau</button></div>`;
  if(v.e)return `<div class="valid"><span class="tampon e">E · validé par ${esc(prenom(v.e.par))} le ${dateFr(v.e.t)}</span><p class="small">Montre-le au professeur pour la validation <b>P</b>.</p><div class="rangee"><button class="bt prof" type="button" data-act="valP" data-v="${k}">🔐 Validation P (professeur)</button><button class="bt mini" type="button" data-act="annulerE" data-v="${k}">Annuler E</button></div></div>`;
  return `<div class="valid"><h3>Co-évaluation (E) de ${esc(prenom(E.nom))}</h3>
    ${autres.length?`<p class="small"><b>Qui observe ?</b></p><div class="qui">${autres.map(x=>`<button type="button" class="${OBS===x.id?'ici':''}" data-act="obs" data-v="${x.id}">${esc(prenom(x.nom))}</button>`).join('')}</div>`:'<p class="small muted">Seul dans le groupe : la validation se fait avec le professeur.</p>'}
    ${n.crit.map((c,i)=>`<label class="coche"><input type="checkbox" data-cr="${i}"> ${esc(c)}</label>`).join('')}
    <label class="coche"><input type="checkbox" data-cr="r1"> Réussi du premier coup</label>
    <label class="coche"><input type="checkbox" data-cr="r2"> Réception maîtrisée</label>
    <div class="rangee" style="margin-top:12px"><button class="bt ok" type="button" data-act="valE" data-v="${k}">✔ Valider E</button><button class="bt prof" type="button" data-act="valP" data-v="${k}">🔐 Directement P</button></div>
    <p class="small muted">« Simple et correct vaut mieux que difficile et incorrect »</p></div>`;
}
let OBS=null;
function vBonus(id){
  const b=GYM.bonus.find(x=>x.id===id);
  let h=`<h2>${esc(b.nom)}</h2><p class="muted">${esc(b.info)}</p>`;
  if(id==='liaisons')return h+`<div class="remlist">${b.f.map(i=>carteRem(i)).join('')}</div>`;
  // Flip et barres : regroupés par niveau
  const par={};b.f.forEach(i=>{const n=fiche(i).niv||'?';(par[n]=par[n]||[]).push(i)});
  return h+Object.keys(par).sort().map(n=>`<h4><span class="L L${n}" style="width:34px;height:34px;font-size:20px;vertical-align:middle">${n}</span> Niveau ${n}</h4><div class="remlist">${par[n].map(i=>fiche(i).rem?carteRem(i,null):`<div class="carte">${blocFiche(i,true)}</div>`).join('')}</div>`).join('');
}
function vInfo(x){
  if(x==='securite'){const s=GYM.securite;return `<h2>🛡️ Sécurité</h2>
    <section class="carte"><h3>À chaque passage</h3><ul>${s.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul></section>
    <section class="carte"><h3>Parade et aide</h3><p>${esc(s.parade)}</p><p>${esc(s.aide)}</p><h4>Bien parer</h4><ul>${s.crit.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>${s.img.map(i=>`<img src="img/${i}" alt="" style="max-height:140px">`).join('')}</section>
    <div class="alerte">${s.interdit.map(esc).join('<br>')}</div>`}
  const v=GYM.validation;
  return `<h2>✅ Valider un niveau</h2><section class="carte"><h3>Un niveau est validé si…</h3><ul>${v.regles.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><p>${esc(v.qui)}</p><p><b>${esc(v.devise)}</b></p></section>
  <section class="carte"><h3>Dans l’appli</h3><ol class="cons"><li>Je touche le niveau que je travaille (il s’ouvre quand le précédent est validé).</li><li>Je regarde la vidéo et les consignes. Si je n’y arrive pas, j’essaie les exercices plus faciles proposés en bas.</li><li>Un camarade m’observe et coche les critères : <b>E</b>.</li><li>Je le montre au professeur, qui tape son code : <b>P</b>.</li></ol></section>
  <section class="carte"><h3>La fiche papier</h3><img src="img/i11.png" alt="Fiche papier de co-évaluation" style="max-height:420px"></section>`;
}

/* ---------- Envoi au professeur ---------- */
// Une ligne par élève : 6 ateliers × 6 niveaux, '0' rien, 'e' validé E, 'p' validé P, 'd' débloqué par le prof
function chaine(id){return GYM.ateliers.map(a=>NIVS.map(n=>{const v=V(id,a.n+n);return v&&v.p?'p':v&&v.e?'e':v&&v.deb?'d':'0'}).join('')).join('')}
function objetEnvoi(){
  return {a:'GYM',v:1,t:'G',c:S.classe||'',g:ACTIF,ts:Math.round(Date.now()/1000),
    el:S.eleves.map(e=>({n:e.nom,s:chaine(e.id),d:Object.fromEntries(Object.entries(S.val[e.id]||{}).map(([k,v])=>[k,[v.e?Math.round(v.e.t/1000):0,v.e?prenom(v.e.par):'',v.p?Math.round(v.p.t/1000):0]]))}))};
}
function vEnvoi(){
  return `<h2>Envoyer au professeur</h2>
  <p class="muted">À la fin du cours, envoyez la fiche du groupe : par QR code (le professeur le scanne) ou par fichier dans le Nuage.</p>
  ${aEnvoyer()?'<p class="alerte">Des validations n’ont pas encore été envoyées.</p>':S.envoi?`<p class="tampon p">Envoyé le ${dateFr(S.envoi)}</p>`:''}
  <div class="rangee"><button class="bt act" type="button" data-act="qr">▦ Montrer le QR code</button><button class="bt" type="button" data-act="fichier">📄 Enregistrer le fichier</button>
  ${S.cfg&&S.cfg.lien?`<a class="bt" href="${esc(S.cfg.lien)}" target="_blank" rel="noopener">☁️ Ouvrir le dépôt Nuage</a>`:''}</div>
  <section class="carte" style="margin-top:16px"><h3>Résumé</h3>${S.eleves.map(e=>`<div style="border-top:1px solid var(--trait);padding:8px 0"><b>${esc(e.nom)}</b>${GYM.ateliers.map(a=>`<div class="rangee small" style="gap:6px"><span style="min-width:150px">${a.n}. ${esc(a.court)}</span>${puces(e.id,a.n)}</div>`).join('')}</div>`).join('')}</section>`;
}
async function montrerQR(){
  const txt=await GQR.encoder(objetEnvoi());let svg;
  try{svg=GQR.svgQR(txt)}catch(e){svg='<p class="alerte">Trop de données pour un QR : utilisez le fichier.</p>'}
  fen(`<h3>Fiche du groupe · ${esc(S.classe||'')}</h3><p class="small muted">Outil prof → « Scanner les QR ».</p><div class="qrbox">${svg}</div><div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Fermer</button><button class="bt act" type="button" data-act="qrfait">C’est scanné ✔</button></div>`);
}
function nomFichier(){const sl=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');return `gym_${sl(S.classe)||'classe'}_${S.eleves.map(e=>sl(prenom(e.nom))).join('-')}_${today()}.json`}
async function enregistrerFichier(){
  const nom=nomFichier(),txt=JSON.stringify(objetEnvoi(),null,1),file=new File([txt],nom,{type:'application/json'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Gym · fiche du groupe'});return marquerEnvoye()}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  marquerEnvoye();
}
function marquerEnvoye(){S.envoi=Date.now();sauver();rendre();toast('Fiche envoyée.')}

/* ---------- QR de la classe (donné par le prof) ---------- */
function recevoirClasse(o){
  if(o.t!=='C')throw new Error('Ce n’est pas le QR de la classe.');
  const cfg={classe:o.c,eleves:o.l||[],lien:o.u||'',pin:o.k||'',barres:!!o.b};
  ROOT.classes[o.c]=cfg;ecrireRoot();
  if(S&&(!S.classe||S.classe===o.c)){S.classe=o.c;S.cfg=JSON.parse(JSON.stringify(cfg));sauver()}
  rendre();
  return 'Classe '+o.c+' : '+(o.l||[]).length+' élèves.';
}

/* ---------- Vidéos ---------- */
function brancherVideos(){document.querySelectorAll('video[data-vid]').forEach(v=>{v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause()}))})}
async function toutCharger(){
  const L=[...new Set(Object.values(GYM.fiches).flatMap(f=>f.vid.map(v=>'media/'+v[0])))];
  const p=$('#prog');if(p)p.hidden=false;let n=0,err=0;
  for(const u of L){try{const r=await fetch(u);if(!r.ok)err++;else await r.arrayBuffer()}catch(e){err++}n++;if(p)p.firstChild.style.width=Math.round(100*n/L.length)+'%'}
  toast(err?err+' vidéo(s) non téléchargée(s) : réessayez avec le Wi-Fi.':'Toutes les vidéos sont sur la tablette.');compterHL();
}
async function compterHL(){const el=$('#nb-hl');if(!el)return;try{const ks=await caches.keys(),k=ks.find(x=>/^gym-eleves-media-v\d+$/.test(x));if(!k){el.textContent='0';return}const c=await caches.open(k),n=(await c.keys()).length;el.textContent=n+' / '+new Set(Object.values(GYM.fiches).flatMap(f=>f.vid.map(v=>v[0]))).size}catch(e){el.textContent='?'}}

/* ---------- Fenêtres ---------- */
function fen(html){$('#modal').innerHTML=`<div class="voile" data-act="fermerVoile"><div class="fen" role="dialog" aria-modal="true">${html}</div></div>`}
function fermer(){$('#modal').innerHTML=''}
let toastT;function toast(t){clearTimeout(toastT);let d=$('.toast');if(!d){d=document.createElement('div');d.className='toast';document.body.appendChild(d)}d.textContent=t;toastT=setTimeout(()=>d.remove(),2800)}
function aller(p){NAV.push(p);rendre();window.scrollTo(0,0)}

/* ---------- Évènements ---------- */
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;
  const act=b.dataset.act,v=b.dataset.v;
  if(act==='fermerVoile'){if(ev.target===b)fermer();return}
  switch(act){
    case 'fermer':fermer();break;
    case 'onglet':NAV=[];if(S)S.tab=v;else VUE=v;rendre();window.scrollTo(0,0);if(v==='accueil')compterHL();break;
    case 'retour':NAV.pop();rendre();break;
    case 'ouvrir':demanderCode('Carnet de '+(ROOT.groupes[v].noms||[]).join(', '),'Code secret du groupe (4 chiffres).',c=>ouvrir(v,c));break;
    case 'nouveau':{
      const C=Object.keys(ROOT.classes).sort();
      fen(`<h3>Nouveau groupe</h3><p class="small muted">Choisissez votre classe (elle apparaît quand le professeur a fait scanner son QR).</p>
      ${C.length?`<select id="nv-cl">${C.map(c=>`<option>${esc(c)}</option>`).join('')}<option value="">Autre / pas de liste</option></select>`:'<p class="small">Aucune classe reçue : vous écrirez vos prénoms à la main.</p>'}
      <div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt act" type="button" data-act="nvsuite">Choisir notre code</button></div>`);break}
    case 'nvsuite':{const s=$('#nv-cl'),cl=s?s.value:'';demanderCode('Code secret du groupe','Choisissez 4 chiffres et retenez-les : ils seront demandés à chaque cours. Un autre groupe ne pourra pas ouvrir votre carnet.',c=>nouveauGroupe(cl,c),true);break}
    case 'codeok':validerCode();break;
    case 'codeoubli':fen(`<h3>Code oublié</h3><p>Le carnet est chiffré : sans le code, personne ne peut l’ouvrir, même le professeur.</p><p class="small muted">Le professeur a reçu vos validations envoyées (QR ou fichier). Créez un nouveau groupe ; le professeur peut vous redonner vos niveaux P en débloquant les niveaux.</p><div class="rangee"><button class="bt noir" type="button" data-act="fermer">Compris</button></div>`);break;
    case 'verrou':await verrouiller();fermer();VUE='accueil';rendre();break;
    case 'scanclasse':GQR.scanner(async t=>recevoirClasse(await GQR.decoder(t)),{titre:'QR de la classe',aide:'Visez le QR affiché par le professeur.'});break;
    case 'choisirnoms':{
      const pris=new Set(Object.values(ROOT.groupes).filter(g=>g.classe===S.classe).flatMap(g=>g.noms||[]));
      const deja=new Set(S.eleves.map(e=>e.nom));
      fen(`<h3>Qui est dans le groupe ?</h3><p class="small muted">Cochez 2 à ${MAX_GROUPE} élèves.</p><div class="liste-el">${S.cfg.eleves.filter(n=>!deja.has(n)).map(n=>`<label><input type="checkbox" value="${esc(n)}"> ${esc(n)}${pris.has(prenom(n))?' <span class="small muted">(autre groupe ?)</span>':''}</label>`).join('')}</div>
      <div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt act" type="button" data-act="noms-ok">Ajouter</button></div>`);break}
    case 'noms-ok':{const L=[...document.querySelectorAll('.liste-el input:checked')].map(i=>i.value);
      L.slice(0,MAX_GROUPE-S.eleves.length).forEach(n=>{const id=uid();S.eleves.push({id,nom:n})});fermer();sauver();rendre();break}
    case 'ajoutnom':fen(`<h3>Ajouter un élève</h3><input id="nv-nom" type="text" placeholder="Prénom et initiale du nom" autocomplete="off"><div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt act" type="button" data-act="nom-ok">Ajouter</button></div>`);setTimeout(()=>$('#nv-nom').focus(),50);break;
    case 'nom-ok':{const n=($('#nv-nom').value||'').trim();if(!n)return;S.eleves.push({id:uid(),nom:n});fermer();sauver();rendre();break}
    case 'retirer':{const e=S.eleves[+v];fen(`<h3>Retirer ${esc(e.nom)} ?</h3><p class="small">Ses validations sur cette tablette seront effacées (celles déjà envoyées restent chez le professeur).</p><div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt danger" type="button" data-act="retirer-ok" data-v="${v}">Retirer</button></div>`);break}
    case 'retirer-ok':{const e=S.eleves.splice(+v,1)[0];delete S.val[e.id];S.cur=0;fermer();sauver();rendre();break}
    case 'suppgroupe':fen(`<h3>Supprimer ce groupe ?</h3><p class="small">Pensez à envoyer la fiche au professeur avant.</p><div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt danger" type="button" data-act="supp-ok">Supprimer</button></div>`);break;
    case 'supp-ok':delete ROOT.groupes[ACTIF];S=null;ACTIF=null;CLEF=null;ecrireRoot();fermer();VUE='accueil';rendre();break;
    case 'qui':S.cur=+v;OBS=null;sauver();rendre();break;
    case 'atelier':aller({v:'atelier',a:+v});break;
    case 'niveau':OBS=null;aller({v:'niveau',k:v});break;
    case 'fiche':aller({v:'fiche',id:v});break;
    case 'bonus':aller({v:'bonus',id:v});break;
    case 'info':aller({v:'info',x:v});break;
    case 'obs':OBS=v;document.querySelectorAll('[data-act="obs"]').forEach(x=>x.classList.toggle('ici',x.dataset.v===v));break;
    case 'valE':{
      const coches=[...document.querySelectorAll('[data-cr]')];
      if(coches.some(c=>!c.checked)){toast('Toutes les cases doivent être cochées : sinon, on recommence !');return}
      const autres=S.eleves.filter(x=>x.id!==elv().id);
      if(autres.length&&!OBS){toast('Choisissez qui a observé.');return}
      const obs=S.eleves.find(x=>x.id===OBS);
      maj(elv().id,v,x=>{x.e={t:Date.now(),par:obs?obs.nom:'?'}});toast('Niveau '+v[1]+' validé E. Le niveau suivant est ouvert.');rendre();break}
    case 'valP':{const k=v;demanderProf('Validation P · niveau '+k[1],()=>{maj(elv().id,k,x=>{x.p={t:Date.now()};if(!x.e)x.e={t:Date.now(),par:'professeur'}});toast('Validé P ✔');rendre()});break}
    case 'annulerE':maj(elv().id,v,x=>{delete x.e});rendre();break;
    case 'annulerP':{const k=v;demanderProf('Retirer la validation P',()=>{maj(elv().id,k,x=>{delete x.p});rendre()});break}
    case 'debloquer':{const k=v;demanderProf('Ouvrir le niveau '+k[1],()=>{maj(elv().id,k,x=>{x.deb={t:Date.now()}});rendre()});break}
    case 'pinok':validerPin();break;
    case 'qr':montrerQR();break;
    case 'qrfait':fermer();marquerEnvoye();break;
    case 'fichier':enregistrerFichier();break;
    case 'toutcharger':b.disabled=true;await toutCharger();b.disabled=false;break;
    case 'vitesse':case 'boucle':{const bar=b.closest('.ralenti'),vid=document.querySelector(`video[data-vid="${bar.dataset.pour}"]`);if(!vid)return;
      if(act==='boucle'){vid.loop=!vid.loop;b.classList.toggle('ici',vid.loop)}
      else{vid.playbackRate=+v;vid.defaultPlaybackRate=+v;bar.querySelectorAll('[data-act="vitesse"]').forEach(x=>x.classList.toggle('ici',x===b));if(vid.paused)vid.play().catch(()=>{})}
      break}
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){if($('#code'))validerCode();else if($('#pin'))validerPin()}});
rendre();compterHL();
