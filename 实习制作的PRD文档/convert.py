"""
docx -> markdown 转换器
- 保留所有图片（按出现顺序插入到原位置）
- 识别标题层级（一/1/1.1）
- 保留加粗、斜体等基础格式
"""

import os
import re
import shutil
import zipfile
from docx import Document
from docx.oxml.ns import qn

SRC = r"C:\Users\HP\Desktop\龙湖实习——中铁卓著南区交房服务产品需求文档（PRD）.docx"
OUT_DIR = r"C:\Users\HP\WorkBuddy\2026-09-08-00-56-57\output\prd_convert"
OUT_MD = os.path.join(OUT_DIR, "中铁卓著南区交房服务PRD.md")
IMG_DIR = os.path.join(OUT_DIR, "media")

# 1) 解压 docx，提取所有图片到 OUT_DIR/media
os.makedirs(IMG_DIR, exist_ok=True)
with zipfile.ZipFile(SRC, "r") as z:
    for name in z.namelist():
        if name.startswith("word/media/") and not name.endswith("/"):
            base = os.path.basename(name)
            with z.open(name) as src, open(os.path.join(IMG_DIR, base), "wb") as dst:
                shutil.copyfileobj(src, dst)
print(f"[media] extracted to {IMG_DIR}")

# 2) 解析 rels 文件，得到 rId -> 文件名
rid_to_media = {}
with zipfile.ZipFile(SRC, "r") as z:
    rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")
for m in re.finditer(r'Id="([^"]+)"\s+Type="[^"]*image"\s+Target="([^"]+)"', rels_xml):
    rid, target = m.group(1), m.group(2)
    rid_to_media[rid] = os.path.basename(target)


# 3) 解析文本+图片，按段输出 md
def is_heading_l1(t):
    """一/二/.../八、 顶层标题"""
    return bool(re.match(r"^[一二三四五六七八九十]、", t))


def is_heading_l2(t):
    """1. 2. 3. 第二级标题（顶级数字编号）"""
    return bool(re.match(r"^\d+\.\s", t))


def is_heading_l3(t):
    """1.1 2.3 3.2 第三级标题"""
    return bool(re.match(r"^\d+\.\d+\s", t))


# 已知的"无编号标题"（仍按二级标题排版）
KNOWN_UNNUMBERED_HEADINGS = {
    "用户角色与权限",
    "关键说明",
}


def detect_heading(text):
    """返回 markdown heading level (1/2/3)，None 表示正文"""
    t = text.strip()
    if not t:
        return None
    if is_heading_l1(t):
        return 1
    if is_heading_l3(t):
        return 3
    if is_heading_l2(t):
        return 2
    if t in KNOWN_UNNUMBERED_HEADINGS:
        return 2
    return None


def runs_to_md(paragraph):
    """把段落里的 runs 转成 md，处理加粗、斜体、下划线"""
    out = []
    for run in paragraph.runs:
        txt = run.text
        if not txt:
            continue
        # 跳过段落中含图片的 run（此处 run 是图片 run，应独立处理）
        if run._element.findall(qn("w:drawing")):
            continue
        flags = []
        if run.bold:
            flags.append("**")
        if run.italic:
            flags.append("*")
        if run.underline:
            flags.append("__")
        if flags:
            # 配对符号
            opener = "|".join(flags)
            closer = "|".join(reversed(flags))
            out.append(f"{opener}{txt}{closer}".replace("|", ""))
        else:
            out.append(txt)
    return "".join(out)


def collect_paragraph_images(paragraph):
    """返回段落中按文档顺序的图片文件名列表"""
    images = []
    for r in paragraph.runs:
        for d in r._element.findall(qn("w:drawing")):
            for blip in d.findall(".//" + qn("a:blip")):
                rid = blip.get(qn("r:embed"))
                if rid and rid in rid_to_media:
                    images.append(rid_to_media[rid])
    return images


# 主转换
doc = Document(SRC)
md_lines = []

for idx, p in enumerate(doc.paragraphs):
    text = p.text.replace("\n", "").strip()
    images = collect_paragraph_images(p)

    # (a) 标题判定
    heading_level = detect_heading(text)
    if heading_level:
        # 即使标题段也有图片（罕见），先输出标题再附图
        md_lines.append("#" * heading_level + " " + text)
        md_lines.append("")
        for img in images:
            md_lines.append(f"![{img}](media/{img})")
            md_lines.append("")
        continue

    # (b) 段落有图片 + 文字（如"流程图如下："）
    if images and text:
        # 正文部分
        body = runs_to_md(p)
        md_lines.append(body)
        md_lines.append("")
        for img in images:
            md_lines.append(f"![{img}](media/{img})")
            md_lines.append("")
        continue

    # (c) 段落只有图片（无文字）—— 例如 5 张图、单独一张图
    if images and not text:
        for img in images:
            md_lines.append(f"![{img}](media/{img})")
        md_lines.append("")
        continue

    # (d) 纯文字段落
    if text:
        # 跳过文档开头那行"中铁卓著南区交房服务产品分析文档（PRD）"—— 用 # 1 标题
        if idx == 0:
            md_lines.append("# " + text)
            md_lines.append("")
        else:
            body = runs_to_md(p)
            md_lines.append(body)
            md_lines.append("")

# 写入文件
os.makedirs(OUT_DIR, exist_ok=True)
with open(OUT_MD, "w", encoding="utf-8") as f:
    f.write("\n".join(md_lines))

print(f"[done] wrote {OUT_MD}")
print(f"[done] size={os.path.getsize(OUT_MD)} bytes, lines={len(md_lines)}")
