#!/usr/bin/env python3
"""Build wordlist-v2.csv for 小词芽 WordSprout from raw sources in /workspace/wordlists.
Raw sources are NOT in git (see docs/wordlist-sources.md and data/README-wordlist-v2.md). Re-run: python3 data/build_wordlist_v2.py
"""
import csv, json, re, glob, os, collections, sys
W = os.environ.get('WORDLISTS', '/workspace/wordlists')
HERE = os.path.dirname(os.path.abspath(__file__))
OVR = os.path.join(HERE, 'wordlist-v2-overrides.json')
LEGACY = os.path.join(HERE, '..', 'src', 'data', 'lexicon.json')

def norm(s):
    s = s.replace('’', "'").strip()
    s = re.sub(r'\(.*?\)', '', s)          # drop (UK flat), (pl. children)
    s = re.sub(r'\(.*$', '', s)            # unclosed "(as in ..."
    s = s.split('/')[0].strip()            # child/children -> child
    s = re.sub(r'\s+', ' ', s).strip(' .,')
    return s

KEEP_CAPS = {'I','OK','TV','PE','English','Chinese','China','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday',
 'January','February','March','April','May','June','July','August','September','October','November','December'}
def key(w):
    return w if w in KEEP_CAPS else w.lower()

# ---------- sources ----------
yle = {}   # key -> (band_lo, pos, level)
YLEB = {'starters': 1, 'movers': 3, 'flyers': 5}
for r in csv.DictReader(open(f'{W}/yle/yle_wordlist.csv')):
    h = norm(r['headword'])
    if not h or h.startswith('No words') or h in ('Letters & numbers',): continue
    if h[0].isupper() and h not in KEEP_CAPS: continue   # names (Alex, Ann...), titles
    if r['pos'] in ('title',): continue
    k = key(h)
    if k not in yle or YLEB[r['level']] < yle[k][0]:
        yle[k] = (YLEB[r['level']], r['pos'], r['level'])

THEME = {'Animals':'animals','The body':'body','Clothes':'clothes','Colours':'colors','Family':'family','Food':'food',
 'Health':'health','The home':'home','Materials':'materials','Numbers':'numbers','Places':'places','School':'school',
 'Sports':'sports','Time':'time','Toys':'toys','Transport':'transport','Weather':'weather','Work':'jobs','The world':'nature'}
yle_topic = {}
for r in csv.DictReader(open(f'{W}/yle/yle_themes.csv')):
    t = next((v for p, v in THEME.items() if r['theme'].startswith(p)), None)
    if not t: continue
    k = key(norm(r['word']))
    yle_topic.setdefault(k, t)

kebiao = set()
for l in open(f'{W}/kebiao/kebiao_level2_505.txt'):
    for part in l.strip().split('/'):    # a/an
        if part.strip(): kebiao.add(key(norm(part)))

dolch = {}
DL = {'Pre-primer':0,'Primer':1,'First':2,'Second':3,'Third':4}
for r in csv.DictReader(open(f'{W}/dolch/dolch-sight-words.csv', encoding='utf-8-sig')):
    g = next(v for p, v in DL.items() if r['group'].startswith(p))
    dolch[key(r['word'].strip())] = g
for r in csv.DictReader(open(f'{W}/dolch/dolch-nouns.csv', encoding='utf-8-sig')):
    dolch.setdefault(key(r['word'].strip()), 1)   # nouns ~ primer level
DOLCH_NAME = {0:'pre-primer',1:'primer',2:'first',3:'second',4:'third'}

cefr = {}; cefr_pos = {}
LV = {'A1':1,'A2':2,'B1':3,'B2':4}
for r in csv.DictReader(open(f'{W}/olp-en-cefrj/cefrj-vocabulary-profile-1.5.csv')):
    for h in r['headword'].split('/'):
        k = key(h.strip())
        if k not in cefr or LV[r['CEFR']] < LV[cefr[k]]:
            cefr[k] = r['CEFR']; cefr_pos[k] = r['pos']

pep = {}
for f in sorted(glob.glob(f'{W}/pep/g*-s*.json')):
    g = int(re.search(r'g(\d)', f).group(1))
    for u in json.load(open(f))['units']:
        for w in u['words']:
            k = key(norm(w['en']))
            if k and (k not in pep or g < pep[k]): pep[k] = g

ec = {}
need = None
legacy = json.load(open(LEGACY))
leg = {}; leg_topic = {}
for w in legacy['words']:
    k = key(w['en']); leg.setdefault(k, w); leg_topic.setdefault(k, w['topicId'])

ovr = json.load(open(OVR)) if os.path.exists(OVR) else {}
DROP = set(ovr.get('drop', []))
ZH = ovr.get('zh', {})
TOPIC = ovr.get('topic', {})
GRADE = ovr.get('grade', {})
RENAME = ovr.get('rename', {})

