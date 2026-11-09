/* aide.js — mode d'emploi de l'appli élève de gymnastique (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Gymnastique · Élève',bouton:false,publics:[
{id:'eleve',titre:'Élève',chapitres:[
{t:'🔑 Code du cours',html:`<ul>
<li>Au début du cours, le professeur écrit un <b>code à 4 chiffres</b>. Touche <span class="bouton">🔑 Code du cours</span> et tape-le : les niveaux ⚠️ peuvent être validés E pendant 2 heures.</li>
<li>Le code n’est demandé que pour les niveaux ⚠️, au moment de valider E.</li>
<li>Code refusé ? Vérifie que la date du téléphone est juste. Après 5 erreurs, attends 1 minute.</li>
</ul>`},

{t:'Commencer (premier cours)',html:`<ol>
<li><span class="bouton">📷 QR de la classe (prof)</span> : vise le QR que le professeur affiche. La liste de la classe arrive sur la tablette.</li>
<li><span class="bouton">＋ Nouveau groupe</span> : choisis ta classe, puis un <b>code secret à 4 chiffres</b> (tapé deux fois). Retenez-le : il ouvre votre carnet à chaque cours. Un autre groupe ne peut pas le lire.</li>
<li>Onglet <b>Groupe</b> : cochez vos noms dans la liste de la classe (2 à 8 élèves). Sans liste, <span class="bouton">Écrire prénom et nom</span> : prénom ET nom de famille.</li>
</ol><p class="astuce">Aux cours suivants : touche votre groupe sur l’accueil, puis le code. Le carnet se verrouille seul après 20 minutes sans toucher l’écran.</p>`},
{t:'Ma fiche : E et P',html:`<ul>
<li>En haut, touche le <b>prénom de l’élève</b> qui travaille : chacun a sa fiche.</li>
<li>6 ateliers, niveaux <b>A à F</b>. Touche un niveau pour voir la vidéo, les consignes, le matériel et les critères.</li>
<li><b>E</b> : un camarade t’observe. Il choisit son nom dans « Qui observe ? », coche les 2 critères, « réussi du premier coup » et « réception maîtrisée », puis <span class="bouton">✔ Valider E</span>.</li>
<li>Raté ? Il laisse décochés les critères ratés et touche <span class="bouton">✗ Pas encore réussi</span> : l’appli te propose un exercice plus facile pour travailler ce point.</li>
<li><b>P</b> : le professeur valide les P <b>à partir de la 3<sup>e</sup> séance</b> seulement. Touche <span class="bouton">📲 Montrer au professeur</span>. Il scanne le QR, te regarde faire et valide sur son iPad. Puis touche <span class="bouton">📷 Scanner la réponse du prof</span> et vise son écran : le P s’affiche. S’il n’a pas le temps, le P arrivera avec le QR de la classe.</li>
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
</ol><p class="astuce">Code oublié ? Touchez votre groupe, puis <b>Code oublié ?</b> : un QR s’affiche, le professeur le scanne et vous redonne votre code. (Possible dès que le groupe a scanné le QR de la classe puis tapé son code une fois.) Sinon : créez un nouveau groupe et choisissez vos noms dans la liste ; les niveaux déjà reçus par le professeur reviennent avec le QR de la classe.</p>`},
{t:'Changer de téléphone ou de tablette',html:`<ol>
<li>Sur l’<b>ancien</b> téléphone : ouvrez le carnet → onglet <b>Groupe</b> → <span class="bouton">Transférer vers un autre téléphone</span>. Un QR code s’affiche.</li>
<li>Sur le <b>nouveau</b> téléphone : Accueil → <span class="bouton">📲 Reprendre un carnet</span> → <span class="bouton">📷 Scanner le QR</span>, puis tapez votre code secret habituel.</li>
<li>Quand le carnet s’affiche sur le nouveau téléphone : sur l’ancien, touchez <span class="bouton">C’est transféré : retirer d’ici</span>. Ensuite, travaillez seulement sur le nouveau.</li>
</ol><p class="astuce">Pas de caméra ou QR trop gros ? <span class="bouton">📄 Fichier (secours)</span> : envoyez le fichier au nouveau téléphone (AirDrop, Bluetooth, message), puis <b>Reprendre un carnet → Choisir le fichier</b>. Le fichier est chiffré : sans votre code, il ne s’ouvre pas.</p>`},
{t:'Nouvelle version, hors ligne, démo',html:`<ul>
<li>Un bandeau jaune « Nouvelle version » : touche <span class="bouton">Mettre à jour</span> (le carnet est enregistré avant).</li>
<li>Sans Wi-Fi, l’appli fonctionne. Pour voir les vidéos au gymnase sans Wi-Fi : Accueil → <b>Réglages : vidéos hors ligne</b> → <span class="bouton">⬇ Garder</span> sur les ateliers que tu travailles (le poids est affiché), avec le Wi-Fi. <span class="bouton">Effacer les vidéos du téléphone</span> libère la place.</li>
<li><span class="bouton">Essayer l’appli (démo)</span> sur l’accueil : un groupe fictif pour tout essayer, rien n’est enregistré (le bouton « Démo : simuler le prof » remplace l’iPad du professeur).</li>
</ul>`}
]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Avant le premier cours',html:`<ol>
<li>Outil prof → Réglages : importez la liste Pronote.</li>
<li>Affichez le <b>QR de démarrage</b> de la classe : chaque tablette le scanne (accueil → « QR de la classe »).</li>
<li>Si le gymnase n’a pas de Wi-Fi : demandez aux élèves, la veille et avec le Wi-Fi, de garder les vidéos des ateliers du jour (Accueil → Réglages : vidéos hors ligne ; 2 à 20 Mo par atelier, 87 Mo en tout).</li>
</ol>`},
{t:'Sur la tablette d’un groupe',html:`<ul>
<li><b>Validation P</b> : l’élève touche « Montrer au professeur » ; dans votre outil, À valider → <span class="bouton">📷 Valider un élève</span>, scannez, validez, puis montrez votre réponse à l’élève. Même chemin pour « Le professeur ouvre ce niveau ». Aucun code n’est tapé sur les téléphones.</li>
<li>Le QR de la classe porte aussi vos validations P : refaites-le scanner pour que les P donnés dans l’outil prof apparaissent sur les tablettes.</li>
<li>Barres asymétriques : cachées tant que vous ne les activez pas pour la classe (outil prof → Réglages).</li>
</ul>`}
]}
]};
