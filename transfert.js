/* =====================================================================
   transfert.js — changer de téléphone sans perdre le carnet du groupe
   (même principe que l'appli demi-fond élève).
   ---------------------------------------------------------------------
   Ancien téléphone : Groupe → « Transférer vers un autre téléphone »
     → QR code (ou fichier en secours).
   Nouveau téléphone : Accueil → « Reprendre un carnet » → scanner le QR
     (ou choisir le fichier), puis taper le code secret du groupe.
   Le carnet voyage CHIFFRÉ avec la clé du groupe (même code, même sel) :
   sans le code du groupe, le QR ou le fichier ne se lit pas.
   Utilise les fonctions de app.js : S, ROOT, ACTIF, CLEF, deriver, vide,
   enregistrer, b64, deb64, prenom, fen, fermer, toast, rendre, esc.
   ===================================================================== */
(function(){
'use strict';
const enc=new TextEncoder(),dec=new TextDecoder();
async function deflate(u){const b=await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();return new Uint8Array(b)}
async function inflate(u){const b=await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();return new Uint8Array(b)}
const sec=ms=>ms?Math.round(ms/1000):0;

/* --- Carnet → forme compacte (pour tenir dans un QR) --- */
function compacter(s){
  const ids=s.eleves.map(e=>e.id),noms=s.eleves.map(e=>e.nom);
  const par=p=>{const i=noms.indexOf(p);return i>=0?i:(p||'')};
  const val={};
  Object.entries(s.val||{}).forEach(([id,niv])=>{
    val[id]=Object.entries(niv).map(([k,v])=>[k,v.e?[sec(v.e.t),par(v.e.par)]:0,v.p?sec(v.p.t):0,v.deb?sec(v.deb.t):0]);
  });
  const reste={};Object.keys(s).forEach(k=>{if(!['eleves','val','cfg','tab','cur','v'].includes(k))reste[k]=s[k]});
  const cfg=s.cfg?{classe:s.cfg.classe,eleves:[],lien:s.cfg.lien||'',pk:s.cfg.pk||'',barres:!!s.cfg.barres,tc:!!s.cfg.tc}:null;
  return {f:1,el:s.eleves.map(e=>[e.id,e.nom]),val,r:reste,cfg};
}
function decompacter(c){
  const s=vide();
  s.eleves=c.el.map(([id,nom])=>({id,nom}));
  const noms=s.eleves.map(e=>e.nom),ms=x=>x*1000;
  s.val={};
  Object.entries(c.val||{}).forEach(([id,L])=>{const o=s.val[id]={};
    L.forEach(([k,e,p,d])=>{const v={};if(e)v.e={t:ms(e[0]),par:typeof e[1]==='number'?noms[e[1]]:e[1]};if(p)v.p={t:ms(p)};if(d)v.deb={t:ms(d)};o[k]=v});
  });
  Object.assign(s,c.r||{});
  s.cfg=c.cfg||null;
  return s;
}

/* --- Ancien téléphone : fabriquer le paquet chiffré --- */
async function paquet(){
  const g=ROOT.groupes[ACTIF];
  if(!g||!g.sel||!CLEF)throw new Error('Ouvrez d’abord le carnet du groupe.');
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const clair=await deflate(enc.encode(JSON.stringify(compacter(S))));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},CLEF,clair);
  return {a:'GYM',v:1,t:'X',c:S.classe||'',n:S.eleves.map(e=>prenom(e.nom)),s:g.sel,i:b64(iv),d:b64(ct)};
}
async function montrerTransfert(){
  if(typeof DEMO!=='undefined'&&DEMO)return toast('Pas disponible en démo.');
  await enregistrer();
  const o=await paquet();
  let svg='';try{svg=GQR.svgQR(await GQR.encoder(o))}catch(e){svg=''}
  fen(`<h3>Transférer le carnet</h3>
    <p class="small">1. Sur le <b>nouveau</b> téléphone : Accueil → <b>📲 Reprendre un carnet</b> → Scanner.<br>2. Tapez votre code secret habituel (le même qu’ici).</p>
    ${svg?`<div class="qrbox" style="background:#fff;padding:10px;border-radius:12px">${svg}</div>`:'<p class="alerte">Le carnet est trop gros pour un QR code : utilisez le fichier ci-dessous.</p>'}
    <p class="small muted">Le QR est chiffré : sans votre code, il ne se lit pas.</p>
    <div class="rangee" style="margin-top:10px;justify-content:space-between">
      <button class="bt" type="button" data-act="fermer">Fermer</button>
      <button class="bt" type="button" data-act="tr-fichier">📄 Fichier (secours)</button>
      <button class="bt danger" type="button" data-act="tr-retirer">C’est transféré : retirer d’ici</button>
    </div>`);
}
async function fichierTransfert(){
  if(typeof DEMO!=='undefined'&&DEMO)return toast('Pas disponible en démo.');
  await enregistrer();
  const o=Object.assign({carnetGym:1},await paquet());
  const sl=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const nom=`carnet_gym_${sl(S.classe)||'classe'}_${o.n.map(sl).join('-')}.json`;
  const file=new File([JSON.stringify(o)],nom,{type:'application/json'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Carnet gym du groupe'});return toast('Fichier partagé.')}}catch(e){if(e&&e.name==='AbortError')return}
  const a=document.createElement('a');a.href=URL.createObjectURL(file);a.download=nom;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
  toast('Fichier enregistré dans les téléchargements.');
}
function confirmerRetrait(){
  fen(`<h3>Retirer le carnet de ce téléphone ?</h3>
    <p class="small">À faire seulement quand le nouveau téléphone affiche bien votre carnet. Ensuite, travaillez uniquement sur le nouveau téléphone : deux copies ne se rejoignent pas.</p>
    <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="fermer">Annuler</button><button class="bt danger" type="button" data-act="tr-retirer-ok">Retirer d’ici</button></div>`);
}
function retirer(){delete ROOT.groupes[ACTIF];S=null;ACTIF=null;CLEF=null;ecrireRoot();fermer();VUE='accueil';rendre();toast('Carnet retiré de ce téléphone.')}

/* --- Nouveau téléphone : recevoir --- */
function verifier(o){
  if(!o||o.t!=='X'||!o.s||!o.i||!o.d)throw new Error('Ce n’est pas un carnet de groupe (QR « Transférer » de l’ancien téléphone).');
  if(Object.values(ROOT.groupes).some(g=>g.sel===o.s))throw new Error('Ce carnet est déjà sur ce téléphone : touchez-le sur l’accueil.');
}
function demanderPourReprise(o){
  verifier(o);
  setTimeout(()=>demanderCode('Carnet de '+(o.n||[]).join(', '),'Votre code secret habituel (4 chiffres), le même que sur l’ancien téléphone.',c=>reprendre(o,c)),350);
}
let ESSAIS={n:0,t:0};
async function reprendre(o,code){
  if(ESSAIS.t>Date.now())throw new Error('Trop d’essais. Réessayez dans '+Math.ceil((ESSAIS.t-Date.now())/1000)+' s.');
  const k=await deriver(code,deb64(o.s));
  let c;
  try{c=JSON.parse(dec.decode(await inflate(new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:deb64(o.i)},k,deb64(o.d))))))}
  catch(e){ESSAIS.n++;if(ESSAIS.n>=5)ESSAIS.t=Date.now()+60000;throw new Error(ESSAIS.n>=5?'Code faux. Attendez 1 minute.':'Code faux.')}
  ESSAIS={n:0,t:0};
  if(S)await verrouiller();
  const id=uid();
  ROOT.groupes[id]={classe:o.c||'',noms:o.n||[],sel:o.s};
  CLEF=k;ACTIF=id;S=decompacter(c);
  if(S.classe&&ROOT.classes[S.classe])S.cfg=JSON.parse(JSON.stringify(ROOT.classes[S.classe]));
  S.tab='fiche';S.cur=0;NAV=[];
  await enregistrer();
  setTimeout(()=>toast(ROOT.classes[S.classe]?'Carnet repris ✔':'Carnet repris ✔ Scannez aussi le QR de la classe (professeur).'),400);
}
function choisirReprise(){
  fen(`<h3>📲 Reprendre un carnet</h3>
    <p class="small">Sur l’<b>ancien</b> téléphone : ouvrez le carnet → onglet Groupe → <b>Transférer vers un autre téléphone</b>. Puis scannez le QR ici.</p>
    <div class="rangee" style="margin-top:10px"><button class="bt act" type="button" data-act="tr-scan">📷 Scanner le QR</button>
    <label class="bt" style="display:inline-flex;align-items:center">📄 Choisir le fichier<input id="tr-file" type="file" accept=".json,application/json" hidden></label></div>
    <div class="rangee" style="margin-top:12px;justify-content:flex-end"><button class="bt" type="button" data-act="fermer">Annuler</button></div>`);
}

