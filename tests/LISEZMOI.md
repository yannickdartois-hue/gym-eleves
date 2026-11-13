# Tests automatiques (gym)

`gym.test.js` teste ensemble l'appli élève et l'outil prof : accueil, vidéos hors ligne par atelier, démo,
personnages des élèves (fiche, envoi, outil prof), circuit complet (QR de classe → fiche du groupe → demande « Montrer au professeur » → P signé → réponse
sur le téléphone), refus d'un P falsifié ou envoyé par un téléphone, note (inapte partiel, dispensé),
code du cours sur un niveau ⚠️, absence d'erreur JavaScript.

GitHub le lance à chaque mise en ligne de `gym-eleves` ou de `gym-prof` (`.github/workflows/tests.yml`).
Un mail « All jobs have failed » veut dire qu'une modification a cassé quelque chose.

En local, depuis le dossier qui contient les deux dépôts :

    python3 -m http.server 8840
    node gym-eleves/tests/gym.test.js
