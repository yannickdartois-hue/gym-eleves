/* =====================================================================
   plus.js — compléments de l'appli élève (chargé après app.js)
   1. Validations du professeur reçues par le QR de la classe : les P
      donnés dans l'outil prof reviennent sur la tablette, et un groupe
      qui a perdu son carnet (code oublié) retrouve ses niveaux.
   2. Objectif du jour : chaque élève choisit le niveau qu'il travaille.
   3. Me filmer et me comparer : la vidéo de l'élève à côté de la vidéo
      modèle, au ralenti. Rien n'est enregistré : la vidéo disparaît en
      quittant la page.
   4. Mon enchaînement : éléments validés + éléments de liaison, dans
      l'ordre choisi par l'élève.
   ===================================================================== */
'use strict';

/* ---------- 1. Validations du professeur ---------- */
// cfg.pv = {nom: chaîne de 36 caractères '0'|'e'|'p'|'d'} ; cfg.pts = date du QR (s)
function fusionProf(){
  if(!S||!S.cfg||!S.cfg.pv)return 0;
  const t=(S.cfg.pts||Math.round(Date.now()/1000))*1000;let n=0;
  S.eleves.forEach(E=>{
    const ch=S.cfg.pv[E.nom];if(!ch)return;
    GYM.ateliers.forEach((a,ia)=>NIVS.forEach((nv,j)=>{
      const c=ch[ia*6+j],k=a.n+nv,v=V(E.id,k)||{};
      if(c==='p'&&!v.p){maj(E.id,k,x=>{x.p={t};if(!x.e)x.e={t,par:'professeur'}});n++}
      else if(c==='e'&&!v.e&&!v.p){maj(E.id,k,x=>{x.e={t,par:'récupéré'}});n++}
      else if(c==='d'&&!v.deb&&!v.e&&!v.p){maj(E.id,k,x=>{x.deb={t}});n++}
    }));
  });
  return n;
}
{
  const _rc=recevoirClasse;
  recevoirClasse=function(o){
    let m=_rc(o);
    const C=ROOT.classes[o.c];C.pv=o.pv||{};C.pts=o.ts||Math.round(Date.now()/1000);ecrireRoot();
    if(S&&S.classe===o.c){S.cfg=JSON.parse(JSON.stringify(C));const n=fusionProf();if(n)m+=' · '+n+' validation'+(n>1?'s':'')+' du professeur ajoutée'+(n>1?'s':'');sauver();rendre()}
    return m;
  };
  const _ouvrir=ouvrir;
  ouvrir=async function(id,code){await _ouvrir(id,code);const n=fusionProf();if(n){await enregistrer();setTimeout(()=>toast(n+' validation'+(n>1?'s':'')+' du professeur ajoutée'+(n>1?'s':'')+'.'),300)}};
}

/* ---------- 2. Objectif du jour ---------- */
const objectif=id=>{const o=(S.obj||{})[id];return o&&o.d===today()?o.k:''};
function bandeauObjectif(){
  const E=elv(),k=objectif(E.id);
  if(!k)return `<p class="objectif vide">🎯 Pas encore d’objectif aujourd’hui : ouvre le niveau que tu travailles et touche « Mon objectif du jour ».</p>`;
  const a=atelier(k[0]),n=niveau(k);
  return `<button type="button" class="objectif" ${st(a.n)} data-act="niveau" data-v="${k}"><span>🎯 Objectif du jour</span><b><span class="L L${n.n}" style="width:34px;height:34px;font-size:20px">${n.n}</span> ${esc(n.nom)}</b><span class="small">Atelier ${a.n} · ${esc(a.court)} ›</span></button>`;
}

