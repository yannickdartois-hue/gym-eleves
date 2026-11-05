#!/usr/bin/env python3
"""Écrit media-tailles.js : poids de chaque vidéo de media/ (pour afficher les Mo par atelier).
À relancer après tout changement de vidéo :  python3 outils/tailles_media.py"""
import os,json
ici=os.path.dirname(os.path.abspath(__file__));racine=os.path.dirname(ici)
d={f:os.path.getsize(os.path.join(racine,'media',f)) for f in sorted(os.listdir(os.path.join(racine,'media'))) if f.endswith('.mp4')}
open(os.path.join(racine,'media-tailles.js'),'w',encoding='utf-8').write('/* Généré par outils/tailles_media.py — ne pas modifier à la main. */\nconst TAILLES='+json.dumps(d,separators=(',',':'))+';\n')
print(len(d),'vidéos,',round(sum(d.values())/1e6,1),'Mo')
