/* =====================================================================
   Tests automatiques — appli élève + outil prof de gymnastique
   Lancés par GitHub à chaque mise en ligne (gym-eleves ET gym-prof).
   En local, depuis le dossier qui contient les deux dépôts côte à côte :
       python3 -m http.server 8840
       node gym-eleves/tests/gym.test.js
   Option : BASE=http://localhost:8840
   ===================================================================== */
const {chromium}=require('playwright');
const BASE=(process.env.BASE||'http://localhost:8840').replace(/\/$/,'');
let ok=0,ko=0;
function verif(nom,cond,info){if(cond){ok++;console.log('✓ '+nom)}else{ko++;console.log('✗ '+nom+(info?' — '+info:''))}}

(async()=>{
  const b=await chromium.launch();
  const errs=[];
  const page=async(url,o={})=>{
    const c=await b.newContext({viewport:o.vp||{width:390,height:844},serviceWorkers:'block'});
    const p=await c.newPage();p.on('pageerror',e=>errs.push(url+' : '+e.message));
    if(o.vraiTel)await p.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
    await p.goto(BASE+url);await p.waitForTimeout(1200);
    const r=await p.$('#eps-rappel button');if(r)await r.click();
    return p;
  };

  /* ---------- 1. Appli élève : accueil, apprendre, démo ---------- */
  const E0=await page('/gym-eleves/');
  verif('Élève : l’accueil s’affiche',(await E0.textContent('#app')).includes('Nouveau groupe'));
  verif('Élève : pas de défilement horizontal sur téléphone',await E0.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await E0.click('summary:has-text("vidéos hors ligne")');await E0.waitForTimeout(300);
  verif('Élève : vidéos hors ligne proposées par atelier (≥ 8 lignes)',(await E0.$$('#hl-liste [data-act="charger"]')).length>=8);
  verif('Élève : toutes les vidéos ont un poids connu',await E0.evaluate(()=>Object.values(GYM.fiches).flatMap(f=>f.vid.map(v=>v[0])).every(f=>TAILLES[f]>0)));
  await E0.click('[data-act="onglet"][data-v="apprendre"]');await E0.waitForTimeout(300);
  verif('Élève : 6 ateliers dans Apprendre',await E0.evaluate(()=>document.querySelectorAll('.atelier').length>=6||document.querySelectorAll('[data-act="atelier"]').length>=6));

  const D=await page('/gym-eleves/?demo');
  verif('Élève : la démo ouvre un groupe',await D.evaluate(()=>!!S&&DEMO&&S.eleves.length>1));
  const kE=await D.evaluate(()=>{for(const id of Object.keys(S.val))for(const [k,v] of Object.entries(S.val[id]))if(v.e&&!v.p){S.cur=S.eleves.findIndex(e=>e.id===id);aller({v:'niveau',k});return k}});
  await D.waitForTimeout(300);
  verif('Démo : page d’un niveau validé E avec « Montrer au professeur »',!!(await D.$('[data-act="montrer"]')),kE);
  await D.click('[data-act="montrer"]');await D.waitForTimeout(300);
  verif('Démo : le QR de demande s’affiche',!!(await D.$('#modal svg, #modal img, #modal canvas')));
  await D.click('[data-act="demoP"]');await D.waitForTimeout(300);
  verif('Démo : « simuler le prof » valide P',await D.evaluate(k=>!!(S.val[S.eleves[S.cur].id][k]||{}).p,kE));
  verif('Démo : aucun code professeur affiché',!(await D.textContent('body')).includes('0000'));

  /* ---------- 2. Outil prof : vues, démo ---------- */
  const PD=await page('/gym-prof/?demo',{vp:{width:1024,height:900}});
  for(const v of ['tableau','valider','recevoir','classes']){
    await PD.evaluate(v=>{DB.eleve=null;DB.vue=v;rendre()},v);await PD.waitForTimeout(150);
    verif('Prof démo : vue « '+v+' »',(await PD.textContent('#app')).length>100);
  }
  verif('Prof démo : bouton « Valider un élève »',await PD.evaluate(()=>{DB.vue='valider';rendre();return !!document.querySelector('[data-act="scanvalid"]')}));

  /* ---------- 3. Circuit complet : prof → téléphone → prof → téléphone ---------- */
  const P=await page('/gym-prof/',{vp:{width:1024,height:900}});
  const qrC=await P.evaluate(async()=>{
    DB.classes['1T9']={eleves:['MARTIN Hugo','DURAND Léa','PETIT Inès'],lien:'',barres:false};DB.classe='1T9';sauver();
    const L=DB.classes['1T9'];L.cc=L.cc||EPSCode.nouvelleCle();
    return GQR.encoder({a:'GYM',v:1,t:'C',c:'1T9',l:L.eleves,u:'',pk:(await SIGNE.cles()).pub,b:0,tc:0,cc:L.cc,pv:{},ts:Math.round(Date.now()/1000)});
  });
  verif('Prof : le QR de classe ne contient plus le code prof',await P.evaluate(async q=>{const o=await GQR.decoder(q);return !o.k&&!!o.pk&&!!o.cc},qrC));
  const T=await page('/gym-eleves/');
  const grp=await T.evaluate(async q=>{recevoirClasse(await GQR.decoder(q));await nouveauGroupe('1T9','4321');
    S.eleves=[{id:'a',nom:'MARTIN Hugo'},{id:'b',nom:'DURAND Léa'}];S.tab='fiche';await enregistrer();
    maj('a','1A',x=>{x.e={t:Date.now(),par:'DURAND Léa'}});return {pk:!!S.cfg.pk,cc:!!S.cfg}},qrC);
  verif('Téléphone : classe reçue avec la clé publique du prof',grp.pk);
  const envoi=await T.evaluate(async()=>GQR.encoder(objetEnvoi()));
  const n1=await P.evaluate(async q=>{importerObjet(await GQR.decoder(q),'QR');return aValider('1T9').length},envoi);
  verif('Prof : la fiche du groupe arrive, 1 niveau à valider',n1===1,'trouvé '+n1);
  const dem=await T.evaluate(async()=>GQR.encoder({a:'GYM',v:1,t:'V',c:'1T9',n:'MARTIN Hugo',k:'1A',x:'p',e:[Math.round(Date.now()/1000),'DURAND Léa']}));
  await P.evaluate(async q=>ouvrirDemande(await GQR.decoder(q)),dem);await P.waitForTimeout(200);
  await P.click('#valid-voile [data-r="oui"]');await P.waitForTimeout(600);
  const rep=await P.evaluate(async()=>{const E=DB.el[cle('1T9','MARTIN Hugo')];const r={a:'GYM',v:1,t:'P',c:'1T9',n:'MARTIN Hugo',k:'1A',x:'p',p:Math.round(E.v['1A'].p/1000)};r.s=await SIGNE.signer(msgSigne(r));return {p:!!E.v['1A'].p,r,q:await GQR.encoder(r),aff:!!document.querySelector('#valid-voile svg')}});
  verif('Prof : P enregistré après le scan de la demande',rep.p);
  verif('Prof : QR de réponse affiché',rep.aff);
  verif('Téléphone : la réponse signée affiche le P',await T.evaluate(async q=>{await recevoirReponse(await GQR.decoder(q));return !!S.val.a['1A'].p},rep.q));
  verif('Téléphone : une réponse falsifiée est refusée',await T.evaluate(async r=>{r.k='6F';try{await recevoirReponse(r);return false}catch(e){return true}},rep.r));
  verif('Téléphone : une réponse pour un élève d’un autre groupe est refusée',await T.evaluate(async r=>{try{await recevoirReponse(r);return false}catch(e){return /PETIT/.test(e.message)}},await P.evaluate(async()=>{const r={a:'GYM',v:1,t:'P',c:'1T9',n:'PETIT Inès',k:'1A',x:'p',p:1};r.s=await SIGNE.signer(msgSigne(r));return r})));
  const triche=await P.evaluate(()=>{const s=Math.round(Date.now()/1000);importerObjet({a:'GYM',v:1,t:'G',c:'1T9',ts:s,el:[{n:'DURAND Léa',s:'p'+'0'.repeat(35),d:{'1A':[s,'MARTIN Hugo',s]}}]},'QR');return !!(DB.el[cle('1T9','DURAND Léa')].v['1A']||{}).p});
  verif('Prof : un P envoyé par un téléphone ne compte pas',!triche);

  /* ---------- 4. Note, statut ---------- */
  const nt=await P.evaluate(()=>{const E=DB.el[cle('1T9','MARTIN Hugo')];const a=note(E,'1T9').total;E.st='ip';E.excl=[6];const b=note(E,'1T9');E.st='disp';const c=note(E,'1T9');delete E.st;delete E.excl;return {a,b:b.total,c:c.total,disp:c.disp}});
  verif('Note : un élève avec 1A en P a une note',nt.a>0);
  verif('Note : inapte partiel → note calculée',nt.b>0);
  verif('Note : dispensé → pas de note',nt.c==null&&nt.disp);

  /* ---------- 5. Code du cours (téléphone réel simulé) ---------- */
  const V=await page('/gym-eleves/?demo',{vraiTel:true});
  const cc=await V.evaluate(async()=>{history.replaceState(null,'',location.pathname);DEMO=false;const cle='AAECAwQFBgcICQoL';EPSCode.memoriserCle(S.classe,cle);
    let k='';for(const a of GYM.ateliers)for(const n of a.niv)if(n.prof&&!k)k=a.n+n.n;
    document.body.insertAdjacentHTML('beforeend','<button id="tst" data-act="valE" data-v="'+k+'">x</button>');return {k,code:await EPSCode.code(cle,S.classe,EPSCode.jour(),'G')}});
  await V.click('#tst');await V.waitForTimeout(300);
  verif('Code du cours : demandé pour un niveau ⚠️',!!(await V.$('#eps-code-voile')),cc.k);
  await V.fill('#eps-code-in',cc.code);await V.waitForTimeout(500);
  verif('Code du cours : le bon code ouvre le cours',await V.evaluate(()=>EPSCode.etat()==='ouverte'));

  verif('Aucune erreur JavaScript',errs.length===0,errs.join(' | '));
  await b.close();
  console.log('\n'+ok+' réussis, '+ko+' échoués');
  process.exit(ko?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