/* ---------- 3. Me filmer et me comparer ---------- */
let FILM=null; // {k, url}
function oublierFilm(){if(FILM){URL.revokeObjectURL(FILM.url);FILM=null}}
function blocFilm(k){
  const n=niveau(k),f=n.f.map(fiche).find(x=>x&&x.vid.length),mod=f?f.vid[0][0]:'';
  let h=`<section class="carte filmer"><h3>🎥 Me filmer et me comparer</h3>`;
  if(FILM&&FILM.k===k){
    h+=`<div class="duo">${mod?`<figure><figcaption>Modèle</figcaption><video playsinline muted src="media/${mod}" poster="media/${mod.replace('.mp4','.jpg')}" data-duo="m"></video></figure>`:''}<figure><figcaption>Moi</figcaption><video playsinline muted src="${FILM.url}" data-duo="moi"></video></figure></div>
      <div class="rangee" style="margin-top:8px"><button class="bt act" type="button" data-act="duo-jouer">▶ Lancer ${mod?'les deux':''}</button><button class="bt mini" type="button" data-act="duo-vit" data-v="1">×1</button><button class="bt mini" type="button" data-act="duo-vit" data-v="0.5">×½</button><button class="bt mini" type="button" data-act="duo-vit" data-v="0.25">×¼</button><button class="bt mini danger" type="button" data-act="duo-oubli">Effacer ma vidéo</button></div>
      <p class="small muted">Ta vidéo n’est pas enregistrée : elle disparaît quand tu quittes cette page.</p>`;
  }else{
    h+=`<p class="small muted">Un camarade te filme avec la tablette, puis tu compares avec la vidéo modèle, au ralenti. La vidéo n’est pas gardée.</p>
      <label class="bt act">📹 Filmer mon passage<input type="file" accept="video/*" capture="environment" data-film="${k}" hidden></label>`;
  }
  return h+`</section>`;
}

/* ---------- 4. Mon enchaînement ---------- */
// S.ench[idEleve] = ['3C', 'L117', …] (niveau d'atelier ou élément de liaison)
const LIAISONS=()=>(GYM.bonus.find(b=>b.id==='liaisons')||{f:[]}).f;
function nomPiece(p){if(p[0]==='L'){const f=fiche(p.slice(1));return f?'Liaison · '+f.t:'?'}const n=niveau(p);return n?n.nom:'?'}
function vEnch(){
  const E=elv(),L=(S.ench||{})[E.id]||[];
  const valides=[];GYM.ateliers.forEach(a=>a.niv.forEach(n=>{if(etat(E.id,a.n+n.n))valides.push(a.n+n.n)}));
  return `<h2>🧩 Enchaînement de ${esc(prenom(E.nom))}</h2>
  <p class="small muted">Assemble les éléments que tu as validés (E ou P) et relie-les avec des éléments de liaison. Touche ↑ ↓ pour changer l’ordre.</p>
  <ol class="ench">${L.map((p,i)=>`<li ${p[0]==='L'?st('liaisons'):st(p[0])}><span class="n">${i+1}</span><span class="nm">${p[0]==='L'?'':`<span class="L L${p[1]}" style="width:30px;height:30px;font-size:18px">${p[1]}</span> `}${esc(nomPiece(p))}</span>
    <button type="button" class="bt mini" data-act="en-mv" data-v="${i}" data-d="-1" ${i?'':'disabled'} aria-label="Monter">↑</button><button type="button" class="bt mini" data-act="en-mv" data-v="${i}" data-d="1" ${i<L.length-1?'':'disabled'} aria-label="Descendre">↓</button><button type="button" class="bt mini danger" data-act="en-sup" data-v="${i}" aria-label="Retirer">✕</button></li>`).join('')||'<p class="carte small">Ton enchaînement est vide.</p>'}</ol>
  <section class="carte"><h3>Ajouter</h3>
   <label class="small"><b>Un élément validé</b></label>
   <div class="rangee"><select id="en-el">${valides.length?valides.map(k=>`<option value="${k}">${k[1]} · ${esc(niveau(k).nom)} (atelier ${k[0]})</option>`).join(''):'<option value="">Aucun élément validé pour l’instant</option>'}</select><button class="bt act" type="button" data-act="en-aj" data-v="en-el" ${valides.length?'':'disabled'}>Ajouter</button></div>
   <label class="small" style="display:block;margin-top:10px"><b>Un élément de liaison</b></label>
   <div class="rangee"><select id="en-li">${LIAISONS().map(i=>`<option value="L${i}">${esc(fiche(i).t)}</option>`).join('')}</select><button class="bt" type="button" data-act="en-aj" data-v="en-li">Ajouter</button></div>
  </section>`;
}

