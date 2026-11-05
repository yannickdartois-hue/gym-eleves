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
  return `<h2>🧩 Enchaînement de ${esc(court(E.nom))}</h2>
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
    const bt=`<div class="rangee" style="margin:6px 0"><button type="button" class="bt mini ${moi?'act':''}" data-act="obj" data-v="${k}">🎯 ${moi?'Mon objectif du jour ✔':'Mon objectif du jour'}</button><span class="small muted">pour ${esc(court(E.nom))}</span></div>`;
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

/* =====================================================================
   5. Critère raté → aide ciblée (« Pas encore réussi »)
   6. Quiz sécurité avant les niveaux « présence du professeur »
   7. Lecture audio des consignes (voix de la tablette, sans réseau)
   8. Rotation des ateliers (QR de rotation du professeur)
   ===================================================================== */
const ETIQ_CR=n=>[n.crit[0],n.crit[1],'Réussi du premier coup','Réception maîtrisée'];
// S.rate[idEleve][k] = [nb échecs critère 1, critère 2, premier coup, réception]
function noterRate(k){
  const E=elv(),n=niveau(k),cases=[...document.querySelectorAll('[data-cr]')];
  const rates=cases.map((c,i)=>c.checked?0:1);
  if(!rates.some(Boolean)){toast('Décochez le ou les critères ratés.');return}
  S.rate=S.rate||{};const R=(S.rate[E.id]=S.rate[E.id]||{});const L=(R[k]=R[k]||[0,0,0,0]);rates.forEach((x,i)=>L[i]+=x);
  S.mod=Date.now();sauver();
  const rat=ETIQ_CR(n).filter((_,i)=>rates[i]);
  const aides=[...(n.f.flatMap(id=>(fiche(id).q||[]))),...n.r].filter((x,i,a)=>fiche(x)&&a.indexOf(x)===i).slice(0,3);
  fen(`<h3>Pas encore… on progresse !</h3><p>Raté : <b>${rat.map(esc).join(' · ')}</b></p>
   ${aides.length?`<p class="small">Pour travailler ce point, essaie d’abord :</p><div class="remlist">${aides.map((id,i)=>`<button class="rem" type="button" data-act="aide-ciblee" data-v="${id}"><img src="media/${(fiche(id).vid[0]||['v1.mp4'])[0].replace('.mp4','.jpg')}" alt=""><span><b>${esc(fiche(id).t)}</b>${fiche(id).cons[0]?`<br><span class="small muted">${esc(fiche(id).cons[0])}</span>`:''}</span></button>`).join('')}</div>`:'<p class="small">Regarde de nouveau la vidéo au ralenti, puis recommence.</p>'}
   <div class="rangee" style="margin-top:12px;justify-content:flex-end"><button class="bt noir" type="button" data-act="fermer">Je recommence</button></div>`);
}

/* ---------- Quiz sécurité ---------- */
const QUIZ=[
  {q:'Combien d’élèves passent en même temps sur un atelier ?',r:['Un seul','Deux, pour aller plus vite','Tout le groupe'],b:0},
  {q:'Avant chaque passage, le groupe vérifie que…',r:['Les tapis sont collés et à leur place, l’espace est libre','Le professeur regarde','La musique est lancée'],b:0},
  {q:'La parade, c’est…',r:['Assurer la sécurité du partenaire s’il est en difficulté','Pousser le partenaire pour qu’il tourne','Applaudir le partenaire'],b:0},
  {q:'Pour bien parer, je me place…',r:['Près de l’élément, de profil, ni trop près ni trop loin','Loin pour ne pas gêner','Devant, face à l’élève'],b:0},
  {q:'Je peux travailler le salto…',r:['Seulement en présence du professeur, parade en place, niveau précédent validé','Quand je me sens prêt','Si un copain le fait déjà'],b:0},
  {q:'Pendant le passage d’un camarade, je…',r:['Ne traverse pas la zone de travail et reste attentif','Prépare mon passage sur le tapis','Vais chercher du matériel en passant devant'],b:0},
];
const quizOk=id=>!!((S.quiz||{})[id]);
let QZ=null;
function ouvrirQuiz(){
  const ordre=QUIZ.map((x,i)=>({...x,i,m:x.r.map((t,j)=>({t,j})).sort(()=>Math.random()-.5)}));QZ={rep:{},ordre};
  fen(`<h3>🛡️ Quiz sécurité · ${esc(court(elv().nom))}</h3><p class="small muted">Toutes les réponses justes pour débloquer les niveaux avec ⚠️.</p>
   ${ordre.map((x,k)=>`<div class="quiz-q"><b>${k+1}. ${esc(x.q)}</b>${x.m.map(o=>`<label class="coche"><input type="radio" name="qz${k}" value="${o.j}"> ${esc(o.t)}</label>`).join('')}</div>`).join('')}
   <div class="rangee" style="margin-top:12px;justify-content:space-between"><button class="bt" type="button" data-act="fermer">Plus tard</button><button class="bt act" type="button" data-act="quiz-ok">Vérifier</button></div><p id="qz-msg" style="font-weight:700"></p>`);
}
function verifierQuiz(){
  let faux=0;QZ.ordre.forEach((x,k)=>{const c=document.querySelector(`input[name=qz${k}]:checked`);const ok=c&&+c.value===x.b;if(!ok)faux++;const bloc=document.querySelectorAll('.quiz-q')[k];bloc.classList.toggle('faux',!ok)});
  if(faux){$('#qz-msg').textContent=faux+' réponse'+(faux>1?'s':'')+' à revoir (en rouge). Relis la page Sécurité si besoin.';$('#qz-msg').style.color='var(--alerte)';return}
  S.quiz=S.quiz||{};S.quiz[elv().id]=Date.now();S.mod=Date.now();sauver();fermer();rendre();toast('Quiz réussi : niveaux ⚠️ débloqués.');
}

/* ---------- Lecture audio ---------- */
function lire(txt){try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);u.lang='fr-FR';u.rate=.95;const v=speechSynthesis.getVoices().find(x=>/^fr/i.test(x.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){toast('Lecture audio indisponible sur cette tablette.')}}
const audioDispo=()=>'speechSynthesis' in window;

/* ---------- Rotation des ateliers ---------- */
// ROOT.rotation = {c, d (début ms), m (minutes), g (nb groupes), o ([ateliers dans l'ordre])} ; S.grp = n° de groupe
function rotationActuelle(){
  const R=ROOT.rotation;if(!R||!S||R.c!==S.classe||!S.grp)return null;
  const t=Date.now()-R.d;if(t<0)return {avant:Math.ceil(-t/60000),at:R.o[(S.grp-1)%R.o.length]};
  const tour=Math.floor(t/(R.m*60000));if(tour>=R.o.length)return {fini:true};
  const at=R.o[(S.grp-1+tour)%R.o.length],reste=Math.ceil((R.m*60000-(t%(R.m*60000)))/60000);
  return {at,reste,tour:tour+1,nb:R.o.length,suiv:tour+1<R.o.length?R.o[(S.grp+tour)%R.o.length]:null};
}
function bandeauRotation(){
  const R=ROOT.rotation;if(!R||!S||R.c!==S.classe||new Date(R.d).toDateString()!==new Date().toDateString())return '';
  if(!S.grp)return `<div class="rotation"><b>🔄 Rotation des ateliers</b><span class="small">Quel est le numéro de votre groupe ?</span><div class="rangee">${Array.from({length:R.g},(_,i)=>`<button class="bt mini" type="button" data-act="grp" data-v="${i+1}">${i+1}</button>`).join('')}</div></div>`;
  const r=rotationActuelle();if(!r)return '';if(r.fini)return `<div class="rotation"><b>🔄 Rotation terminée</b></div>`;
  const a=atelier(r.at);
  return `<button type="button" class="rotation" ${st(r.at)} data-act="atelier" data-v="${r.at}"><span>🔄 Groupe ${S.grp} · ${r.avant!=null?'début dans '+r.avant+' min':'tour '+r.tour+'/'+r.nb}</span><b>Maintenant : atelier ${a.n} · ${esc(a.court)}</b><span class="small">${r.reste!=null?'encore '+r.reste+' min'+(r.suiv?' · ensuite atelier '+r.suiv:''):''}</span></button>`;
}
{
  const _rc=recevoirClasse;
  recevoirClasse=function(o){
    if(o&&o.t==='T'){ROOT.rotation={c:o.c,d:o.d*1000,m:o.m,g:o.g,o:o.o};ecrireRoot();rendre();return 'Rotation reçue : '+o.o.length+' ateliers de '+o.m+' min.'}
    return _rc(o);
  };
  const _vFiche2=vFiche;
  vFiche=function(){const h=_vFiche2();return S.eleves.length?h.replace(/(<h2>Fiche de [^<]*<\/h2>)/,bandeauRotation()+'$1'):h};
  setInterval(()=>{if(S&&ROOT.rotation&&!NAV.length&&S.tab==='fiche'&&!$('#modal').innerHTML){const y=scrollY;rendre();scrollTo(0,y)}},30000);
  const _blocValid=blocValid;
  blocValid=function(k){
    const n=niveau(k),E=elv(),v=V(E.id,k)||{};
    if(n.prof&&!v.e&&!v.p&&!quizOk(E.id))return `<div class="valid"><p><b>🛡️ Quiz sécurité d’abord</b> : ${esc(court(E.nom))} doit réussir le quiz sécurité avant de travailler ce niveau.</p><div class="rangee"><button class="bt act" type="button" data-act="quiz">Faire le quiz</button><button class="bt mini" type="button" data-act="info" data-v="securite">Relire la sécurité</button></div></div>`;
    let h=_blocValid(k);
    h=h.replace('<button class="bt ok" type="button" data-act="valE"',`<button class="bt danger" type="button" data-act="rate" data-v="${k}">✗ Pas encore réussi</button><button class="bt ok" type="button" data-act="valE"`);
    return h;
  };
  // 🔊 à côté des consignes et des critères
  const _blocFiche=blocFiche;
  blocFiche=function(id,titre){const h=_blocFiche(id,titre);return audioDispo()&&fiche(id).cons.length?h.replace('<h4>Consignes</h4>',`<h4>Consignes <button type="button" class="ecoute" data-act="lire" data-v="${id}" aria-label="Écouter les consignes">🔊</button></h4>`):h};
  const _vNiveau2=vNiveau;
  vNiveau=function(k){const h=_vNiveau2(k);return audioDispo()?h.replace('<b>Critères de réussite</b>',`<b>Critères de réussite</b> <button type="button" class="ecoute" data-act="lirecrit" data-v="${k}" aria-label="Écouter les critères">🔊</button>`):h};
  const _objetEnvoi2=objetEnvoi;
  objetEnvoi=function(){const o=_objetEnvoi2();o.el.forEach((x,i)=>{const E=S.eleves[i],r=(S.rate||{})[E.id];if(r&&Object.keys(r).length)x.x=r;if(quizOk(E.id))x.qz=1});return o};
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b)return;const v=b.dataset.v;
  switch(b.dataset.act){
    case 'rate':if(S)noterRate(v);break;
    case 'aide-ciblee':fermer();aller({v:'fiche',id:v,...listeDe(v)});break;
    case 'quiz':if(S)ouvrirQuiz();break;
    case 'quiz-ok':verifierQuiz();break;
    case 'lire':{const f=fiche(v);lire(f.t+'. '+f.cons.join('. ')+(f.mat.length?'. Matériel : '+f.mat.join(', '):''));break}
    case 'lirecrit':{const n=niveau(v);lire('Niveau '+n.n+', '+n.nom+'. Critères de réussite : '+n.crit.join('. '));break}
    case 'grp':if(S){S.grp=+v;sauver();rendre()}break;
  }
});

/* Avant une mise à jour (bandeau commun eps-maj.js) : on enregistre le carnet ouvert. */
window.addEventListener('eps-avant-maj',()=>{try{enregistrer()}catch(e){}});

/* Rappel téléphone portable à l'ouverture : module commun eps-rappel.js */
