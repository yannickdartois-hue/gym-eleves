# Gymnastique · appli élève (Lycée Georges Pompidou)

Fiche de co-évaluation CA3 (6 ateliers × niveaux A à F) + fiches de travail interactives (vidéos, consignes, matériel, aides « Je n'y arrive pas »).

- **E** : un camarade observe et coche les critères (co-évaluation).
- **P** : le professeur valide avec son code (empreinte reçue par le QR de la classe).
- Un niveau s'ouvre quand le précédent est validé E (ou quand le professeur l'ouvre).
- Carnet de chaque groupe chiffré avec un code à 4 chiffres ; tablette partagée.
- Envoi : QR code (scanné par l'outil prof) ou fichier JSON (Nuage).
- Hors ligne : PWA ; les vidéos ont leur propre cache (`gym-eleves-media-v1`), à précharger dans Accueil → Réglages de la tablette.

Données générées par `construire_donnees.py` (dossier de travail) depuis le PowerPoint GymEPS-Pompidou-2026 et la fiche « CA3 FICHE gym eleve version trampo ».
Barres asymétriques : présentes mais cachées tant que le professeur ne les active pas pour la classe.

## Changer de téléphone (transfert du carnet)

Fichier `transfert.js` (ajouté à côté d’`app.js`, qui n’est pas modifié).

- Ancien téléphone : carnet ouvert → onglet **Groupe** → **Transférer vers un autre téléphone** → QR code (ou **Fichier (secours)** si le QR est trop dense ou sans caméra).
- Nouveau téléphone : Accueil → **📲 Reprendre un carnet** → scanner le QR ou choisir le fichier → code secret habituel du groupe.
- Le carnet voyage chiffré avec la clé du groupe (même code, même sel) : sans le code, illisible. Les noms complets ne quittent pas les deux appareils.
- Une fois le carnet affiché sur le nouveau téléphone : **C’est transféré : retirer d’ici** sur l’ancien. Deux copies ne fusionnent pas.
- Si la classe n’est pas encore sur le nouveau téléphone, scanner ensuite le QR de la classe (professeur).
