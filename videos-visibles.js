/* =====================================================================
   videos-visibles.js — v1.3 : le compteur de vidéos hors ligne ne compte
   que les ateliers visibles (chargé après app.js ; app.js n'est pas modifié)
   Avant : le bandeau comptait aussi les vidéos des ateliers cachés
   (barres asymétriques, liaisons), que « Télécharger le reste » ne
   télécharge pas → « Il reste 17 Mo » puis « Déjà sur le téléphone ».
   ===================================================================== */
'use strict';
{
  const visibles=()=>[...new Set(groupesHL().flatMap(g=>g.v))];
  /* même bandeau qu’avant (texte inchangé), mais sur les vidéos des ateliers visibles */
  bandeauHLtxt=function(){const tous=visibles(),n=tous.filter(f=>HL.has(f)),reste=tous.filter(f=>!HL.has(f));
  if(!reste.length)return `<p class="hlok">✓ ${tous.length} vidéos sur le téléphone : elles marchent sans réseau.</p>`;
  return `<div class="hlko"><b>⚠ ${n.length} / ${tous.length} vidéos sur ce téléphone.</b> Sans elles, certaines vidéos ne se chargeront pas au gymnase.<div class="rangee" style="margin-top:8px"><button class="bt act" type="button" data-act="charger" data-v="tout">⬇ Télécharger ${n.length?'le reste':'les vidéos'} (${mo(poids(reste))})</button></div><p class="small" style="margin:6px 0 0">Avec le Wi-Fi, pas les données mobiles.</p><div class="progres" id="prog2" hidden><i></i></div></div>`};
  const _compter=compterHL;
  compterHL=async function(){await _compter();const el=$('#nb-hl');if(el){const t=visibles(),n=t.filter(f=>HL.has(f));el.textContent=n.length+' / '+t.length+' vidéos ('+mo(poids(n))+')'}};
}
