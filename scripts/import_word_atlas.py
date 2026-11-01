#!/usr/bin/env python3
"""
Import Word Atlas (CC BY 4.0) media + content for the words of data/wordlist-v2.csv.

  python3 scripts/import_word_atlas.py [/path/to/word-atlas]   (default /workspace/word-atlas)

Writes (all committed; re-running is idempotent):
  public/wa/thumb/<stem>.webp        256px illustration (re-encoded only if > 25 KB)
  public/wa/uk|us/<stem>.mp3         word pronunciation (UK "Alice" / US "Sarah", ElevenLabs)
  public/wa/entries/g<grade>.json    per-word content, split into  core (kid-safe) / ext (进阶扩展)
  data/word-atlas-manifest.json      en -> {stem, img, audio, core, ext}; read by `npm run data`

Modifications vs upstream (CC BY 4.0 requires saying so): only a subset of words is used;
illustrations are skipped where upstream depicts a different sense than ours; examples are
re-tiered for children (see classify()); unsafe examples/collocations are dropped entirely.
"""
import csv, json, os, re, shutil, sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UP = sys.argv[1] if len(sys.argv) > 1 else "/workspace/word-atlas"
A = os.path.join(UP, "public", "atlas")
OUT = os.path.join(ROOT, "public", "wa")

# Upstream illustrates another sense than the one our grade list teaches -> no picture.
SENSE_MISMATCH = set("""point bear sorry baby too paint really alien think fat fan by lift cook break present bow seal
degree comic goal player mind copy sign toilet as either else swing view restaurant competition stage March row
whisper cricket album mobile certainly finally simply programme""".split())
# Upstream recording is a different pronunciation (heteronym) -> no upstream audio, TTS instead.
AUDIO_MISMATCH = {"bow"}

# Never shown to children, not even in 进阶: violence, adult themes, substances, crime.
UNSAFE = re.compile(r"\b(kill\w*|murder\w*|gun\w*|shoot\w*|weapon\w*|bomb\w*|wars?|blood\w*|dead|death\w*|die|died|dies|dying|suicid\w*|drug\w*|alcohol\w*|beer\w*|wine\w*|drunk\w*|cigarette\w*|smok\w*|sex\w*|naked|nude|divorce\w*|terror\w*|violen\w*|abus\w*|prison\w*|crim\w*|gambl\w*|casino\w*|hell|damn\w*|corpse\w*|knife attack|stab\w*|rape\w*|poison\w*|torture\w*|slave\w*|racis\w*|mortgage\w*|debt\w*|bankrupt\w*|lawsuit\w*|army|soldier\w*|missile\w*)\b", re.I)
# Exam/adult framing that is fine for grown-ups but not kid content -> 进阶 only.
ADULT_TOPIC = re.compile(r"\b(ielts|exam candidates?|employer\w*|employee\w*|salary|salaries|tax\w*|invest\w*|profit\w*|revenue|economy|economic|policy|policies|government\w*|politic\w*|election\w*|career\w*|colleague\w*|office|business\w*|stock|loan\w*|rent|landlord\w*|insurance|wedding|dating|boyfriend|girlfriend|marri\w*)\b", re.I)
ZH_UNSAFE = re.compile(r"(杀|谋杀|枪|武器|炸弹|战争|血|死|自杀|毒品|酒|醉|香烟|吸烟|性|裸|离婚|恐怖|暴力|虐待|监狱|犯罪|赌|地狱)")

# Band limits: (max words, max unknown words, max core examples)
BAND = {1: (8, 1, 1), 2: (12, 2, 2), 3: (16, 3, 2)}
band = lambda g: 1 if g <= 2 else 2 if g <= 4 else 3


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def lemma_forms(w):
    w = w.lower()
    out = {w}
    for suf, rep in (("ies", "y"), ("es", ""), ("s", ""), ("ed", ""), ("ed", "e"), ("ing", ""), ("ing", "e"), ("er", ""), ("est", ""), ("'s", ""), ("ly", ""), ("d", "")):
        if w.endswith(suf) and len(w) > len(suf) + 2:
            out.add(w[: -len(suf)] + rep)
    if re.search(r"(.)\1(ed|ing)$", w):
        out.add(re.sub(r"(.)\1(ed|ing)$", r"\1", w))
    return out


IRREGULAR = "was were is am are been being has had did does done went gone came saw seen ate eaten took taken made gave given got told said thought found knew left felt brought bought kept met ran sat stood wrote written read began spoke flew drew drank sang swam won lost children men women feet teeth mice better best worse worst".split()


def tokens(en):
    return re.findall(r"[A-Za-z][A-Za-z'\-]*", en)


def classify(ex_en, ex_zh, grade, known):
    """'unsafe' (dropped) | 'kid' (core) | 'ext' (进阶)."""
    text = ex_en + " " + ex_zh
    if UNSAFE.search(ex_en) or ZH_UNSAFE.search(ex_zh):
        return "unsafe"
    if ADULT_TOPIC.search(ex_en):
        return "ext"
    toks = tokens(ex_en)
    maxw, maxu, _ = BAND[band(grade)]
    if len(toks) > maxw:
        return "ext"
    unknown = [t for i, t in enumerate(toks) if not (lemma_forms(t) & known) and not (i > 0 and t[0].isupper())]
    return "kid" if len(unknown) <= maxu else "ext"


