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
    // l’écran de bienvenue (1re ouverture) est testé à part ; ailleurs on le considère déjà vu
    if(!o.premiere)await p.addInitScript(()=>{try{localStorage.setItem('gym-bienvenue','1')}catch(e){}});
    await p.goto(BASE+url);await p.waitForTimeout(1200);
    const r=await p.$('#eps-rappel button');if(r)await r.click();
    return p;
  };

  /* ---------- 1. Appli élève : accueil, apprendre, démo ---------- */
  const B0=await page('/gym-eleves/',{premiere:true});
  verif('Élève : 1re ouverture = écran de bienvenue',await B0.evaluate(()=>!localStorage.getItem('gym-bienvenue')&&document.querySelector('#app').textContent.length>50));
  verif('Élève : bouton démo sur l’écran de bienvenue',!!(await B0.$('[data-act="demo"]')));
  const E0=await page('/gym-eleves/');
  verif('Élève : l’accueil s’affiche',(await E0.textContent('#app')).includes('Nouveau groupe'));
  verif('Élève : pas de défilement horizontal sur téléphone',await E0.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await E0.click('summary:has-text("vidéos hors ligne")');await E0.waitForTimeout(300);
  verif('Élève : vidéos hors ligne proposées par atelier (≥ 6 lignes)',(await E0.$$('#hl-liste [data-act="charger"]')).length>=6);
  verif('Élève : toutes les vidéos ont un poids connu',await E0.evaluate(()=>Object.values(GYM.fiches).flatMap(f=>f.vid.map(v=>v[0])).every(f=>TAILLES[f]>0)));
  await E0.click('[data-act="onglet"][data-v="apprendre"]');await E0.waitForTimeout(300);
  verif('Élève : 6 ateliers dans Apprendre',await E0.evaluate(()=>document.querySelectorAll('.atelier').length>=6||document.querySelectorAll('[data-act="atelier"]').length>=6));

  const D=await page('/gym-eleves/?demo');
  verif('Élève : la démo ouvre un groupe',await D.evaluate(()=>!!S&&DEMO&&S.eleves.length>1));
  const kE=await D.evaluate(()=>{for(const id of Object.keys(S.val))for(const [k,v] of Object.entries(S.val[id]))if(v.e&&!v.p){S.cur=S.eleves.findIndex(e=>e.id===id);aller({v:'niveau',k});return k}});
  await D.waitForTimeout(300);
  verif('Niveau : le matériel ne s’affiche qu’en haut de la page (pas répété dans les fiches)',await D.evaluate(()=>GYM.ateliers.every(a=>a.niv.every(n=>{const d=document.createElement('div');d.innerHTML=vNiveau(a.n+n.n);return !d.querySelector('.carte .install')}))));
  verif('Démo : page d’un niveau validé E avec « Montrer au professeur »',!!(await D.$('[data-act="montrer"]')),kE);
  await D.click('[data-act="montrer"]');await D.waitForTimeout(300);
  verif('Démo : le QR de demande s’affiche',!!(await D.$('#modal svg, #modal img, #modal canvas')));
  await D.click('[data-act="demoP"]');await D.waitForTimeout(300);
  verif('Démo : « simuler le prof » valide P',await D.evaluate(k=>!!(S.val[S.eleves[S.cur].id][k]||{}).p,kE));
  verif('Démo : aucun code professeur affiché',!(await D.textContent('body')).includes('0000'));
  await D.evaluate(()=>{fermer();NAV=[];S.tab='fiche';rendre()});await D.waitForTimeout(200);
  verif('Personnage : affiché sur la fiche',!!(await D.$('.gav-carte svg')));
  verif('Personnage : part avec l’envoi',await D.evaluate(()=>objetEnvoi().el.every(x=>!!GYMAV.parId[x.av])));

  /* ---------- 2. Outil prof : vues, démo ---------- */
  const PD=await page('/gym-prof/?demo',{vp:{width:1024,height:900}});
  for(const v of ['tableau','valider','recevoir','classes']){
    await PD.evaluate(v=>{DB.eleve=null;DB.vue=v;rendre()},v);await PD.waitForTimeout(150);
    verif('Prof démo : vue « '+v+' »',(await PD.textContent('#app')).length>100);
  }
  verif('Prof démo : bouton « Valider un élève »',await PD.evaluate(()=>{DB.vue='valider';rendre();return !!document.querySelector('[data-act="scanvalid"]')}));
  verif('Prof : le personnage reçu est gardé et affiché',await PD.evaluate(()=>{const k=Object.keys(DB.el)[0],E=DB.el[k];importerObjet({a:'GYM',v:1,t:'G',c:E.classe,g:'t',lt:'1',ts:Math.round(Date.now()/1000),el:[{n:E.nom,s:'',d:{},av:'lina'}]},'test');DB.vue='tableau';DB.eleve=null;rendre();return DB.el[k].av==='lina'&&!!document.querySelector('.gav-mini svg')}));

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
  const cc=await V.evaluate(async()=>{history.replaceState(null,'',location.pathname);DEMO=false;const cle='AAECAwQFBgcICQoL';EPSCode.memoriserCle(S.classe,cle);S.quiz=S.quiz||{};S.quiz[elv().id]=Date.now(); // quiz sécurité réussi : sinon les niveaux ⚠️ restent bloqués
    S.exige=new Date().toDateString(); // message « La gym est une activité exigeante » déjà lu aujourd’hui
    let k='';for(const a of GYM.ateliers)for(const n of a.niv)if(n.prof&&!k)k=a.n+n.n;
    document.body.insertAdjacentHTML('beforeend','<button id="tst" data-act="valE" data-v="'+k+'">x</button>');return {k,code:await EPSCode.code(cle,S.classe,EPSCode.jour(),'G')}});
  await V.click('#tst');await V.waitForTimeout(300);
  verif('Code du cours : demandé pour un niveau ⚠️',!!(await V.$('#eps-code-voile')),cc.k);
  await V.fill('#eps-code-in',cc.code);await V.waitForTimeout(500);
  verif('Code du cours : le bon code ouvre le cours',await V.evaluate(()=>EPSCode.etat()==='ouverte'));

  /* ---------- 6. Rotation : 3 tours par cours, cours B décalé de 3 ateliers ---------- */
  const rot=await T.evaluate(()=>{const S0=S.grp;S.grp=1;const r=[];for(const s of [0,3])for(const k of [0,1,2,3]){ROOT.rotation={c:S.classe,d:Date.now()-k*20*60000-1000,m:20,g:6,o:[1,2,3,4,5,6],n:3,s};const x=rotationActuelle();r.push(x.fini?'fin':x.at)}
    ROOT.rotation={c:S.classe,d:Date.now()-1000,m:8,g:6,o:[1,2,3,4,5,6]};const ancien=rotationActuelle();ROOT.rotation=null;S.grp=S0;return {r:r.join(','),ancien:ancien.at+'/'+ancien.nb}});
  verif('Rotation : cours A 1→2→3 puis fin, cours B 4→5→6 puis fin',rot.r==='1,2,3,fin,4,5,6,fin',rot.r);
  verif('Rotation : un ancien QR (sans tours ni décalage) marche comme avant',rot.ancien==='1/6',rot.ancien);
  /* ---------- 7. Prof : groupes reconstitués, groupe et classe corrigés à la main ---------- */
  const gr=await P.evaluate(()=>{const t=Date.now()-3*864e5;DB.classes['1Z1']={eleves:['ALPHA Ana','BETA Ben','GAMMA Gus','DELTA Dan']};
    const mk=(c,n,ts)=>{DB.el[cle(c,n)]={nom:n,classe:c,v:{'1A':{e:ts,par:'x'}},maj:ts,recu:ts}};
    mk('1Z1','ALPHA Ana',t);mk('1Z1','BETA Ben',t);mk('?','Gus',t+60000);mk('?','Dan',t+60000);
    DB.classe='1Z1';DB.vueGr=true;DB.eleve=null;DB.vue='tableau';rendre();const r={};r.rec=/Reconstitué 1/.test($('#app').innerText);
    DB.classe='?';DB.eleve=cle('?','Gus');rendre();r.prop=$('#mv-nom').value;$('#mv-cl').value='1Z1';$('#mv-cl').dispatchEvent(new Event('change',{bubbles:true}));
    $('#mv-nom').value='GAMMA Gus';$('[data-act="mvcl"]').click();r.mv=!!DB.el[cle('1Z1','GAMMA Gus')]&&!DB.el[cle('?','Gus')]&&!!DB.el[cle('1Z1','GAMMA Gus')].v['1A'];
    const s=$('select[data-grman]');s.value='4';s.dispatchEvent(new Event('change',{bubbles:true}));DB.eleve=null;DB.classe='1Z1';rendre();r.man=/Groupe 4\s*Gus/.test($('#app').innerText);
    importerObjet({a:'GYM',v:1,t:'G',c:'1Z1',g:'zz',lt:'2',ts:Math.round(Date.now()/1000)+5,el:[{n:'GAMMA Gus',s:''},{n:'ALPHA Ana',s:''}]},'QR');rendre();r.fiche=/Groupe 2\s*Ana · Gus|Groupe 2\s*Gus · Ana/.test($('#app').innerText);
    return r});
  verif('Prof : groupes reconstitués d’après les anciennes fiches',gr.rec);
  verif('Prof : élève de la classe « ? » rattaché au nom de la liste, validations gardées',gr.mv,JSON.stringify(gr));
  verif('Prof : groupe choisi à la main affiché',gr.man);
  verif('Prof : une fiche plus récente de la tablette reprend la main',gr.fiche);
  /* ---------- 8. Apprendre : volet du groupe ---------- */
  const AP=await page('/gym-eleves/?demo');
  const ap=await AP.evaluate(()=>{try{fermer()}catch(e){}NAV=[];S.tab='apprendre';S.cur=0;rendre();const r={};r.lignes=document.querySelectorAll('.vgr tbody tr').length;r.n=S.eleves.length;
    document.querySelector('.vgr tbody tr[data-v="1"]').click();r.cur=S.cur;r.tab=S.tab;
    r.abr=document.querySelector('.etat-at .qui-at').textContent;NAV=[{v:'atelier',a:1}];rendre();r.chips=document.querySelectorAll('.qui-niv span').length;return r});
  verif('Apprendre : une ligne par élève dans « Où en est le groupe »',ap.lignes===ap.n&&ap.n>1,JSON.stringify(ap));
  verif('Apprendre : toucher un nom le rend actif sans quitter Apprendre',ap.cur===1&&ap.tab==='apprendre');
  verif('Apprendre : abréviation devant les pastilles des ateliers',ap.abr.length>=2);
  verif('Apprendre : page atelier, élèves ayant validé chaque niveau',ap.chips>0);
  verif('Aucune erreur JavaScript',errs.length===0,errs.join(' | '));
  await b.close();
  console.log('\n'+ok+' réussis, '+ko+' échoués');
  process.exit(ko?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