# numbers per YLE spec (Starters 1-20, Movers 21-100 + ordinals 1st-20th, Flyers 101-1000)
NUM = {}
for i, n in enumerate('one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(), 1):
    NUM[n] = 1
for n in 'thirty forty fifty sixty seventy eighty ninety hundred first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth thirteenth fourteenth fifteenth sixteenth seventeenth eighteenth nineteenth twentieth'.split():
    NUM[n] = 3
for n in ['thousand', 'twenty-first', 'thirtieth']:
    NUM[n] = 5
DAYS = 'Monday Tuesday Wednesday Thursday Friday Saturday Sunday'.split()
MONTHS = 'January February March April May June July August September October November December'.split()

sub = {}
for i, l in enumerate(open(f'{W}/freq/en_50k.txt'), 1):
    w = l.split()[0]
    sub.setdefault(w, i)
ngsl = {}
for r in csv.DictReader(open(f'{W}/ngsl/NGSL_12_stats.csv', encoding='utf-8-sig')):
    ngsl.setdefault(r['Lemma'].lower(), int(r['SFI Rank']))

# ---------- candidate pool ----------
cand = set(yle) | kebiao | set(dolch) | set(leg) | set(NUM) | set(DAYS) | set(MONTHS)
for k, lv in cefr.items():
    if ' ' in k or not re.fullmatch(r"[A-Za-z'-]+", k): continue
    if lv == 'A1': cand.add(k)
    elif lv == 'A2' and sub.get(k.lower(), 99999) <= 1500 and ngsl.get(k.lower(), 99999) <= 1000: cand.add(k)
for k in pep:   # textbook words only when an open source (CEFR-J A1-B1) also lists them
    if k in cefr and LV[cefr[k]] <= 3 and re.fullmatch(r"[A-Za-z'-]+", k): cand.add(k)
cand = {c for c in cand if c and c.lower() not in DROP and c not in DROP
        and ')' not in c and not c.startswith("'") and '’' not in c and '...' not in c}

# ECDICT lookup (only needed rows)
lk = {c.lower() for c in cand}
for r in csv.DictReader(open(f'{W}/ecdict.csv', encoding='utf-8')):
    if r['word'].lower() in lk and (r['word'].lower() not in ec or r['word'] == r['word'].lower()):
        ec[r['word'].lower()] = r

POSMAP = {'n':'noun','v':'verb','adj':'adj','adv':'adv','prep':'prep','pron':'pron','det':'det','conj':'conj','excl':'excl','int':'question','dis':'excl','poss':'det'}
EPOS = {'n.':'noun','v.':'verb','vt.':'verb','vi.':'verb','a.':'adj','adj.':'adj','ad.':'adv','adv.':'adv','prep.':'prep','pron.':'pron','conj.':'conj','int.':'excl','interj.':'excl','num.':'num','art.':'det'}
CPOS = {'noun':'noun','verb':'verb','adjective':'adj','adverb':'adv','preposition':'prep','pronoun':'pron','determiner':'det','conjunction':'conj','interjection':'excl','number':'num'}

def zh_gloss(k, pos):
    if RENAME.get(k, k) in ZH: return ZH[RENAME.get(k, k)]
    if k in ZH: return ZH[k]
    if k in leg: return leg[k]['zh']
    r = ec.get(k.lower())
    if not r or not r['translation']: return ''
    lines = [x for x in r['translation'].split('\\n') if not x.startswith('[')]
    pick = None
    for x in lines:
        m = re.match(r'^([a-z]+\.)\s*(.*)', x)
        if m and EPOS.get(m.group(1)) == pos: pick = m.group(2); break
    if pick is None:
        x = lines[0] if lines else ''
        pick = re.sub(r'^[a-z]+\.\s*', '', x)
    pick = re.sub(r'\[.*?\]|（.*?）|\(.*?\)', '', pick)
    g = re.split(r'[；;，,]', pick)[0].strip()
    return g

def topic_of(k, pos):
    if k in TOPIC: return TOPIC[k]
    if k in NUM: return 'numbers'
    if k in DAYS or k in MONTHS: return 'time'
    if k in yle_topic: return yle_topic[k]
    if k in leg_topic:
        return {'calendar':'time','colors':'colors','fruits':'food'}.get(leg_topic[k], leg_topic[k])
    if pos == 'verb': return 'actions'
    if pos == 'adj': return 'describing'
    if pos in ('prep','pron','det','conj','adv','question','excl'): return 'function_words'
    if pos == 'num': return 'numbers'
    return 'everyday'

rows = []
for k in sorted(cand, key=str.lower):
    lk_ = k.lower()
    tags = []; band = None; reason = ''
    if k in yle: tags.append('yle_' + yle[k][2]); band, reason = yle[k][0], 'yle_' + yle[k][2]
    if k in NUM and band is None: band, reason = NUM[k], 'yle_numbers'; tags.append('yle_numbers')
    if k in dolch: tags.append('dolch_' + DOLCH_NAME[dolch[k]])
    if k in kebiao: tags.append('kebiao2')
    if k in pep: tags.append(f'pep_g{pep[k]}')
    if k in cefr: tags.append('cefrj_' + cefr[k])
    if k in leg: tags.append('legacy_v1')
    pg = pep.get(k)
    pep_band = None if pg is None else (3 if pg <= 4 else 5)
    if band is None and k in dolch: band, reason = (1 if dolch[k] <= 2 else 3), 'dolch'
    if band is None and (k in DAYS or k in MONTHS): band, reason = 3, 'yle_time'
    if band is None and k in kebiao: band, reason = (pep_band or 5) if pep_band else 5, 'kebiao2' + ('+pep' if pep_band else '')
    if band is None and pep_band and k in cefr: band, reason = pep_band, 'pep+cefrj'
    if band is None and k in cefr and cefr[k] in ('A1', 'A2'): band, reason = 5, 'cefrj_' + cefr[k]
    if band is None and k in leg: band, reason = (3 if leg[k]['level'] == 1 else 5), 'legacy_v1'
    if band is None and k in cefr: band, reason = 5, 'cefrj_' + cefr[k]
    if band is None: continue
    # lowering rule: textbook (PEP) teaches it earlier than the exam band -> adopt textbook band
    if pep_band and pep_band < band: band, reason = pep_band, reason + '>pep'
    pos = ''
    if k in yle and yle[k][1]: pos = POSMAP.get(yle[k][1].split()[0], '')
    if not pos and k in cefr_pos: pos = CPOS.get(cefr_pos[k], '')
    if not pos and k in NUM: pos = 'num'
    if not pos and lk_ in ec:
        m = re.match(r'^([a-z]+\.)', ec[lk_]['translation']); pos = EPOS.get(m.group(1), '') if m else ''
    if k in NUM: pos = 'num'
    zh = zh_gloss(k, pos)
    sr = sub.get(lk_, ''); nr = ngsl.get(lk_, '')
    rows.append(dict(en=RENAME.get(k, k), zh=zh, pos=pos, topic=topic_of(k, pos), band=band, reason=reason, tags=tags,
                     freq_rank=sr, ngsl_rank=nr, cefr=cefr.get(k, ''), ecdict_tags=(ec.get(lk_) or {}).get('tag', '')))

# within-band split: lower sub-score -> lower grade (band) ; else band+1
def tier(r):
    f = r['freq_rank'] or 99999
    return 0 if f <= 500 else 1 if f <= 1000 else 2 if f <= 2000 else 3 if f <= 5000 else 4
for b in (1, 3, 5):
    group = [r for r in rows if r['band'] == b]
    for r in group:
        k = r['en']; k = {v: kk for kk, v in RENAME.items()}.get(k, k); d = dolch.get(k, 5)
        pg = pep.get(k)
        p = 1 if pg is None else (0 if pg <= max(b, 3) else 2)
        ext = {'cefrj_A1': 1, 'cefrj_A2': 3}.get(r['reason'], 0)
        r['score'] = d + tier(r) + p + (0 if k in kebiao else 1) + ext
    group.sort(key=lambda r: (r['score'], r['freq_rank'] or 99999))
    half = (len(group) + 1) // 2
    for i, r in enumerate(group): r['grade'] = b if i < half else b + 1
for r in rows:
    if r['en'] in GRADE: r['grade'] = GRADE[r['en']]; r['reason'] += '>manual'

LIC = {'yle':'© UCLES (Cambridge) public wordlist PDF – level signal only','dolch':'Dolch 1936/1948 list (commonly treated as public domain)',
 'kebiao2':'教育部课标附录 – level signal only','pep':'© 人教社 – level signal only','cefrj':'CEFR-J Wordlist v1.5 (free incl. commercial, citation required)',
 'legacy':'WordSprout v1 (own)'}
out = os.path.join(HERE, 'wordlist-v2.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    cw = csv.writer(f)
    cw.writerow(['en','zh','pos','topic','grade','grade_rule','source_tags','freq_rank_subtitles','ngsl_rank','cefrj_level','zh_source','licence_notes'])
    for r in sorted(rows, key=lambda r: (r['grade'], r['topic'], r['en'].lower())):
        zs = 'manual' if r['en'] in ZH else 'legacy_v1' if r['en'] in leg else 'ECDICT(MIT)'
        lic = sorted({LIC[t.split('_')[0].rstrip('0123456789')] for t in r['tags'] if t.split('_')[0].rstrip('0123456789') in LIC})
        if zs == 'ECDICT(MIT)': lic.append('zh: ECDICT (MIT)')
        if r['freq_rank']: lic.append('rank: FrequencyWords (CC BY-SA 4.0)')
        if r['ngsl_rank']: lic.append('rank: NGSL (CC BY-SA 4.0)')
        cw.writerow([r['en'], r['zh'], r['pos'], r['topic'], r['grade'], r['reason'], ' '.join(r['tags']), r['freq_rank'], r['ngsl_rank'], r['cefr'], zs, ' | '.join(lic)])
c = collections.Counter(r['grade'] for r in rows)
print('total', len(rows), dict(sorted(c.items())))
print('reasons', collections.Counter(r['reason'] for r in rows).most_common(20))
print('missing zh', [r['en'] for r in rows if not r['zh']][:80])
