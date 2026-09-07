"""
PDF -> Markdown 转换器（智能体产品设计报告）
- 保留全部 24 张图片，按页面阅读顺序插入
- 识别 H1（黑体15.9）/ H2（书宋14.1）标题层级
- 5 张表格用 pdfplumber 提取为 markdown 表格（去重合并单元格伪列）
"""

import os
import re

import fitz  # pymupdf
import pdfplumber

SRC = r"C:\Users\HP\Desktop\智能体产品设计报告.pdf"
OUT_DIR = r"C:\Users\HP\WorkBuddy\2026-09-08-00-56-57\output\agent_report_convert"
OUT_MD = os.path.join(OUT_DIR, "智能体产品设计报告.md")
IMG_DIR = os.path.join(OUT_DIR, "media")

os.makedirs(IMG_DIR, exist_ok=True)

H1_FONT = "HYZhongHeiKW"     # 文档主标题
H2_FONT = "HYShuSongErKW"    # 一、二、三 级标题
BODY_FONT = "HYKaiTiKW"      # 正文

md_lines = []
img_counter = 0


def save_image(page, img_info):
    """把页面上的图片存成 png，返回文件名"""
    global img_counter
    xref = img_info[0]
    img_counter += 1
    fname = f"img_{img_counter:02d}.png"
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:  # CMYK -> RGB
            pix = fitz.Pixmap(fitz.csRGB, pix)
        if pix.alpha:  # 保留透明通道时直接存
            pix.save(os.path.join(IMG_DIR, fname))
        else:
            pix.save(os.path.join(IMG_DIR, fname))
        return fname
    except Exception as e:
        print(f"[warn] image save failed xref={xref}: {e}")
        return None


def clean_cell(c):
    """清理表格单元格：中文换行直接拼接，英文边界留空格"""
    if c is None:
        return ""
    c = str(c).strip()
    parts = re.split(r"\s*\n\s*", c)
    out = ""
    for p in parts:
        if not out:
            out = p
        elif re.search(r"[A-Za-z0-9,.]$", out) and re.match(r"^[A-Za-z0-9]", p):
            out += " " + p
        else:
            out += p
    return re.sub(r"[ \t]+", " ", out).strip()


def table_to_md(data):
    """data: list of rows (list of str)"""
    if not data:
        return None
    # 去掉"合并单元格造成的重复列"：3列且第3列==第1列
    if all(len(r) == 3 for r in data):
        if all(clean_cell(r[0]) == clean_cell(r[2]) for r in data):
            data = [r[:2] for r in data]
    # 统一列数
    ncols = max(len(r) for r in data)
    data = [r + [""] * (ncols - len(r)) for r in data]
    lines = []
    lines.append("| " + " | ".join(clean_cell(c) for c in data[0]) + " |")
    lines.append("|" + "---|" * ncols)
    for r in data[1:]:
        lines.append("| " + " | ".join(clean_cell(c) for c in r) + " |")
    return "\n".join(lines)


MARKERS = (
    "→", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩",
    "⑪", "⑫", "⑬", "⑭", "⑮", "•", "·",
)


def is_item_line(t):
    """判断是否是列表项/标签行（应独立成段）"""
    if not t:
        return False
    if t.startswith(MARKERS):
        return True
    if re.match(r"^\d+\s*[.、]\S", t) and len(t) < 40:  # 1.访谈法 / 2、xxx
        return True
    if t.startswith("-") and not t.startswith("--"):
        return True
    if len(t) < 30 and t.endswith("："):  # 短标签行
        return True
    return False


def emit_text_block(payload):
    """把 block 中的行按列表/标签规则拆成若干段落，返回 [(text, is_label)]

    拆段规则：
    - 当前行是列表项（→/①④/数字编号/-）→ 新段
    - 上一行很短（<25 字，CJK 两端对齐的段中行几乎都是满宽）
      或以冒号结尾 → 上一行是独立条目/标签 → 新段
    - 其余情况视为段内折行，拼接
    """
    paras = []
    cur = ""
    last_line = ""
    cur_label = False
    for txt, _ in payload:
        if not txt:
            continue
        new_is_item = is_item_line(txt)
        start_new = False
        if new_is_item:
            start_new = True
        elif cur:
            if last_line and len(last_line) < 25:
                start_new = True
            elif last_line and (last_line.endswith("：") or last_line.endswith(":")) and len(last_line) < 40:
                start_new = True
        if start_new and cur:
            paras.append((cur, cur_label))
            cur = ""
            cur_label = False
        # 加粗只适用于短的标签项（编号项/冒号标签），箭头与短横说明行不加粗
        if new_is_item and len(txt) < 30 and not txt.startswith(("→", "-")):
            cur_label = True
        cur = join_two(cur, txt) if cur else txt
        last_line = txt
    if cur:
        paras.append((cur, cur_label))
    return paras


