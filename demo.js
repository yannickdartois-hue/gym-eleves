/* =====================================================================
   demo.js — mode démo de l'appli élève : un groupe fictif déjà rempli,
   pour visiter tous les écrans sans QR de classe ni code.
   Rien n'est enregistré sur la tablette ni envoyé.
   Ouverture : carte « Essayer l'appli (démo) » à l'accueil, ou adresse …/?demo
   Code professeur de la démo : 0000
   ===================================================================== */
'use strict';
let DEMO=false;
const DEMO_CLASSE='DÉMO',DEMO_NOMS=['Léa MARTIN','Hugo BERNARD','Inès PETIT'],
  DEMO_AUTRES=['Tom DURAND','Zoé LEROY','Max GIRARD','Nina ROUX','Sacha FAURE','Jade MOREL','Noah BLANC'];
function carteDemo(){
  return `<section class="carte demo-carte"><h3>👀 Découvrir l’appli</h3><p class="small muted">Un groupe fictif déjà rempli, pour voir tous les écrans. Rien n’est enregistré ni envoyé. Code professeur de la démo : <b>0000</b>.</p>
    <button type="button" class="bt" data-act="demo">Essayer l’appli (démo)</button></section>`;
}
function bandeauDemo(){
  return DEMO?`<div class="demo-bandeau"><span>👀 <b>Mode démo</b> : rien n’est enregistré. Code professeur : <b>0000</b>.</span><button type="button" class="bt mini" data-act="demofin">Quitter la démo</button></div>`:'';
}
async function ouvrirDemo(){
  const s=vide(),J=n=>Date.now()-n*864e5;
  s.classe=DEMO_CLASSE;
  s.cfg={classe:DEMO_CLASSE,eleves:DEMO_NOMS.concat(DEMO_AUTRES),lien:'',pin:await empreinte('0000'),barres:true};
  s.eleves=DEMO_NOMS.map(nom=>({id:uid(),nom}));
  // [atelier, dernier niveau P, dernier niveau E] par élève
  const prog=[
    [[1,'C','D'],[2,'B','B'],[3,'B','C'],[4,'C','C'],[5,'B','B'],[6,'D','E']],
    [[1,'D','E'],[2,'C','D'],[3,'A','A'],[4,'D','D'],[5,'C','D'],[6,'C','C']],
    [[1,'B','B'],[2,'A','B'],[3,'C','C'],[4,'B','C'],[5,'A','A'],[6,'B','C']]];
  s.eleves.forEach((E,i)=>{
    s.val[E.id]={};const obs=s.eleves[(i+1)%3].nom;
    prog[i].forEach(([a,p,e])=>NIVS.forEach((n,k)=>{
      const ip=NIVS.indexOf(p),ie=NIVS.indexOf(e);if(k>ie)return;
      const v={e:{t:J(21-k*3),par:obs}};if(k<=ip)v.p={t:J(20-k*3)};
      s.val[E.id][a+n]=v;
    }));
  });
  s.mod=Date.now();s.tab='fiche';
  DEMO=true;S=s;ACTIF=null;CLEF=null;NAV=[];
}
function quitterDemo(){DEMO=false;S=null;ACTIF=null;CLEF=null;NAV=[];VUE='accueil'}