def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT, "data", "wordlist-v2.csv"), encoding="utf-8-sig")))
    known = set()
    for r in rows:
        for t in tokens(r["en"]):
            known |= lemma_forms(t)
    known |= set(IRREGULAR) | {"i", "a", "s", "t"}

    idx = json.load(open(os.path.join(A, "index.json")))
    by_word = {w[1].lower(): w for w in idx["words"]}
    by_id = {w[0]: w for w in idx["words"]}
    chunk = idx.get("chunk", 100)
    order = {w[0]: i for i, w in enumerate(idx["words"])}
    cache = {}

    def entry(uid):
        c = order[uid] // chunk
        if c not in cache:
            cache[c] = {e["id"]: e for e in json.load(open(os.path.join(A, "entries", f"{c}.json")))}
        return cache[c].get(uid)

    for sub in ("thumb", "uk", "us", "entries"):
        d = os.path.join(OUT, sub)
        if os.path.isdir(d):
            shutil.rmtree(d)
        os.makedirs(d)

    manifest, per_grade, stats, left_out = {}, {g: {} for g in range(1, 7)}, Counter(), []
    reencoded = 0
    for r in rows:
        en, g = r["en"], int(r["grade"])
        m = by_word.get(en.lower()) or by_id.get(slug(en))
        if not m:
            continue
        uid = m[0]
        e = entry(uid)
        if e is None:
            continue
        stats["matched"] += 1
        stem = uid
        has_img = has_audio = False
        if en not in SENSE_MISMATCH and os.path.exists(os.path.join(A, "thumb", uid + ".webp")):
            src, dst = os.path.join(A, "thumb", uid + ".webp"), os.path.join(OUT, "thumb", stem + ".webp")
            if os.path.getsize(src) > 25000:
                from PIL import Image
                Image.open(src).convert("RGB").resize((224, 224)).save(dst, "WEBP", quality=72, method=6)
                reencoded += 1
            else:
                shutil.copyfile(src, dst)
            has_img = True
        if en not in AUDIO_MISMATCH and all(os.path.exists(os.path.join(A, "audio", a, uid + ".mp3")) for a in ("uk", "us")):
            for a in ("uk", "us"):
                shutil.copyfile(os.path.join(A, "audio", a, uid + ".mp3"), os.path.join(OUT, a, stem + ".mp3"))
            has_audio = True

        # ---- content: core (kid-safe) vs ext (进阶扩展) ----
        mismatch = en in SENSE_MISMATCH
        _, _, max_core = BAND[band(g)]
        core_ex, ext_ex = [], []
        for x in e.get("ex", []):
            k = "ext" if mismatch else classify(x.get("en", ""), x.get("zh", ""), g, known)
            if k == "unsafe":
                stats["unsafe_examples_dropped"] += 1
                continue
            item = {"en": x["en"], "zh": x.get("zh", ""), "kid": k == "kid"}
            (core_ex if k == "kid" and len(core_ex) < max_core else ext_ex).append(item)
        cols_core, cols_ext = [], []
        for c in e.get("col", []):
            en_c, _, zh_c = c.partition("｜")
            if UNSAFE.search(en_c) or ZH_UNSAFE.search(zh_c):
                stats["unsafe_collocations_dropped"] += 1
                continue
            simple = not mismatch and band(g) > 1 and len(tokens(en_c)) <= 3 and all(lemma_forms(t) & known for t in tokens(en_c)) and not ADULT_TOPIC.search(en_c)
            (cols_core if simple and len(cols_core) < 3 else cols_ext).append([en_c.strip(), zh_c.strip()])
        tip = e.get("tip", "") or ""
        if tip and (ZH_UNSAFE.search(tip) or UNSAFE.search(tip)):
            tip = ""
        senses = [[s.get("pos", ""), s.get("zh", ""), s.get("en", "")] for s in e.get("senses", []) if not UNSAFE.search(s.get("en", ""))]
        core = {}
        if core_ex: core["ex"] = core_ex
        if cols_core: core["col"] = cols_core
        ext = {}
        if ext_ex: ext["ex"] = ext_ex
        if cols_ext: ext["col"] = cols_ext
        if e.get("fam"): ext["fam"] = e["fam"]
        if e.get("syn"): ext["syn"] = e["syn"]
        if e.get("ant"): ext["ant"] = e["ant"]
        if tip: ext["tip"] = tip
        if senses: ext["senses"] = senses
        if e.get("cefr"): ext["cefr"] = e["cefr"]
        rec = {"uk": e.get("uk", ""), "us": e.get("us", "")}
        if core: rec["core"] = core
        if ext: rec["ext"] = ext
        per_grade[g][en] = rec
        manifest[en] = {"stem": stem, "img": has_img, "audio": has_audio, "core": len(core_ex), "ext": bool(ext)}
        stats["img"] += has_img
        stats["audio"] += has_audio
        stats["core_example"] += bool(core_ex)
        stats["any_example"] += bool(core_ex or ext_ex)
        stats["ext"] += bool(ext)
        stats["kid_examples"] += len(core_ex)
        stats["ext_examples"] += len(ext_ex)

    for g, recs in per_grade.items():
        with open(os.path.join(OUT, "entries", f"g{g}.json"), "w", encoding="utf-8") as f:
            json.dump(recs, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(ROOT, "data", "word-atlas-manifest.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "Word Atlas (github.com/designfuchen/word-atlas) public/atlas — CC BY 4.0", "license": "https://creativecommons.org/licenses/by/4.0/", "upstream_commit": os.popen(f"git -C {UP} rev-parse --short HEAD").read().strip(), "stats": dict(stats), "words": manifest}, f, ensure_ascii=False, indent=0)
    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT) for fn in fns)
    files = sum(len(fns) for _, _, fns in os.walk(OUT))
    print(json.dumps(dict(stats)), f"reencoded={reencoded}", f"files={files}", f"MB={size/1e6:.1f}")


if __name__ == "__main__":
    main()
