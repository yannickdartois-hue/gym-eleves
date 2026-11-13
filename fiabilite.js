/* =====================================================================
   fiabilite.js — v1.1 : identités sûres et validations jamais perdues (chargé après app.js et plus.js)
   Identités (le QR de la classe fait foi) :
   - Groupe sans classe : « Ma fiche » est bloquée tant que la classe n'est pas choisie (hors démo).
   - Élève dont le nom n'est pas dans la liste de la classe : bandeau « touchez le bon nom ».
     Le nom est corrigé, ses validations restent les siennes (même identifiant).
   Validations jamais perdues :
   - Appli ouverte dans le navigateur (pas installée) : bandeau sur « Ma fiche » (masquable pour la journée).
   - Fermer le carnet (🔒) avec des validations non envoyées : « Envoyer maintenant » ou « Fermer quand même ».
   - Validations non envoyées depuis 15 min, ou rotation terminée : bandeau « Avant de partir : envoie la fiche ».
   ===================================================================== */
(function(){
'use strict';
const nrm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const RAPPEL_MIN=15,CLE_INST='gym-inst-masque';
const lire=k=>{try{return localStorage.getItem(k)}catch(e){return null}},ecrire=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};

/* ---------- noms hors liste ---------- */
function liste(){return (S&&S.cfg&&S.cfg.eleves)||[]}
function horsListe(){const L=new Set(liste().map(nrm));if(!L.size)return [];return S.eleves.map((e,i)=>({e,i})).filter(x=>!L.has(nrm(x.e.nom)))}
function proches(nom){const p=nrm(prenom(nom)),n=nrm(nom),pris=new Set(S.eleves.map(e=>nrm(e.nom)));
  const L=liste().filter(x=>!pris.has(nrm(x)));const bons=L.filter(x=>nrm(prenom(x))===p||nrm(x).includes(n)||n.includes(nrm(prenom(x))));
  return {bons,autres:L.filter(x=>!bons.includes(x)).sort((a,b)=>a.localeCompare(b,'fr'))}}
function bandeauNoms(){if(DEMO)return '';const H=horsListe();if(!H.length)return '';
  return `<div class="alerte fia-noms"><b>⚠ ${H.length>1?'Ces noms ne sont':'Ce nom n’est'} pas dans la liste de la classe.</b> Choisis le bon nom : tes validations restent les tiennes.
  ${H.map(({e,i})=>{const P=proches(e.nom);return `<div class="fia-l"><b>${esc(e.nom)}</b> est en réalité :<div class="rangee" style="margin-top:4px;flex-wrap:nowrap"><select data-fia-nom="${i}">${P.bons.map(n=>`<option>${esc(n)}</option>`).join('')}${P.bons.length&&P.autres.length?'<option disabled>──────</option>':''}${P.autres.map(n=>`<option>${esc(n)}</option>`).join('')}</select><button class="bt act mini" type="button" data-act="fia-renom" data-v="${i}">Corriger</button></div></div>`}).join('')}</div>`}

/* ---------- appli pas installée ---------- */
function bandeauInstall(){if(DEMO||installee()||lire(CLE_INST)===new Date().toDateString())return '';
  return `<div class="alerte fia-inst"><b>⚠ Appli pas installée : tes validations peuvent être effacées.</b>
  <details><summary class="small">Comment l’installer</summary><ul class="small" style="margin:6px 0 4px;padding-left:18px"><li><b>iPhone</b> : bouton Partager <span aria-hidden="true">⬆︎</span> → « Sur l’écran d’accueil », puis ouvre l’appli avec son icône.</li><li><b>Android</b> : menu ⋮ → « Installer l’appli » ou « Ajouter à l’écran d’accueil ».</li><li>Sur iPhone, une appli non installée et inutilisée quelques jours peut perdre ses données.</li></ul></details>
  <button class="bt mini" type="button" data-act="fia-inst-x">Plus tard (aujourd’hui)</button></div>`}

/* ---------- rappel d'envoi ---------- */
function suivreNonEnvoye(){if(!S)return;if(aEnvoyer()){if(!S.nonEnv0)S.nonEnv0=Date.now()}else if(S.nonEnv0)delete S.nonEnv0}
function bandeauEnvoi(){if(!S||DEMO||!aEnvoyer())return '';let fin=false;try{const r=rotationActuelle();fin=!!(r&&r.fini)}catch(e){}
  const vieux=S.nonEnv0&&Date.now()-S.nonEnv0>=RAPPEL_MIN*60000;if(!fin&&!vieux)return '';
  return `<div class="alerte fia-envoi"><b>📤 Avant de partir : envoie la fiche au professeur.</b> ${fin?'La rotation est terminée.':'Des validations attendent depuis plus de '+RAPPEL_MIN+' min.'}
  <div class="rangee" style="margin-top:8px"><button class="bt act" type="button" data-act="onglet" data-v="envoi">Envoyer maintenant</button></div></div>`}

/* ---------- Ma fiche ---------- */
const oF=vFiche;window.vFiche=function(){suivreNonEnvoye();
  if(S&&!S.classe&&!DEMO)return sansClasse()+`<h2>Ma fiche</h2><p class="carte">Choisissez d’abord votre classe ci-dessus (ou scannez le QR de la classe) : sans elle, vos validations n’arriveraient pas dans votre classe chez le professeur.</p>`;
  return bandeauNoms()+bandeauEnvoi()+bandeauInstall()+oF()};
const oG=vGroupe;window.vGroupe=function(){return bandeauNoms()+oG()};
const oR=rendre;window.rendre=function(){try{suivreNonEnvoye()}catch(e){}oR()};

document.addEventListener('click',async ev=>{const b=ev.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='fia-renom'){ev.stopImmediatePropagation();const i=+b.dataset.v,s=document.querySelector(`[data-fia-nom="${i}"]`),E=S.eleves[i];if(!s||!E||!s.value)return;
    if(S.eleves.some((x,j)=>j!==i&&nrm(x.nom)===nrm(s.value))){toast('Ce nom est déjà dans le groupe.');return}
    const avant=E.nom;E.nom=s.value;S.mod=Date.now();sauver();toast(avant+' → '+E.nom);rendre();return}
  if(a==='fia-inst-x'){ev.stopImmediatePropagation();ecrire(CLE_INST,new Date().toDateString());rendre();return}
  if(a==='verrou'&&S&&!DEMO&&aEnvoyer()&&!b.dataset.force){ev.stopImmediatePropagation();
    fen(`<h3>📤 Validations pas encore envoyées</h3><p>Si la tablette est réinitialisée avant l’envoi, elles seront perdues.</p>
    <div class="rangee" style="justify-content:space-between"><button class="bt" type="button" data-act="verrou" data-force="1">Fermer quand même</button><button class="bt act" type="button" data-act="fia-envoyer">Envoyer maintenant</button></div>`);return}
  if(a==='fia-envoyer'){ev.stopImmediatePropagation();fermer();NAV=[];S.tab='envoi';rendre();window.scrollTo(0,0);return}
},true);
const css=document.createElement('style');css.textContent='.fia-l{margin-top:10px}.fia-noms select{font:inherit;padding:6px 8px;border-radius:8px;min-width:0;flex:1}.fia-inst summary{cursor:pointer;margin-top:4px}.fia-envoi{background:#fff3c4;border-color:#d6a400;color:#3d2e00}';document.head.appendChild(css);
try{if(S)rendre()}catch(e){}
})();