/* --- Boutons (ajoutés dans les écrans Accueil et Groupe par app.js) --- */
document.addEventListener('click',async ev=>{
  const b=ev.target.closest('[data-act^="tr-"]');if(!b)return;
  try{
    switch(b.dataset.act){
      case 'tr-qr':await montrerTransfert();break;
      case 'tr-fichier':await fichierTransfert();break;
      case 'tr-retirer':confirmerRetrait();break;
      case 'tr-retirer-ok':retirer();break;
      case 'tr-reprendre':choisirReprise();break;
      case 'tr-scan':fermer();GQR.scanner(async t=>{const o=await GQR.decoder(t);demanderPourReprise(o);return 'Carnet lu. Tapez votre code.'},{titre:'Reprendre un carnet',aide:'Visez le QR « Transférer » de l’ancien téléphone.'});break;
    }
  }catch(e){toast(e.message||'Erreur')}
});
document.addEventListener('change',async ev=>{
  const el=ev.target;if(el.id!=='tr-file'||!el.files[0])return;
  try{const o=JSON.parse(await el.files[0].text());if(!o.carnetGym)throw new Error('Ce fichier n’est pas un carnet de groupe.');fermer();demanderPourReprise(o)}
  catch(e){toast(e.message&&e.message.length<120?e.message:'Ce fichier n’est pas un carnet de groupe.')}
  el.value='';
});
/* --- Ajout des boutons sans modifier app.js : on complète les écrans --- */
const _vAccueil=vAccueil,_vGroupe=vGroupe;
vAccueil=function(){
  const h=_vAccueil();
  const bt='<div class="rangee" style="margin-top:8px"><button class="bt" type="button" data-act="tr-reprendre">📲 Reprendre un carnet (autre téléphone)</button></div>';
  const i=h.indexOf('<section class="carte" style="margin-top:20px">');
  return i>=0?h.slice(0,i)+bt+h.slice(i):h+bt;
};
vGroupe=function(){
  const h=_vGroupe();
  const sec=`<section class="carte"><h3>📲 Changer de téléphone</h3><p class="small muted">Le carnet passe sur un autre téléphone ou une autre tablette, avec toutes les validations. Le code secret reste le même.</p><button class="bt" type="button" data-act="tr-qr"${S&&S.eleves.length?'':' disabled'}>Transférer vers un autre téléphone</button></section>`;
  const i=h.lastIndexOf('<section class="carte"><h3>Fin d');
  return i>=0?h.slice(0,i)+sec+h.slice(i):h+sec;
};
window.GYMTransfert={compacter,decompacter,paquet};
try{rendre()}catch(e){} // premier affichage déjà fait par app.js : on le refait avec les nouveaux boutons
})();
