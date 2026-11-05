#!/usr/bin/env python3
"""Construit donnees.js + médias de l'appli gym à partir du PowerPoint (diapos dézippées) et de la fiche Word."""
import json, re, os, shutil, subprocess, sys
B = os.path.dirname(os.path.abspath(__file__))
MED = '/mnt/user-data/uploads/Gym/ppt/media/'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(B, 'sortie')
S = {x['s']: x for x in json.load(open(B + '/slides.json'))}
M = json.load(open(B + '/media_map.json'))
F = json.load(open(B + '/fiche.json'))
LIENS = json.load(open(B + '/liens.json'))  # liens des images cliquables de chaque diapo (relevés dans le PowerPoint)

def net(t):
    t = t.replace('\xa0', ' ').replace('&amp;', '&')
    t = re.sub(r'(groupé|écart|arrière)sur', r'\1 sur', t)
    t = t.replace('réussidu', 'réussi du').replace('pie ', 'pied ').replace('Grant jeté', 'Grand jeté').replace('cisonne', 'cisaille')
    t = re.sub(r'\s*&\s*', ' & ', t); t = re.sub(r'(\d)pieds', r'\1 pieds', t)
    t = re.sub(r'(?<=\w)&(?=\w)', ' & ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t[0].upper() + t[1:] if t else t

def critnet(c):
    c = net(c).replace('Sursaut & impulsion2 pieds', 'Sursaut & impulsion 2 pieds').replace('impulsion2', 'impulsion 2')
    return c

# ---------- images de contenu (hors navigation) ----------
from collections import Counter
cnt = Counter(p[0] for v in M.values() for p in v['pics'])
# Liens « ? » du PowerPoint corrigés (ils renvoyaient vers la roulade avant écart ou le niveau suivant)
Q_CORRIGE = {70: [71], 57: [58], 59: [60], 54: []}
QDECO = {'image106.png', 'image145.png', 'image196.png', 'image222.png', 'image230.png'}
def images(i):
    # les petits bonshommes « ? » décoratifs ne sont pas des images de contenu
    return [p[0] for p in M[str(i)]['pics'] if cnt[p[0]] < 4 and not p[2] and p[0] not in QDECO]

AT = {'Roulade Avant': 1, 'Roulade Arrière': 2, 'ATR': 3, 'Roue': 4, 'Saut': 5}
FICHES = {}
PLACE = {}  # (atelier, niveau) -> {'f':[...], 'r':[...]}
BONUS = {'flip': [], 'liaisons': [], 'barres': []}
# corrections : diapos mal étiquetées ou à classer en « si je n'y arrive pas »
REM_FORCE = {24, 25, 30, 51, 52, 53, 79, 80, 81, 82, 97}
NIV_FORCE = {80: 'D', 81: 'D', 82: 'D', 79: 'D'}
vids_utiles = set(); imgs_utiles = set()
for i in range(17, 131):
    x = S[i]; t = x['titre'] or []
    if not t: continue
    head = t[0]; sous = t[1] if len(t) > 1 else ''
    v = [m for m in M[str(i)]['vid'] if m.startswith('media')]
    lab = [net(l) for l in x['lab'] if l.strip() and l.strip() not in ('OU', 'E.P.S.', 'GYM') and 'Rostand' not in l and 'Thèmes' not in l]
    mniv = re.search(r'Niveau ([A-F])', sous)
    niv = NIV_FORCE.get(i, mniv.group(1) if mniv else '')
    rem = bool(re.search(r'[Rr]emédiation|explication', sous)) or i in REM_FORCE
    if head.startswith('Liaison'):
        titre = net(head.replace('Liaison ', ''))
        grp = 'liaisons'
    elif head.startswith('Flip'):
        grp = 'flip'; titre = lab[0] if lab else 'Flip arrière'
    elif head.startswith('Barres'):
        grp = 'barres'; titre = 'Niveau ' + niv
    else:
        grp = None
        titre = net(sous.split(':', 1)[1]) if ':' in sous else (lab[0] if lab else head)
    titre = re.sub(r'\s*\((remédiation|remediation)[^)]*\)', '', titre, flags=re.I).strip()
    if 'explication' in sous: titre += ' — explication'
    vl = []
    for k, m in enumerate(v):
        nom = 'v' + m[5:-4] + '.mp4'
        lb = lab[k] if (len(v) > 1 and k < len(lab)) else ''
        vl.append([nom, re.sub(r'\s*\((remédiation|remediation)[^)]*\)', '', lb, flags=re.I).strip()])
        vids_utiles.add(m)
    im = images(i)
    if grp == 'barres': im = []  # les pictos barres font doublon avec les vidéos légendées
    for p in im: imgs_utiles.add(p)
    FICHES[i] = {'t': titre, 'niv': niv, 'rem': rem, 'cons': [net(c) for c in x['cons']],
                 'mat': [net(c) for c in x['mat']], 'vid': vl,
                 'img': ['i' + re.sub(r'\D', '', p) + '.' + ('jpg' if p.endswith(('jpeg', 'jpg')) else 'png') for p in im]}
    # « ? » du PowerPoint : exercice(s) de remédiation proposé(s) si l'élève n'y arrive pas
    FICHES[i]['q'] = [t for img, t in LIENS.get(str(i), []) if img in ('image96.png', 'image157.png', 'image229.png', 'image240.png') and t != i]
    if i in Q_CORRIGE: FICHES[i]['q'] = Q_CORRIGE[i]
    if grp:
        BONUS[grp].append(i)
    else:
        a = next(v for k, v in AT.items() if head.startswith(k))
        d = PLACE.setdefault(f'{a}{niv}', {'f': [], 'r': []})
        (d['r'] if rem else d['f']).append(i)

# fiches de remédiation dont le titre d'origine était une « Remédiation » sous le niveau : numéroter
NOMS = {1: 'Roulade avant → Salto', 2: 'Roulade arrière → Salto', 3: 'ATR → Saut de mains', 4: 'Roue → Rondade', 5: 'Saut (table)', 6: 'Trampoline'}
COURT = {1: 'Roulade avant', 2: 'Roulade arrière', 3: 'ATR', 4: 'Roue', 5: 'Saut', 6: 'Trampoline'}
PRESENCE_PROF = {'1D', '1E', '1F', '2D', '2E', '2F', '6E', '6F'}
ateliers = []
for a in range(1, 7):
    niv = []
    for r in F[str(a)]:
        k = f"{a}{r['n']}"
        pl = PLACE.get(k, {'f': [], 'r': []})
        pic = f"pictos/a{k}.png" if os.path.exists(f"{B}/pictos/a{k}.png") else ''
        niv.append({'n': r['n'], 'nom': net(r['nom']), 'crit': [critnet(c) for c in r['crit']], 'picto': pic,
                    'f': pl['f'], 'r': pl['r'], 'prof': k in PRESENCE_PROF})
    ateliers.append({'n': a, 'nom': NOMS[a], 'court': COURT[a], 'niv': niv})

# ---------- Trampoline : vidéos à part (dossier « Trampoline/Fait » de Yannick, recompressées en 720p dans trampo/) ----------
# (niveau, numéro de fiche, titre, fichier) — une vidéo absente du dossier est simplement ignorée
TRAMPO = [('A', 201, 'Les chandelles', 'chandelles'), ('A', 202, 'Le demi-tour', 'demi-tour'),
          ('B', 203, 'Sauts groupé, carpé, écart', 'groupe-carpe-ecart'),
          ('C', 204, 'Le tomber assis', 'tomber-assis'), ('D', 205, 'Le tomber dos', 'tomber-dos'),
          ('E', 206, 'Le pull over avant (piqué)', 'pique'), ('E', 207, 'Le salto avant', 'salto-avant'),
          ('F', 208, 'Le pull over arrière', 'pull-over'), ('F', 209, 'Le salto arrière', 'salto-arriere')]
TR_VIDS = {}
for nv, num, titre, fic in TRAMPO:
    src = f'{B}/trampo/{fic}.mp4'
    if not os.path.exists(src): continue
    FICHES[num] = {'t': titre, 'niv': nv, 'rem': False, 'cons': [], 'mat': ['Trampoline', 'Parade autour de la toile'], 'vid': [[f'v{num}.mp4', '']], 'img': [], 'q': []}
    TR_VIDS[f'v{num}'] = src
    next(n for n in ateliers[5]['niv'] if n['n'] == nv)['f'].append(num)

def txt(i):
    x = S[i]; return [net(l) for l in (x['lab'] + x['mat'] + x['cons'])]
s3, s4, s132 = S[3], S[4], S[132]
para = net(s3['lab'][0]); interd = net(s3['lab'][1])
GYM = {
    'ateliers': ateliers,
    'fiches': FICHES,
    'bonus': [
        {'id': 'flip', 'nom': 'Flip arrière', 'info': 'Pour aller plus loin après la roulade arrière et la rondade.', 'f': BONUS['flip']},
        {'id': 'liaisons', 'nom': 'Éléments de liaison', 'info': 'Sauts, tours et pas pour relier les éléments d’un enchaînement.', 'f': BONUS['liaisons']},
        {'id': 'barres', 'nom': 'Barres asymétriques', 'info': 'Atelier gardé en réserve : le professeur l’affiche s’il en a besoin.', 'f': BONUS['barres'], 'cache': True},
    ],
    'trampo': {'cons': [net(c) for c in s132['cons']], 'mat': [net(c) for c in s132['mat']], 'img': ['i80.png', 'i291.png']},
    'securite': {
        'regles': [net(c) for c in s3['mat']],
        'parade': 'Parade : assurer la sécurité du partenaire en cas de difficulté (déséquilibre, mauvaise impulsion…).',
        'aide': 'Aide : accompagner le partenaire du début à la fin pour l’aider à réaliser l’élément travaillé.',
        'crit': ['Je me place bien par rapport au partenaire et à l’élément (ni trop près, ni trop loin, de profil…).',
                 'Je reste attentif du début à la fin de l’élément.',
                 'Je communique simplement, sans crier, avec un code convenu entre nous.'],
        'interdit': ['Interdit de travailler un élément d’un niveau supérieur sans avoir validé le précédent.',
                     'Interdit de travailler d’autres éléments que ceux de la progression.'],
        'img': ['i9.png'],
    },
    'validation': {
        'regles': ['L’élément doit être réussi du premier coup.', 'Les critères de réussite sont respectés.', 'La réception est maîtrisée.'],
        'qui': 'E : un camarade observe et coche (co-évaluation). P : seul le professeur valide le niveau.',
        'devise': '« Simple et correct vaut mieux que difficile et incorrect »',
        'img': ['i11.png'],
    },
}
os.makedirs(OUT + '/media', exist_ok=True); os.makedirs(OUT + '/img', exist_ok=True); os.makedirs(OUT + '/pictos', exist_ok=True)
for p in imgs_utiles | {'image80.png', 'image291.png', 'image9.png', 'image11.png', 'image4.png'}:
    dst = OUT + '/img/i' + re.sub(r'\D', '', p) + '.' + ('jpg' if p.endswith(('jpeg', 'jpg')) else 'png')
    if p.endswith('.gif'): continue
    if not os.path.exists(dst): shutil.copy(MED + p, dst)
from PIL import Image
for p in os.listdir(B + '/pictos'):
    im = Image.open(B + '/pictos/' + p).convert('RGBA'); bg = Image.new('RGBA', im.size, 'white'); bg.alpha_composite(im); bg = bg.convert('RGB')
    if bg.height > 160: bg = bg.resize((int(bg.width * 160 / bg.height), 160), Image.LANCZOS)
    bg.quantize(32).save(OUT + '/pictos/' + p, optimize=True)
dur = {}
for m in sorted(vids_utiles):
    nom = 'v' + m[5:-4]
    dst = OUT + '/media/' + nom + '.mp4'
    if not os.path.exists(dst):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', MED + m, '-c', 'copy', '-movflags', '+faststart', dst], check=True)
    po = OUT + '/media/' + nom + '.jpg'
    if not os.path.exists(po):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', dst, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '6', po], check=True)
    d = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout.strip() or 0)
    dur[nom] = round(d)
for nom, src in TR_VIDS.items():
    dst = OUT + '/media/' + nom + '.mp4'
    if not os.path.exists(dst) or os.path.getmtime(dst) < os.path.getmtime(src): shutil.copy(src, dst)
    po = OUT + '/media/' + nom + '.jpg'
    if not os.path.exists(po):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '4', '-i', dst, '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '6', po], check=True)
    dur[nom] = round(float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout.strip() or 0))
GYM['duree'] = dur
open(OUT + '/donnees.js', 'w').write('/* Données gym — générées par construire_donnees.py depuis le PowerPoint et la fiche CA3. Ne pas modifier à la main. */\nconst GYM=' + json.dumps(GYM, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('fiches', len(FICHES), 'vidéos', len(vids_utiles), 'images', len(imgs_utiles))
for a in ateliers:
    print(a['nom'], [(n['n'], n['f'], n['r']) for n in a['niv']])
print({k: v for k, v in BONUS.items()})