def join_two(a, b):
    if re.search(r"[A-Za-z0-9,.]$", a) and re.match(r"^[A-Za-z0-9]", b):
        return a + " " + b
    return a + b


def smart_join(lines):
    return join_two  # 已由 emit_text_block 取代


doc = fitz.open(SRC)
with pdfplumber.open(SRC) as plumber:
    for pi in range(len(doc)):
        page = doc[pi]
        pno = pi + 1
        d = page.get_text("dict")

        # --- 表格区域（pdfplumber） ---
        tables = []
        try:
            for t in plumber.pages[pi].find_tables():
                x0, y0, x1, y1 = t.bbox
                data = t.extract()
                if data and len(data) > 1:
                    tables.append({"bbox": (x0, y0, x1, y1), "data": data})
        except Exception as e:
            print(f"[warn] table detect failed p{pno}: {e}")

        def in_table(bbox):
            bx0, by0, bx1, by1 = bbox
            for t in tables:
                tx0, ty0, tx1, ty1 = t["bbox"]
                # 中心点落在表格内即视为表格内容
                cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
                if tx0 - 2 <= cx <= tx1 + 2 and ty0 - 2 <= cy <= ty1 + 2:
                    return t
            return None

        # --- 收集所有元素并按位置排序 ---
        elements = []  # (y, x, kind, payload)
        for block in d["blocks"]:
            bx0, by0, bx1, by1 = block["bbox"]
            if block["type"] == 1:  # image
                elements.append((by0, bx0, "image", block))
            else:
                # 跳过表格内文本
                if in_table(block["bbox"]):
                    continue
                lines = []
                for line in block["lines"]:
                    txt = "".join(s["text"] for s in line["spans"]).strip()
                    if not txt:
                        continue
                    lines.append((txt, line["spans"]))
                if lines:
                    elements.append((by0, bx0, "text", lines))

        for t in tables:
            elements.append((t["bbox"][1], t["bbox"][0], "table", t["data"]))

        elements.sort(key=lambda e: (round(e[0]), e[1]))

        # --- 逐个输出 ---
        for y, x, kind, payload in elements:
            if kind == "image":
                # 找 xref
                infos = page.get_image_info(xrefs=True)
                # 通过 bbox 匹配
                target = None
                for info in infos:
                    ix0, iy0, ix1, iy1 = info["bbox"]
                    if abs(iy0 - y) < 3 and abs(ix0 - x) < 3:
                        target = info
                        break
                if target is None and infos:
                    target = infos[0]
                fname = None
                if target and "xref" in target and target["xref"] > 0:
                    fname = save_image(page, (target["xref"],))
                if fname:
                    md_lines.append(f"![image](media/{fname})")
                    md_lines.append("")
                continue

            if kind == "table":
                tmd = table_to_md(payload)
                if tmd:
                    md_lines.append(tmd)
                    md_lines.append("")
                continue

            # text：先判断整个 block 的主导字体（标题判定）
            all_spans = [s for _, spans in payload for s in spans]
            font = all_spans[0]["font"] if all_spans else ""
            if font == H1_FONT:
                joined = "".join(t for t, _ in payload)
                md_lines.append("# " + joined)
                md_lines.append("")
            elif font == H2_FONT:
                joined = "".join(t for t, _ in payload)
                md_lines.append("## " + joined)
                md_lines.append("")
            else:
                for text, is_label in emit_text_block(payload):
                    if is_label:
                        md_lines.append(f"**{text}**")
                        md_lines.append("")
                    else:
                        md_lines.append(text)
                        md_lines.append("")

# 合并多余空行，规整输出
text = "\n".join(md_lines)
text = re.sub(r"\n{3,}", "\n\n", text).strip() + "\n"

with open(OUT_MD, "w", encoding="utf-8") as f:
    f.write(text)

print(f"[done] {OUT_MD}")
print(f"[done] images saved: {img_counter}")
