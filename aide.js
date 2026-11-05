/* aide.js — mode d'emploi de l'appli élève de gymnastique (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Gymnastique · Élève',bouton:false,publics:[
{id:'eleve',titre:'Élève',chapitres:[
{t:'Commencer (premier cours)',html:`<ol>
<li><span class="bouton">📷 QR de la classe (prof)</span> : vise le QR que le professeur affiche. La liste de la classe arrive sur la tablette.</li>
<li><span class="bouton">＋ Nouveau groupe</span> : choisis ta classe, puis un <b>code secret à 4 chiffres</b> (tapé deux fois). Retenez-le : il ouvre votre carnet à chaque cours. Un autre groupe ne peut pas le lire.</li>
<li>Onglet <b>Groupe</b> : cochez vos noms dans la liste de la classe (2 à 8 élèves). Sans liste, <span class="bouton">Écrire prénom et nom</span> : prénom ET nom de famille.</li>
</ol><p class="astuce">Aux cours suivants : touche votre groupe sur l’accueil, puis le code. Le carnet se verrouille seul après 10 minutes sans toucher l’écran.</p>`},
{t:'Ma fiche : E et P',html:`<ul>
<li>En haut, touche le <b>prénom de l’élève</b> qui travaille : chacun a sa fiche.</li>
<li>6 ateliers, niveaux <b>A à F</b>. Touche un niveau pour voir la vidéo, les consignes, le matériel et les critères.</li>
<li><b>E</b> : un camarade t’observe. Il choisit son nom dans « Qui observe ? », coche les 2 critères, « réussi du premier coup » et « réception maîtrisée », puis <span class="bouton">✔ Valider E</span>.</li>
<li>Raté ? Il laisse décochés les critères ratés et touche <span class="bouton">✗ Pas encore réussi</span> : l’appli te propose un exercice plus facile pour travailler ce point.</li>
<li><b>P</b> : montre ton élément au professeur ; lui seul tape son code pour valider P.</li>
<li>Un niveau s’ouvre quand le précédent est validé E (🔒 sinon). « Simple et correct vaut mieux que difficile et incorrect ».</li>
</ul>`},
{t:'Sécurité et niveaux ⚠️',html:`<ul>
<li>Les niveaux marqués ⚠️ (saltos, trampoline E et F) se travaillent <b>seulement en présence du professeur</b>, parade en place.</li>
<li>Pour les débloquer, chaque élève réussit d’abord le <b>quiz sécurité</b> (6 questions, toutes justes).</li>
<li>Page <b>Apprendre → Sécurité, parade et aide</b> : à relire avant chaque séance.</li>
</ul>`},
{t:'Apprendre : vidéos, aides, flèches',html:`<ul>
<li>Onglet <b>Apprendre</b> : les 6 ateliers (cadre de couleur), le flip arrière et les éléments de liaison. Pas besoin d’ouvrir le carnet.</li>
<li>Sous chaque vidéo : <span class="bouton">Ralenti ×½</span>, <span class="bouton">×¼</span>, <span class="bouton">🔁 En boucle</span>.</li>
<li>Le <b>?</b> rouge « Je n’y arrive pas ? » mène à un exercice plus facile ; « Encore trop difficile ? » au suivant.</li>
<li>Flèches <b>‹ ›</b> (ou glisser le doigt) : niveau précédent / suivant, aide précédente / suivante.</li>
<li>🔊 lit les consignes et les critères à voix haute. Touche une image pour l’agrandir.</li>
</ul>`},
{t:'Me filmer, objectif, enchaînement',html:`<ul>
<li><b>🎥 Me filmer et me comparer</b> (sur la page d’un niveau) : un camarade te filme, puis ta vidéo s’affiche à côté du modèle, au ralenti. Elle n’est <b>pas enregistrée</b> : elle disparaît quand tu quittes la page.</li>
<li><b>🎯 Mon objectif du jour</b> : touche-le sur le niveau que tu travailles aujourd’hui ; il s’affiche en haut de ta fiche et le professeur le voit.</li>
<li><b>🧩 Mon enchaînement</b> : assemble tes éléments validés et des éléments de liaison, dans l’ordre que tu veux (↑ ↓).</li>
<li><b>🔄 Rotation</b> : si le professeur a lancé une rotation, indique votre numéro de groupe ; la fiche affiche l’atelier où aller et le temps restant.</li>
</ul>`},
{t:'Fin du cours : envoyer',html:`<ol>
<li>Onglet <b>Envoyer</b> : <span class="bouton">▦ Montrer le QR code</span> au professeur, qui le scanne. Ou <span class="bouton">📄 Enregistrer le fichier</span> puis déposez-le dans le Nuage (lien donné par le professeur).</li>
<li><span class="bouton">🔒 Fermer</span> en haut pour verrouiller le carnet.</li>
</ol><p class="astuce">Code oublié ? Personne ne peut rouvrir le carnet. Créez un nouveau groupe et choisissez vos noms dans la liste : les niveaux déjà reçus par le professeur reviennent quand il fait scanner le QR de la classe.</p>`},
{t:'Nouvelle version, hors ligne, démo',html:`<ul>
<li>Un bandeau jaune « Nouvelle version » : touche <span class="bouton">Mettre à jour</span> (le carnet est enregistré avant).</li>
<li>Sans Wi-Fi, l’appli fonctionne. Pour garder toutes les vidéos sur la tablette : Accueil → Réglages de la tablette → <span class="bouton">Garder toutes les vidéos hors ligne</span>, une fois avec le Wi-Fi.</li>
<li><span class="bouton">Essayer l’appli (démo)</span> sur l’accueil : un groupe fictif pour tout essayer, rien n’est enregistré (code professeur de la démo : 0000).</li>
</ul>`}
]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Avant le premier cours',html:`<ol>
<li>Outil prof → Réglages : choisissez votre <b>code de validation</b> (4 à 8 chiffres), importez la liste Pronote.</li>
<li>Affichez le <b>QR de démarrage</b> de la classe : chaque tablette le scanne (accueil → « QR de la classe »).</li>
<li>Avec le Wi-Fi, sur chaque tablette : Réglages de la tablette → <span class="bouton">Garder toutes les vidéos hors ligne</span> (≈ 90 Mo).</li>
</ol>`},
{t:'Sur la tablette d’un groupe',html:`<ul>
<li><span class="bouton">🔐 Validation P</span> : tapez votre code. <span class="bouton">Le professeur ouvre ce niveau</span> : débloque un niveau sans le précédent.</li>
<li>Le QR de la classe porte aussi vos validations P : refaites-le scanner pour que les P donnés dans l’outil prof apparaissent sur les tablettes.</li>
<li>Barres asymétriques : cachées tant que vous ne les activez pas pour la classe (outil prof → Réglages).</li>
</ul>`}
]}
]};
