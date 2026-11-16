/* =====================================================================
   groupes-qr.js — v1.2 : retrouver son groupe sur une autre tablette
   (chargé après plus.js ; app.js n'est pas modifié)
   Le QR de la classe peut contenir g = {numéro: [rangs dans la liste]}
   (groupes connus du professeur grâce aux fiches envoyées).
   « Nouveau groupe » → numéro → code : les noms du groupe sont cochés d'avance.
   Les élèves vérifient et peuvent décocher / cocher un autre nom.
   ===================================================================== */
'use strict';
{
  const _rc=recevoirClasse;
  recevoirClasse=function(o){
    const m=_rc(o);
    const C=ROOT.classes[o.c];
    if(C){C.g=o.g&&typeof o.g==='object'?o.g:{};ecrireRoot();
      if(S&&S.classe===o.c&&S.cfg){S.cfg.g=C.g;sauver()}}
    return m;
  };
}
function nomsDuGroupe(){
  if(!S||!S.cfg||!S.lt)return [];
  const g=(S.cfg.g||(ROOT.classes[S.classe]||{}).g||{})[S.lt]||[],L=S.cfg.eleves||[];
  return g.map(i=>L[i]).filter(Boolean);
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-act]');if(!b||b.dataset.act!=='choisirnoms'||!S)return;
  /* app.js vient d'ouvrir la fenêtre « Qui est dans le groupe ? » : on coche les noms connus */
  setTimeout(()=>{
    const N=nomsDuGroupe();if(!N.length||S.eleves.length)return;
    const box=document.querySelector('.liste-el');if(!box)return;
    let n=0;box.querySelectorAll('input[type=checkbox]').forEach(i=>{if(N.includes(i.value)){i.checked=true;n++}});
    if(!n)return;
    const p=document.createElement('p');p.className='small';p.style.cssText='margin:6px 0;font-weight:700';
    p.innerHTML='✔ Groupe '+esc(S.lt)+' la dernière fois : '+n+' nom'+(n>1?'s':'')+' déjà coché'+(n>1?'s':'')+'. Vérifiez, puis touchez « Ajouter ».';
    box.before(p);
  },0);
});
