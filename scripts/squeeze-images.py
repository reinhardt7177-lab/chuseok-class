# -*- coding: utf-8 -*-
"""
그림을 가볍게 한다 — 크기는 그대로, 파일 이름도 그대로.

    python scripts/squeeze-images.py            # 얼마나 줄어드는지 보기만 (아무것도 안 바꿈)
    python scripts/squeeze-images.py --apply    # 실제로 바꾼다

왜 필요한가
    학생이 차례상 차리기를 열면 태블릿 한 대가 음식 그림 14장을 받는다. 압축 전에는
    장당 1.2MB 안팎이라 한 대에 14MB, 서른 대면 교실 와이파이로 400MB가 넘었다.
    그림을 새로 만들거나 바꾼 뒤에는 이걸 한 번 돌려 주면 된다.

무엇을 하나
    장면 그림(JPG)   가로세로 그대로, JPEG 품질 82 · 점진 · 최적화             (약 47% 줄어듦)
    명절 칸(JPG)     화면에 420px 남짓으로 보이므로 가로 900px로 줄이고 품질 82  (약 75%)
    투명 그림(PNG)   256색으로 줄인 PNG. 투명은 그대로, 이름도 .png 그대로       (약 86%)

두 번 돌려도 괜찮다
    JPG는 다시 압축할 때마다 조금씩 뭉개진다. 그래서 이미 목표 크기 안에 든 파일은
    건너뛴다. PNG는 이미 256색이면 건너뛴다. 새로 바꿔 넣은 큰 그림만 손본다.
"""
import argparse, glob, io, os, sys
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets")

QUALITY = 82
HOLIDAY_WIDTH = 900
# 이 크기 안이면 이미 압축된 것으로 보고 건너뛴다 (JPG 세대 손실을 막는다)
BUDGET = {"scene": 420 * 1024, "holiday": 180 * 1024}


def jpeg_bytes(im):
    buf = io.BytesIO()
    im.convert("RGB").save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return buf.getvalue()


def png_bytes(im):
    buf = io.BytesIO()
    im.convert("RGBA").quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(buf, "PNG", optimize=True)
    return buf.getvalue()


def plan():
    """[(경로, 종류, 이전 크기, 새 바이트 또는 None(건너뜀), 건너뛴 까닭)]"""
    out = []
    for f in sorted(glob.glob(os.path.join(ROOT, "img", "*.jpg"))):
        name = os.path.basename(f)
        kind = "holiday" if name.startswith("holiday-") else "scene"
        before = os.path.getsize(f)
        if before <= BUDGET[kind]:
            out.append((f, kind, before, None, "이미 가벼움"))
            continue
        im = Image.open(f)
        if kind == "holiday" and im.width > HOLIDAY_WIDTH:
            im = im.resize((HOLIDAY_WIDTH, round(im.height * HOLIDAY_WIDTH / im.width)), Image.LANCZOS)
        data = jpeg_bytes(im)
        out.append((f, kind, before, data if len(data) < before else None, "" if len(data) < before else "줄지 않음"))

    for f in sorted(glob.glob(os.path.join(ROOT, "items", "*.png"))):
        before = os.path.getsize(f)
        im = Image.open(f)
        if im.mode == "P":
            out.append((f, "png", before, None, "이미 256색"))
            continue
        data = png_bytes(im)
        out.append((f, "png", before, data if len(data) < before else None, "" if len(data) < before else "줄지 않음"))
    return out


def mb(n):
    return f"{n / 1048576:,.1f}MB"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="실제로 파일을 바꾼다 (없으면 보기만)")
    args = ap.parse_args()

    rows = plan()
    todo = [r for r in rows if r[3] is not None]
    label = {"scene": "장면 그림", "holiday": "명절 칸", "png": "투명 그림"}
    for kind in ("scene", "holiday", "png"):
        sub = [r for r in rows if r[1] == kind]
        if not sub:
            continue
        work = [r for r in sub if r[3] is not None]
        b = sum(r[2] for r in work)
        a = sum(len(r[3]) for r in work)
        skip = len(sub) - len(work)
        gain = f"{mb(b)} → {mb(a)} ({(1 - a / b) * 100:.0f}% 줄어듦)" if work else "손볼 것 없음"
        print(f"  {label[kind]:6} {len(sub):>3}장 · 손볼 것 {len(work):>3}장 · 건너뜀 {skip:>3}장 — {gain}")

    total_b = sum(r[2] for r in todo)
    total_a = sum(len(r[3]) for r in todo)
    if not todo:
        print("\n  모두 이미 가볍습니다.")
        return
    print(f"\n  합계 {mb(total_b)} → {mb(total_a)}  ({(1 - total_a / total_b) * 100:.0f}% 줄어듦)")

    if not args.apply:
        print("\n  (보기만 했습니다. 바꾸려면 --apply)")
        return
    for f, _kind, _b, data, _why in todo:
        tmp = f + ".tmp"
        with open(tmp, "wb") as fh:
            fh.write(data)
        os.replace(tmp, f)          # 한 번에 갈아 끼운다 — 도중에 끊겨도 반쪽 파일이 남지 않게
    print(f"\n  {len(todo)}장을 바꿨습니다.")


if __name__ == "__main__":
    sys.exit(main())