/* ---------- Branchements dans l'affichage existant ---------- */
{
  const _vFiche=vFiche;
  vFiche=function(){
    const h=_vFiche();if(!S.eleves.length)return h;
    const E=elv(),nb=((S.ench||{})[E.id]||[]).length;
    return h.replace(/(<h2>Fiche de [^<]*<\/h2>)/,`$1${bandeauObjectif()}<button type="button" class="bt mini" data-act="ench" style="margin:4px 0 8px">🧩 Mon enchaînement${nb?' ('+nb+' éléments)':''}</button>`);
  };
  const _vNiveau=vNiveau;
  vNiveau=function(k){
    let h=_vNiveau(k);
    if(!S||!S.eleves.length)return h;
    const E=elv(),moi=objectif(E.id)===k;
    const bt=`<div class="rangee" style="margin:6px 0"><button type="button" class="bt mini ${moi?'act':''}" data-act="obj" data-v="${k}">🎯 ${moi?'Mon objectif du jour ✔':'Mon objectif du jour'}</button><span class="small muted">pour ${esc(prenom(E.nom))}</span></div>`;
    h=h.replace('<div class="critbox">',bt+'<div class="critbox">');
    const i=h.indexOf('<h4>Je n’y arrive pas encore');
    return i>0?h.slice(0,i)+blocFilm(k)+h.slice(i):h+blocFilm(k);
  };
  const _vPile=vPile;
  vPile=function(){
    const p=NAV[NAV.length-1];
    if(FILM&&!(p&&p.v==='niveau'&&p.k===FILM.k))oublierFilm();
    if(p&&p.v==='ench')return `<button class="retour" type="button" data-act="retour">‹ Retour</button>`+vEnch();
    return _vPile();
  };
  const _rendre=rendre;
  rendre=function(){if(FILM&&!NAV.length)oublierFilm();_rendre()};
  const _objetEnvoi=objetEnvoi;
  objetEnvoi=function(){
    const o=_objetEnvoi();
    o.el.forEach((x,i)=>{const E=S.eleves[i];const ob=objectif(E.id);if(ob)x.o=ob;const en=(S.ench||{})[E.id];if(en&&en.length)x.en=en});
    return o;
  };
}

/* ---------- Évènements ---------- */
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b||!S)return;const v=b.dataset.v;
  switch(b.dataset.act){
    case 'noms-ok':{const n=fusionProf();if(n){sauver();rendre();toast(n+' validation'+(n>1?'s':'')+' retrouvée'+(n>1?'s':'')+' grâce au professeur.')}break}
    case 'obj':{const E=elv();S.obj=S.obj||{};if(objectif(E.id)===v)delete S.obj[E.id];else S.obj[E.id]={k:v,d:today()};S.mod=Date.now();sauver();rendre();break}
    case 'ench':aller({v:'ench'});break;
    case 'en-aj':{const s=document.getElementById(v);if(!s||!s.value)return;const E=elv();S.ench=S.ench||{};(S.ench[E.id]=S.ench[E.id]||[]).push(s.value);S.mod=Date.now();sauver();rendre();break}
    case 'en-mv':{const L=S.ench[elv().id],i=+v,j=i+(+b.dataset.d);[L[i],L[j]]=[L[j],L[i]];S.mod=Date.now();sauver();rendre();break}
    case 'en-sup':{S.ench[elv().id].splice(+v,1);S.mod=Date.now();sauver();rendre();break}
    case 'duo-jouer':{const V2=[...document.querySelectorAll('.duo video')];V2.forEach(x=>{x.currentTime=0});V2.forEach(x=>x.play().catch(()=>{}));break}
    case 'duo-vit':document.querySelectorAll('.duo video').forEach(x=>{x.playbackRate=+v;x.defaultPlaybackRate=+v});document.querySelectorAll('[data-act="duo-vit"]').forEach(x=>x.classList.toggle('act',x===b));break;
    case 'duo-oubli':oublierFilm();rendre();break;
  }
});
document.addEventListener('change',ev=>{
  const t=ev.target;if(!t.dataset||!t.dataset.film||!t.files||!t.files[0])return;
  oublierFilm();FILM={k:t.dataset.film,url:URL.createObjectURL(t.files[0])};
  const y=window.scrollY;rendre();window.scrollTo(0,y);
  const z=document.querySelector('.filmer');if(z)z.scrollIntoView({behavior:'smooth',block:'start'});
});
