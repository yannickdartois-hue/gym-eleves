/* =====================================================================
   oubli.js — code secret oublié : le professeur peut le retrouver
   ---------------------------------------------------------------------
   Le QR de la classe apporte une clé publique du professeur (champ ek,
   ECDH P-256). Chaque fois qu'un groupe tape son code (création ou
   ouverture du carnet), le code est rangé sur le téléphone CHIFFRÉ pour
   cette clé : seul l'outil prof (clé privée sur l'iPad) peut le lire.
   Code oublié → le groupe montre un QR (t:'O') → le professeur le scanne
   dans son outil → son écran affiche le code. Rien ne passe par internet.
   Un groupe créé avant ce module est protégé dès qu'il a scanné le QR de
   la classe puis ouvert son carnet une fois avec son code.
   Ajouté à côté d'app.js (qui n'est pas modifié). Chargé après transfert.js.
   ===================================================================== */
(function(){
'use strict';
const enc=new TextEncoder();
const b64u=u=>{let s='';new Uint8Array(u).forEach(x=>s+=String.fromCharCode(x));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const deb64u=t=>{t=String(t).replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';return Uint8Array.from(atob(t),c=>c.charCodeAt(0))};

async function pourProf(code,ek){
  const pub=await crypto.subtle.importKey('raw',deb64u(ek),{name:'ECDH',namedCurve:'P-256'},false,[]);
  const eph=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},true,['deriveKey']);
  const k=await crypto.subtle.deriveKey({name:'ECDH',public:pub},eph.privateKey,{name:'AES-GCM',length:256},false,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  return {e:b64u(await crypto.subtle.exportKey('raw',eph.publicKey)),i:b64u(iv),d:b64u(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,enc.encode('gym|'+code)))};
}
let CODE=null; // code du carnet ouvert, gardé en mémoire le temps de la séance
async function proteger(){
  try{
    if(!S||!ACTIF||!CODE||(typeof DEMO!=='undefined'&&DEMO))return;
    const g=ROOT.groupes[ACTIF],c=ROOT.classes[S.classe]||{},ek=(S.cfg&&S.cfg.ek)||c.ek;
    if(!g||!ek||(g.oc&&g.oek===ek))return;
    g.oc=await pourProf(CODE,ek);g.oek=ek;ecrireRoot();
  }catch(e){}
}

/* --- Le QR de la classe : garder la clé du professeur --- */
const _recevoirClasse=recevoirClasse;
recevoirClasse=function(o){
  const r=_recevoirClasse(o);
  if(o&&o.ek&&ROOT.classes[o.c]){ROOT.classes[o.c].ek=o.ek;if(S&&S.cfg&&S.classe===o.c)S.cfg.ek=o.ek;ecrireRoot();proteger()}
  return r;
};
/* --- Retenir le code quand le groupe le tape --- */
const _ouvrir=ouvrir,_nouveauGroupe=nouveauGroupe,_verrouiller=verrouiller;
ouvrir=async function(id,code){await _ouvrir(id,code);CODE=code;await proteger()};
nouveauGroupe=async function(classe,code){await _nouveauGroupe(classe,code);CODE=code;await proteger()};
verrouiller=async function(){CODE=null;return _verrouiller()};

/* --- « Code oublié ? » --- */
let DERNIER=null;
document.addEventListener('click',async ev=>{
  const o=ev.target.closest('[data-act="ouvrir"]');if(o){DERNIER=o.dataset.v;return}
  const b=ev.target.closest('[data-act="codeoubli"]');if(!b)return;
  const g=DERNIER&&ROOT.groupes[DERNIER];
  if(!g||!g.oc)return; // ancien carnet : message habituel d'app.js
  ev.stopImmediatePropagation();ev.preventDefault();
  let svg='';
  try{svg=GQR.svgQR(await GQR.encoder({a:'GYM',v:1,t:'O',c:g.classe||'',n:g.noms||[],o:g.oc}))}catch(e){svg='<p class="alerte">QR impossible sur cet appareil.</p>'}
  fen(`<h3>Code oublié</h3>
    <p>Montrez ce QR au professeur. Il le scanne avec son outil (<b>📷 Valider un élève</b> ou <b>Recevoir → Scanner</b>) et lit votre code sur son écran.</p>
    <div class="qrbox" style="background:#fff;padding:10px;border-radius:12px;max-width:320px;margin:auto">${svg}</div>
    <p class="small muted">Le QR est chiffré : seul l’outil du professeur peut le lire.</p>
    <div class="rangee" style="justify-content:space-between;margin-top:10px"><button class="bt" type="button" data-act="fermer">Fermer</button><button class="bt noir" type="button" data-act="ouvrir" data-v="${esc(DERNIER)}">J’ai le code : l’ouvrir</button></div>`);
},true);
window.GYMOubli={pourProf,proteger};
})();
