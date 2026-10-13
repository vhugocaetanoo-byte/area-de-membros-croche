"""Gera data/catalog.js a partir do catálogo antigo + inventário do Google Drive.

Uso: python3 scripts/build_catalog.py
Entradas: data/source-catalog.json, data/drive.json, scripts/titles.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from titles import TITLES  # noqa: E402

old = json.loads((ROOT / "data/source-catalog.json").read_text())
drive = json.loads((ROOT / "data/drive.json").read_text())
drive_by_yt = {d["yt"]: d["driveId"] or None for d in drive if d["yt"]}

CATEGORIES = [
    ("vestidos-femininos", "Vestidos de Crochê", "Do casual ao vestido de festa, com modelos sereia, boho e sob medida."),
    ("vestidos-infantis", "Vestidos Infantis", "Vestidinhos delicados para bebês e crianças, organizados por idade."),
    ("biquinis-e-croppeds", "Biquínis e Croppeds", "Tops, bojos, calcinhas e croppeds para a moda praia."),
    ("bolsas", "Bolsas", "Bolsas de praia, clutches, sacolas e modelos para o dia a dia."),
    ("tapetes", "Tapetes", "Tapetes redondos, ovais, passadeiras e jogos de cozinha."),
]
TRACKS = [
    ("fios-e-agulhas", "Fios e Materiais", "Escolha os fios, agulhas e materiais certos antes de começar."),
    ("medidas-e-modelagem", "Medidas e Modelagens", "Tire medidas e ajuste qualquer receita ao corpo."),
    ("leitura-de-graficos", "Como Ler Gráficos", "Entenda símbolos, direções e repetições, passo a passo."),
    ("acabamentos", "Acabamentos Caprichados", "Fechamentos, arremates e uniões que valorizam cada peça."),
]
LEVELS = {"iniciante": "Iniciante", "intermediário": "Intermediário", "avançado": "Avançado"}


def group_for(cat_id, title, old_sub):
    t = title.lower()
    if cat_id == "vestidos-infantis":
        if "medidas" in t or "pala" in t:
            return "Técnicas"
        if "anos" in t or "1 ano" in t:
            return "Crianças"
        return "Bebês"
    if cat_id == "biquinis-e-croppeds":
        if "calcinha" in t or "hot pant" in t:
            return "Calcinhas"
        if "bojo" in t or "triângulos" in t:
            return "Bojos"
        if "top" in t or "cropped" in t:
            return "Tops e croppeds"
        return "Biquínis"
    if cat_id == "bolsas":
        if "clutch" in t or "festa" in t:
            return "Clutches e festa"
        if "praia" in t or "sacola" in t or "ecobag" in t or "tote" in t:
            return "Praia e sacolas"
        return "Dia a dia"
    if cat_id == "tapetes":
        if "jogo" in t:
            return "Jogos de cozinha"
        if "passadeira" in t:
            return "Passadeiras"
        if "oval" in t:
            return "Ovais"
        if "redondo" in t or "circular" in t or "lua" in t or "flor" in t or "moinho" in t or "nelma" in t or "violeta" in t:
            return "Redondos"
        return "Retangulares"
    if cat_id == "vestidos-femininos":
        if "sereia" in t:
            return "Sereia"
        if "festa" in t or "réveillon" in t or "tiffany" in t or "aurora" in t:
            return "Festa e réveillon"
        if "boho" in t or "bata" in t:
            return "Boho"
        if "longo" in t or "mogno" in t:
            return "Longos"
        return "Casuais"
    return old_sub


def video(v, idx, total, title):
    return {
        "yt": v["id"],
        "drive": drive_by_yt.get(v["id"]),
        "title": f"Parte {idx}" if total > 1 else title,
        "part": idx,
        "duration": v.get("duration") or 0,
    }


out = {"categories": [], "tracks": []}
old_cats = {c["id"]: c for c in old["categories"]}
missing = []
for cid, title, desc in CATEGORIES:
    models = []
    for i, m in enumerate(old_cats[cid]["models"]):
        name = TITLES[cid][i]
        vids = sorted(m["videos"], key=lambda v: v.get("part") or 0)
        vids = [video(v, n + 1, len(vids), name) for n, v in enumerate(vids)]
        missing += [(cid, name, v["yt"]) for v in vids if not v["drive"]]
        models.append({
            "id": m["id"],
            "title": name,
            "group": group_for(cid, name, m.get("subcategory")),
            "level": LEVELS.get(m.get("level"), "Iniciante"),
            "duration": sum(v["duration"] for v in vids),
            "thumb": vids[0]["yt"],
            "videos": vids,
        })
    out["categories"].append({"id": cid, "title": title, "description": desc, "models": models})

old_tracks = {t["id"]: t for t in old["tracks"]}
for tid, title, desc in TRACKS:
    lessons = sorted(old_tracks[tid]["lessons"], key=lambda l: l["part"])
    vids = []
    for n, l in enumerate(lessons):
        vids.append({"yt": l["videoId"], "drive": drive_by_yt.get(l["videoId"]), "title": l["title"],
                     "part": n + 1, "duration": l.get("duration") or 0})
        if not vids[-1]["drive"]:
            missing.append((tid, l["title"], l["videoId"]))
    out["tracks"].append({"id": tid, "title": title, "description": desc, "videos": vids})

FOLDER_PRODUCTS = "https://drive.google.com/drive/folders/1zVeF9bhhNL4-eravowStB6L7n4vuqC51?usp=drive_link"
FOLDER_BONUS = "https://drive.google.com/drive/folders/11N1yRXEuWJZMafiCLD2LqEmfkeDbT2In?usp=drive_link"
out["extras"] = [
    {"group": "Seus produtos digitais", "items": [
        {"title": "30 Receitas de Natal e Réveillon", "icon": "star", "url": FOLDER_PRODUCTS},
        {"title": "Guia: Como Lucrar até R$ 5 mil por mês com Crochê", "icon": "coin", "url": FOLDER_PRODUCTS},
        {"title": "Pacotão: 100 Receitas + 100 Videoaulas de Presentes", "icon": "gift", "url": FOLDER_PRODUCTS},
        {"title": "Pacote completo com todas as ofertas", "icon": "box", "url": FOLDER_PRODUCTS},
    ]},
    {"group": "Materiais bônus", "items": [
        {"title": "Guia de Medidas para Vestidos", "icon": "ruler", "url": FOLDER_BONUS},
        {"title": "Tabela de Fios e Agulhas", "icon": "yarn", "url": FOLDER_BONUS},
        {"title": "50 Modelos Exclusivos Infantis", "icon": "dress", "url": FOLDER_BONUS},
        {"title": "Aulas de Acabamentos Perfeitos", "icon": "scissors", "url": FOLDER_BONUS},
        {"title": "Mini Curso: Seu Primeiro Vestido", "icon": "star", "url": FOLDER_BONUS},
    ]},
]

(ROOT / "data/catalog.js").write_text(
    "// Gerado por scripts/build_catalog.py — não editar à mão.\nwindow.CATALOG = "
    + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
n_models = sum(len(c["models"]) for c in out["categories"])
n_vids = sum(len(m["videos"]) for c in out["categories"] for m in c["models"]) + sum(len(t["videos"]) for t in out["tracks"])
multi = sum(1 for c in out["categories"] for m in c["models"] if len(m["videos"]) > 1)
print(f"{n_models} modelos, {multi} em várias partes, {n_vids} vídeos; sem link do Drive: {len(missing)}")
for x in missing:
    print("  sem Drive:", x)
