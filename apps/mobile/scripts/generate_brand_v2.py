#!/usr/bin/env python3
from __future__ import annotations

import json
import math
import random
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "brand-v2"

PALETTE = {
    "ink": "#1A1A24",
    "ink_soft": "#3F3F4A",
    "ink_charcoal": "#14181F",
    "parchment": "#FAF7F0",
    "parchment_raised": "#FFFDF7",
    "sandstone": "#F4ECDF",
    "sandstone_deep": "#EFE4D2",
    "gold": "#C8A24B",
    "gold_soft": "#E5C97D",
    "amber": "#D08A2C",
    "amber_dark": "#8C5912",
    "sage": "#5C8A6A",
    "cobalt": "#243F7A",
    "cobalt_light": "#D6E0F4",
    "white": "#FFFFFF",
}


@dataclass
class Asset:
    key: str
    path: str
    width: int
    height: int
    kind: str
    priority: str


MANIFEST: list[Asset] = []


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
        alpha,
    )


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def add_manifest(key: str, path: Path, width: int, height: int, kind: str, priority: str) -> None:
    MANIFEST.append(
        Asset(
            key=key,
            path=str(path.relative_to(ROOT)),
            width=width,
            height=height,
            kind=kind,
            priority=priority,
        )
    )


def save_png(key: str, image: Image.Image, path: Path, priority: str) -> None:
    ensure_dir(path.parent)
    image.save(path, format="PNG")
    add_manifest(key, path, image.width, image.height, "png", priority)


def save_svg(key: str, svg: str, path: Path, width: int, height: int, priority: str) -> None:
    ensure_dir(path.parent)
    path.write_text(svg, encoding="utf-8")
    add_manifest(key, path, width, height, "svg", priority)


def find_font(*names: str) -> Path:
    search_roots = [
        ROOT / "node_modules",
        ROOT.parent / "node_modules",
        ROOT / "apps" / "mobile" / "node_modules",
    ]
    for search_root in search_roots:
        if not search_root.exists():
            continue
        for name in names:
            matches = list(search_root.rglob(name))
            if matches:
                return matches[0]
    raise FileNotFoundError(f"Could not find font from: {names}")


FONT_CORMORANT_REG = find_font("CormorantGaramond_400Regular.ttf")
FONT_CORMORANT_MED = find_font("CormorantGaramond_500Medium.ttf")
FONT_CORMORANT_ITALIC = find_font("CormorantGaramond_500Medium_Italic.ttf")
FONT_INTER_MED = find_font("Inter_500Medium.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def vertical_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    w, h = size
    start = rgba(top)
    end = rgba(bottom)
    img = Image.new("RGBA", size)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        row = tuple(lerp(start[i], end[i], t) for i in range(4))
        for x in range(w):
            px[x, y] = row
    return img


def radial_glow(size: tuple[int, int], center: tuple[float, float], radius: float, color: str, alpha: int) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for step in range(18, 0, -1):
        frac = step / 18
        r = radius * frac
        a = int(alpha * frac * frac * 0.7)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=rgba(color, a))
    return layer.filter(ImageFilter.GaussianBlur(max(8, int(radius * 0.08))))


def add_blob(image: Image.Image, box: tuple[int, int, int, int], color: str, alpha: int, blur: int) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=rgba(color, alpha))
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def add_grain(image: Image.Image, amount: int = 10) -> Image.Image:
    noise = Image.effect_noise(image.size, amount)
    noise = ImageOps.autocontrast(noise)
    tint = ImageOps.colorize(noise.convert("L"), black="#2A241E", white="#FFF8EF").convert("RGBA")
    tint.putalpha(Image.new("L", image.size, 18))
    tint = tint.filter(ImageFilter.GaussianBlur(0.35))
    return Image.alpha_composite(image, tint)


def painterly_base(
    size: tuple[int, int],
    *,
    top: str,
    bottom: str,
    accents: list[str],
    seed: int,
    glow: str = "gold_soft",
) -> Image.Image:
    rng = random.Random(seed)
    w, h = size
    image = vertical_gradient(size, top, bottom)
    image.alpha_composite(radial_glow(size, (w * 0.28, h * 0.18), w * 0.26, PALETTE[glow], 120))
    image.alpha_composite(radial_glow(size, (w * 0.72, h * 0.68), w * 0.32, PALETTE["cobalt_light"], 54))
    for i in range(10):
        left = int(rng.uniform(-0.2, 0.7) * w)
        top_y = int(rng.uniform(-0.12, 0.8) * h)
        blob_w = int(rng.uniform(0.18, 0.48) * w)
        blob_h = int(rng.uniform(0.18, 0.56) * h)
        blur = rng.randint(max(18, w // 45), max(36, w // 18))
        alpha = rng.randint(34, 76)
        add_blob(image, (left, top_y, left + blob_w, top_y + blob_h), accents[i % len(accents)], alpha, blur)
    return add_grain(image, 12)


def centered_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, fnt: ImageFont.FreeTypeFont, fill: tuple[int, int, int, int]) -> tuple[int, int]:
    x1, y1, x2, y2 = box
    bb = draw.textbbox((0, 0), text, font=fnt)
    x = x1 + ((x2 - x1) - (bb[2] - bb[0])) // 2
    y = y1 + ((y2 - y1) - (bb[3] - bb[1])) // 2 - 6
    draw.text((x, y), text, font=fnt, fill=fill)
    return x, y


def logo_mark_image(size: int = 512, inverse: bool = False) -> Image.Image:
    stroke = PALETTE["parchment"] if inverse else PALETTE["ink"]
    halo = PALETTE["gold_soft"] if not inverse else PALETTE["sandstone"]
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    image.alpha_composite(radial_glow((size, size), (size * 0.5, size * 0.42), size * 0.2, halo, 100))

    arch_box = (size * 0.2, size * 0.15, size * 0.8, size * 0.84)
    draw.rounded_rectangle(
        arch_box,
        radius=size * 0.22,
        outline=rgba(stroke, 230),
        width=max(4, size // 72),
    )
    draw.rectangle(
        (size * 0.2, size * 0.47, size * 0.8, size * 0.84),
        fill=(0, 0, 0, 0),
        outline=None,
    )
    draw.line(
        [(size * 0.32, size * 0.74), (size * 0.68, size * 0.74)],
        fill=rgba(PALETTE["gold"] if not inverse else PALETTE["gold_soft"], 220),
        width=max(3, size // 96),
    )
    letter_fill = rgba(stroke, 245)
    monogram = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mdraw = ImageDraw.Draw(monogram)
    fnt = font(FONT_CORMORANT_MED, int(size * 0.44))
    mdraw.text((size * 0.28, size * 0.23), "B", font=fnt, fill=letter_fill)
    mdraw.text((size * 0.45, size * 0.25), "C", font=fnt, fill=rgba(stroke, 228))
    monogram = monogram.filter(ImageFilter.GaussianBlur(size / 260))
    image.alpha_composite(monogram)
    draw.arc(
        (size * 0.26, size * 0.47, size * 0.74, size * 0.86),
        start=198,
        end=342,
        fill=rgba(stroke, 190),
        width=max(4, size // 96),
    )
    return image


def logo_mark_svg(inverse: bool = False) -> str:
    stroke = PALETTE["parchment"] if inverse else PALETTE["ink"]
    gold = PALETTE["gold_soft"] if inverse else PALETTE["gold"]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="none"/>
  <path d="M102 233V204C102 120 165 76 256 76C347 76 410 120 410 204V233V387C410 434 372 434 256 434C140 434 102 434 102 387V233Z" fill="none" stroke="{stroke}" stroke-width="10" stroke-linejoin="round"/>
  <text x="151" y="292" font-family="Cormorant Garamond, serif" font-size="214" font-weight="500" fill="{stroke}">B</text>
  <text x="238" y="304" font-family="Cormorant Garamond, serif" font-size="214" font-weight="500" fill="{stroke}" opacity="0.95">C</text>
  <path d="M166 386 Q256 454 346 386" fill="none" stroke="{stroke}" stroke-width="8" stroke-linecap="round" opacity="0.78"/>
  <path d="M170 378 H342" fill="none" stroke="{gold}" stroke-width="6" stroke-linecap="round"/>
</svg>
"""


def wordmark_image(text: str, *, inverse: bool = False, plus: bool = False) -> Image.Image:
    w, h = 1400, 360
    image = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    fill = PALETTE["parchment"] if inverse else PALETTE["ink"]
    fnt = font(FONT_CORMORANT_MED, 186)
    centered_text(draw, (0, 32, w, h - 10), text, fnt, rgba(fill))
    if plus:
        plus_fnt = font(FONT_INTER_MED, 64)
        bb = draw.textbbox((0, 0), text, font=fnt)
        total_x = (w - (bb[2] - bb[0])) // 2
        plus_x = total_x + (bb[2] - bb[0]) + 10
        draw.text((plus_x, 126), "+", font=plus_fnt, fill=rgba(PALETTE["gold"] if not inverse else PALETTE["gold_soft"]))
    return image


def wordmark_svg(text: str, *, inverse: bool = False, plus: bool = False) -> str:
    fill = PALETTE["parchment"] if inverse else PALETTE["ink"]
    plus_fill = PALETTE["gold_soft"] if inverse else PALETTE["gold"]
    plus_node = '<text x="1020" y="168" font-family="Inter, sans-serif" font-size="52" font-weight="500" fill="%s">+</text>' % plus_fill if plus else ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="360" viewBox="0 0 1400 360">
  <rect width="100%" height="100%" fill="none"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle"
    font-family="Cormorant Garamond, serif" font-size="190" font-weight="500"
    letter-spacing="-2" fill="{fill}">{text}</text>
  {plus_node}
</svg>
"""


def app_icon_image() -> Image.Image:
    size = 1024
    image = painterly_base(
        (size, size),
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["parchment"], PALETTE["cobalt_light"]],
        seed=41,
    )
    image.alpha_composite(radial_glow((size, size), (size * 0.5, size * 0.3), size * 0.22, PALETTE["gold_soft"], 130))
    mark = logo_mark_image(560, inverse=False)
    image.alpha_composite(mark, (232, 190))
    return image


def adaptive_background_image() -> Image.Image:
    size = 432
    image = vertical_gradient((size, size), PALETTE["parchment_raised"], PALETTE["sandstone"])
    image.alpha_composite(radial_glow((size, size), (size * 0.5, size * 0.24), size * 0.2, PALETTE["gold_soft"], 110))
    return add_grain(image, 7)


def adaptive_foreground_image() -> Image.Image:
    size = 432
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mark = logo_mark_image(270, inverse=False)
    image.alpha_composite(mark, ((size - 270) // 2, (size - 270) // 2))
    return image


def notification_icon_image() -> Image.Image:
    size = 96
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    w = 8
    draw.arc((22, 16, 74, 64), start=210, end=330, fill=rgba(PALETTE["white"]), width=w)
    draw.line((26, 44, 26, 68), fill=rgba(PALETTE["white"]), width=w)
    draw.line((70, 44, 70, 68), fill=rgba(PALETTE["white"]), width=w)
    draw.line((26, 68, 70, 68), fill=rgba(PALETTE["white"]), width=w)
    draw.arc((30, 34, 66, 84), start=198, end=342, fill=rgba(PALETTE["white"]), width=6)
    return image


def splash_image() -> Image.Image:
    size = 2732
    image = painterly_base(
        (size, size),
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["parchment"], PALETTE["cobalt_light"]],
        seed=87,
    )
    mark = logo_mark_image(620, inverse=False)
    image.alpha_composite(mark, ((size - 620) // 2, 690))
    draw = ImageDraw.Draw(image)
    word_fnt = font(FONT_CORMORANT_MED, 252)
    centered_text(draw, (0, 1360, size, 1680), "BlessCupid", word_fnt, rgba(PALETTE["ink"]))
    draw.line((size * 0.42, 1745, size * 0.58, 1745), fill=rgba(PALETTE["gold"]), width=8)
    return image


def icon_canvas(size: int = 96) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def draw_chevron(draw: ImageDraw.ImageDraw, direction: str, fill: str, size: int = 96) -> None:
    pts = {
        "left": [(58, 22), (34, 48), (58, 74)],
        "right": [(38, 22), (62, 48), (38, 74)],
        "down": [(22, 36), (48, 60), (74, 36)],
        "up": [(22, 60), (48, 36), (74, 60)],
    }[direction]
    draw.line(pts, fill=rgba(fill), width=8, joint="curve")


def draw_plus(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((48, 22, 48, 74), fill=rgba(fill), width=8)
    draw.line((22, 48, 74, 48), fill=rgba(fill), width=8)


def draw_minus(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((22, 48, 74, 48), fill=rgba(fill), width=8)


def draw_close(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((24, 24, 72, 72), fill=rgba(fill), width=8)
    draw.line((72, 24, 24, 72), fill=rgba(fill), width=8)


def draw_check(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((20, 50, 40, 68, 76, 28), fill=rgba(fill), width=8, joint="curve")


def draw_check_circle(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((14, 14, 82, 82), outline=rgba(fill), width=6)
    draw_check(draw, fill)


def draw_search(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((18, 18, 58, 58), outline=rgba(fill), width=6)
    draw.line((54, 54, 76, 76), fill=rgba(fill), width=8)


def draw_bell(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.arc((22, 18, 74, 60), start=200, end=340, fill=rgba(fill), width=6)
    draw.line((26, 38, 26, 62), fill=rgba(fill), width=6)
    draw.line((70, 38, 70, 62), fill=rgba(fill), width=6)
    draw.line((24, 62, 72, 62), fill=rgba(fill), width=6)
    draw.ellipse((42, 68, 54, 80), fill=rgba(fill))


def draw_shield(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.polygon([(48, 14), (74, 26), (70, 58), (48, 80), (26, 58), (22, 26)], outline=rgba(fill), fill=None, width=6)


def draw_gear(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((26, 26, 70, 70), outline=rgba(fill), width=6)
    draw.ellipse((38, 38, 58, 58), outline=rgba(fill), width=6)
    for angle in range(0, 360, 45):
        r1, r2 = 28, 38
        x1 = 48 + math.cos(math.radians(angle)) * r1
        y1 = 48 + math.sin(math.radians(angle)) * r1
        x2 = 48 + math.cos(math.radians(angle)) * r2
        y2 = 48 + math.sin(math.radians(angle)) * r2
        draw.line((x1, y1, x2, y2), fill=rgba(fill), width=6)


def draw_report_flag(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((28, 18, 28, 78), fill=rgba(fill), width=6)
    draw.polygon([(30, 24), (64, 26), (54, 42), (64, 58), (30, 56)], outline=rgba(fill), fill=None, width=6)


def draw_block(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((18, 18, 78, 78), outline=rgba(fill), width=6)
    draw.line((28, 68, 68, 28), fill=rgba(fill), width=6)


def draw_heart(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.arc((20, 18, 48, 46), start=180, end=360, fill=rgba(fill), width=6)
    draw.arc((48, 18, 76, 46), start=180, end=360, fill=rgba(fill), width=6)
    draw.line((22, 32, 48, 70, 74, 32), fill=rgba(fill), width=6, joint="curve")


def draw_camera(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.rounded_rectangle((18, 28, 78, 70), radius=10, outline=rgba(fill), width=6)
    draw.line((28, 28, 38, 18, 58, 18, 66, 28), fill=rgba(fill), width=6, joint="curve")
    draw.ellipse((38, 36, 58, 56), outline=rgba(fill), width=6)


def draw_pencil(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.line((24, 70, 68, 26), fill=rgba(fill), width=8)
    draw.polygon([(64, 22), (74, 12), (82, 20), (72, 30)], outline=rgba(fill), fill=None, width=5)
    draw.line((20, 74, 32, 70), fill=rgba(fill), width=8)


def draw_signout(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.rounded_rectangle((18, 18, 44, 78), radius=8, outline=rgba(fill), width=6)
    draw.line((40, 48, 78, 48), fill=rgba(fill), width=6)
    draw.line((62, 32, 78, 48, 62, 64), fill=rgba(fill), width=6, joint="curve")


def draw_globe(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((16, 16, 80, 80), outline=rgba(fill), width=6)
    draw.arc((30, 16, 66, 80), start=90, end=270, fill=rgba(fill), width=4)
    draw.arc((30, 16, 66, 80), start=-90, end=90, fill=rgba(fill), width=4)
    draw.line((16, 48, 80, 48), fill=rgba(fill), width=4)
    draw.arc((16, 34, 80, 62), start=180, end=360, fill=rgba(fill), width=4)
    draw.arc((16, 34, 80, 62), start=0, end=180, fill=rgba(fill), width=4)


def draw_info(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((14, 14, 82, 82), outline=rgba(fill), width=6)
    draw.line((48, 40, 48, 64), fill=rgba(fill), width=6)
    draw.ellipse((44, 24, 52, 32), fill=rgba(fill))


def draw_lock(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.rounded_rectangle((24, 42, 72, 78), radius=8, outline=rgba(fill), width=6)
    draw.arc((30, 18, 66, 50), start=180, end=360, fill=rgba(fill), width=6)


def draw_today_nav(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.arc((34, 16, 62, 44), start=180, end=360, fill=rgba(fill), width=6)
    for x in (40, 48, 56):
        draw.line((x, 20, x, 28), fill=rgba(fill), width=4)
    draw.line((18, 56, 30, 34, 48, 48, 66, 34, 78, 56), fill=rgba(fill), width=6, joint="curve")
    draw.line((18, 56, 18, 72), fill=rgba(fill), width=6)
    draw.line((78, 56, 78, 72), fill=rgba(fill), width=6)
    draw.line((18, 72, 78, 72), fill=rgba(fill), width=6)


def draw_people_nav(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((22, 20, 46, 44), outline=rgba(fill), width=6)
    draw.ellipse((50, 18, 74, 42), outline=rgba(fill), width=6)
    draw.arc((16, 40, 52, 76), start=200, end=340, fill=rgba(fill), width=6)
    draw.arc((44, 38, 80, 74), start=200, end=340, fill=rgba(fill), width=6)


def draw_threads_nav(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.rounded_rectangle((18, 24, 78, 62), radius=12, outline=rgba(fill), width=6)
    draw.polygon([(34, 62), (44, 76), (52, 62)], outline=rgba(fill), fill=None, width=6)
    draw.line((30, 38, 66, 38), fill=rgba(fill), width=4)
    draw.line((30, 50, 58, 50), fill=rgba(fill), width=4)


def draw_you_nav(draw: ImageDraw.ImageDraw, fill: str) -> None:
    draw.ellipse((34, 18, 62, 46), outline=rgba(fill), width=6)
    draw.arc((22, 42, 74, 82), start=200, end=340, fill=rgba(fill), width=6)


def draw_chalice(draw: ImageDraw.ImageDraw, fill: str, scale: float = 1.0, x: float = 48, y: float = 48) -> None:
    w = int(22 * scale)
    h = int(16 * scale)
    stem = int(14 * scale)
    cup = [(x - w, y - h), (x + w, y - h), (x + w * 0.55, y), (x - w * 0.55, y)]
    draw.line(cup + [cup[0]], fill=rgba(fill), width=max(4, int(5 * scale)), joint="curve")
    draw.line((x, y, x, y + stem), fill=rgba(fill), width=max(4, int(5 * scale)))
    draw.line((x - w * 0.7, y + stem, x + w * 0.7, y + stem), fill=rgba(fill), width=max(4, int(5 * scale)))


def draw_open_book(draw: ImageDraw.ImageDraw, fill: str, size: int = 96) -> None:
    draw.line((18, 62, 34, 34, 48, 46, 62, 34, 78, 62), fill=rgba(fill), width=6, joint="curve")
    draw.line((18, 62, 18, 74), fill=rgba(fill), width=6)
    draw.line((78, 62, 78, 74), fill=rgba(fill), width=6)
    draw.line((18, 74, 78, 74), fill=rgba(fill), width=6)


def draw_house(draw: ImageDraw.ImageDraw, fill: str, bounds: tuple[int, int, int, int]) -> None:
    x1, y1, x2, y2 = bounds
    cx = (x1 + x2) / 2
    draw.line((x1, y1 + 16, cx, y1, x2, y1 + 16), fill=rgba(fill), width=6, joint="curve")
    draw.line((x1 + 6, y1 + 16, x1 + 6, y2), fill=rgba(fill), width=6)
    draw.line((x2 - 6, y1 + 16, x2 - 6, y2), fill=rgba(fill), width=6)
    draw.line((x1 + 6, y2, x2 - 6, y2), fill=rgba(fill), width=6)


GLYPH_DRAWERS = {
    "chevron-back": lambda d, c: draw_chevron(d, "left", c),
    "chevron-forward": lambda d, c: draw_chevron(d, "right", c),
    "chevron-down": lambda d, c: draw_chevron(d, "down", c),
    "chevron-up": lambda d, c: draw_chevron(d, "up", c),
    "close": draw_close,
    "plus": draw_plus,
    "minus": draw_minus,
    "check": draw_check,
    "check-circle": draw_check_circle,
    "search": draw_search,
    "bell": draw_bell,
    "shield": draw_shield,
    "gear": draw_gear,
    "report-flag": draw_report_flag,
    "block": draw_block,
    "heart-outline": draw_heart,
    "camera": draw_camera,
    "edit-pencil": draw_pencil,
    "sign-out": draw_signout,
    "language-globe": draw_globe,
    "info-circle": draw_info,
    "lock": draw_lock,
}


NAV_DRAWERS = {
    "tab-today-active": draw_today_nav,
    "tab-today-inactive": draw_today_nav,
    "tab-people-active": draw_people_nav,
    "tab-people-inactive": draw_people_nav,
    "tab-threads-active": draw_threads_nav,
    "tab-threads-inactive": draw_threads_nav,
    "tab-you-active": draw_you_nav,
    "tab-you-inactive": draw_you_nav,
}


TRADITION_DRAWERS = {
    "catholic": lambda d, c: draw_chalice(d, c, 1.2, 64, 58),
    "protestant-evangelical": lambda d, c: (draw_open_book(d, c), d.line((48, 14, 48, 28), fill=rgba(c), width=5), d.line((36, 22, 60, 22), fill=rgba(c), width=5)),
    "protestant-pentecostal": lambda d, c: d.line((64, 18, 54, 42, 68, 46, 48, 82), fill=rgba(c), width=7, joint="curve"),
    "protestant-reformed": lambda d, c: (draw_open_book(d, c), d.line((34, 24, 48, 14, 60, 24), fill=rgba(c), width=5)),
    "protestant-mainline": lambda d, c: d.rounded_rectangle((28, 22, 100, 98), radius=28, outline=rgba(c), width=6),
    "orthodox": lambda d, c: (d.rounded_rectangle((30, 18, 98, 100), radius=24, outline=rgba(c), width=6), d.line((64, 32, 64, 88), fill=rgba(c), width=5), d.line((46, 48, 82, 48), fill=rgba(c), width=5)),
    "other-christian": lambda d, c: (draw_house(d, c, (26, 36, 102, 100)), d.arc((38, 14, 90, 54), start=180, end=360, fill=rgba(c), width=5)),
    "still-figuring": lambda d, c: (d.line((22, 92, 44, 74, 58, 62, 74, 42, 94, 26), fill=rgba(c), width=6, joint="curve"), d.ellipse((88, 20, 104, 36), outline=rgba(c), width=4)),
}


PRACTICE_DRAWERS = {
    "sunday-in-person": lambda d, c: draw_house(d, c, (28, 30, 100, 102)),
    "sunday-online": lambda d, c: (d.rounded_rectangle((22, 26, 106, 82), radius=10, outline=rgba(c), width=6), d.line((48, 92, 80, 92), fill=rgba(c), width=6), d.line((64, 82, 64, 92), fill=rgba(c), width=6)),
    "catholic-mass": lambda d, c: draw_chalice(d, c, 1.25, 64, 54),
    "daily-prayer": lambda d, c: (d.line((44, 34, 56, 54, 64, 42, 74, 34), fill=rgba(c), width=6, joint="curve"), d.line((56, 54, 56, 88), fill=rgba(c), width=6), d.line((64, 42, 64, 88), fill=rgba(c), width=6)),
    "small-group": lambda d, c: (d.ellipse((20, 34, 44, 58), outline=rgba(c), width=5), d.ellipse((52, 24, 76, 48), outline=rgba(c), width=5), d.ellipse((84, 34, 108, 58), outline=rgba(c), width=5), d.arc((16, 52, 48, 90), start=200, end=340, fill=rgba(c), width=5), d.arc((48, 42, 80, 80), start=200, end=340, fill=rgba(c), width=5), d.arc((80, 52, 112, 90), start=200, end=340, fill=rgba(c), width=5)),
    "worship-at-home": lambda d, c: (draw_house(d, c, (28, 32, 100, 102)), d.line((64, 48, 64, 84), fill=rgba(c), width=4)),
    "still-finding-a-community": lambda d, c: (d.line((20, 96, 44, 76, 64, 60, 84, 40, 102, 26), fill=rgba(c), width=6, joint="curve"), draw_house(d, c, (72, 16, 116, 60))),
}


def simple_icon_svg(key: str, stroke: str) -> str:
    nodes = {
        "chevron-back": '<polyline points="58,22 34,48 58,74" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "chevron-forward": '<polyline points="38,22 62,48 38,74" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "chevron-down": '<polyline points="22,36 48,60 74,36" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "chevron-up": '<polyline points="22,60 48,36 74,60" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "close": '<line x1="24" y1="24" x2="72" y2="72" stroke="{s}" stroke-width="8" stroke-linecap="round"/><line x1="72" y1="24" x2="24" y2="72" stroke="{s}" stroke-width="8" stroke-linecap="round"/>',
        "plus": '<line x1="48" y1="22" x2="48" y2="74" stroke="{s}" stroke-width="8" stroke-linecap="round"/><line x1="22" y1="48" x2="74" y2="48" stroke="{s}" stroke-width="8" stroke-linecap="round"/>',
        "minus": '<line x1="22" y1="48" x2="74" y2="48" stroke="{s}" stroke-width="8" stroke-linecap="round"/>',
        "check": '<polyline points="20,50 40,68 76,28" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "check-circle": '<circle cx="48" cy="48" r="34" fill="none" stroke="{s}" stroke-width="6"/><polyline points="20,50 40,68 76,28" fill="none" stroke="{s}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>',
        "search": '<circle cx="38" cy="38" r="20" fill="none" stroke="{s}" stroke-width="6"/><line x1="54" y1="54" x2="76" y2="76" stroke="{s}" stroke-width="8" stroke-linecap="round"/>',
        "info-circle": '<circle cx="48" cy="48" r="34" fill="none" stroke="{s}" stroke-width="6"/><line x1="48" y1="40" x2="48" y2="64" stroke="{s}" stroke-width="6" stroke-linecap="round"/><circle cx="48" cy="28" r="4" fill="{s}"/>',
        "lock": '<rect x="24" y="42" width="48" height="36" rx="8" fill="none" stroke="{s}" stroke-width="6"/><path d="M30 50C30 34 38 22 48 22C58 22 66 34 66 50" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round"/>',
    }
    body = nodes.get(key)
    if not body:
        return ""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  {body.format(s=stroke)}
</svg>
"""


def nav_icon_svg(key: str, stroke: str) -> str:
    bodies = {
        "tab-today-active": '<path d="M18 56L30 34L48 48L66 34L78 56" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 56V72H78V56" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 30A14 14 0 0 1 62 30" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round"/>',
        "tab-people-active": '<circle cx="34" cy="32" r="12" fill="none" stroke="{s}" stroke-width="6"/><circle cx="62" cy="30" r="12" fill="none" stroke="{s}" stroke-width="6"/><path d="M18 64A18 18 0 0 1 50 64" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round"/><path d="M46 62A18 18 0 0 1 78 62" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round"/>',
        "tab-threads-active": '<rect x="18" y="24" width="60" height="38" rx="12" fill="none" stroke="{s}" stroke-width="6"/><path d="M34 62L44 76L52 62" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 38H66M30 50H58" fill="none" stroke="{s}" stroke-width="4" stroke-linecap="round"/>',
        "tab-you-active": '<circle cx="48" cy="32" r="14" fill="none" stroke="{s}" stroke-width="6"/><path d="M22 68A26 26 0 0 1 74 68" fill="none" stroke="{s}" stroke-width="6" stroke-linecap="round"/>',
    }
    base_key = key.replace("-inactive", "-active")
    body = bodies[base_key]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  {body.format(s=stroke)}
</svg>
"""


def portrait_placeholder(index: int) -> Image.Image:
    size = (750, 1000)
    accents = [
        [PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["sage"], PALETTE["parchment"]],
        [PALETTE["sage"], PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["parchment"]],
        [PALETTE["amber"], PALETTE["gold_soft"], PALETTE["sandstone"], PALETTE["parchment"]],
        [PALETTE["cobalt_light"], PALETTE["gold_soft"], PALETTE["sandstone"], PALETTE["parchment"]],
        [PALETTE["gold_soft"], PALETTE["parchment"], PALETTE["sandstone_deep"], PALETTE["sage"]],
        [PALETTE["amber_dark"], PALETTE["sage"], PALETTE["gold_soft"], PALETTE["sandstone"]],
    ][index - 1]
    base = painterly_base(
        size,
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=accents,
        seed=100 + index,
    )
    head = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(head)
    cx = size[0] * (0.48 + (index - 3) * 0.01)
    head_w = 230 + index * 4
    head_h = 280 + index * 6
    shoulder_w = 490 + index * 6
    shoulder_h = 380 + index * 10
    draw.ellipse((cx - head_w / 2, 170, cx + head_w / 2, 170 + head_h), fill=rgba(PALETTE["parchment"], 95))
    draw.rounded_rectangle((cx - shoulder_w / 2, 420, cx + shoulder_w / 2, 420 + shoulder_h), radius=160, fill=rgba(PALETTE["parchment"], 78))
    head = head.filter(ImageFilter.GaussianBlur(42))
    base.alpha_composite(head)
    base.alpha_composite(radial_glow(size, (cx, 260), 170, PALETTE["gold_soft"], 130))
    return base


def verse_background(which: str) -> Image.Image:
    configs = {
        "morning": dict(top=PALETTE["parchment_raised"], bottom=PALETTE["sandstone"], accents=[PALETTE["gold_soft"], PALETTE["parchment"], PALETTE["cobalt_light"], PALETTE["sandstone_deep"]], seed=201),
        "midday": dict(top=PALETTE["parchment"], bottom=PALETTE["sandstone"], accents=[PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["parchment_raised"], PALETTE["sage"]], seed=202),
        "evening": dict(top=PALETTE["sandstone"], bottom=PALETTE["sandstone_deep"], accents=[PALETTE["amber"], PALETTE["sage"], PALETTE["gold_soft"], PALETTE["parchment"]], seed=203),
    }[which]
    image = painterly_base((1080, 1350), **configs)
    image.alpha_composite(radial_glow((1080, 1350), (540, 320), 260, PALETTE["gold_soft"], 120))
    return image


def hero_welcome() -> Image.Image:
    image = painterly_base(
        (1500, 900),
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["sandstone_deep"], PALETTE["parchment"], PALETTE["cobalt_light"]],
        seed=301,
    )
    draw = ImageDraw.Draw(image)
    draw.arc((300, -80, 1200, 820), start=190, end=350, fill=rgba(PALETTE["ink_soft"], 90), width=8)
    for x, a in [(320, 56), (520, 42), (720, 36)]:
        beam = Image.new("RGBA", image.size, (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(beam)
        bdraw.polygon([(x, 120), (x + 140, 120), (x + 420, 900), (x + 250, 900)], fill=rgba(PALETTE["gold_soft"], a))
        image.alpha_composite(beam.filter(ImageFilter.GaussianBlur(32)))
    draw.line((190, 720, 1310, 720), fill=rgba(PALETTE["gold"], 140), width=4)
    return image


def hero_done() -> Image.Image:
    image = painterly_base(
        (1500, 900),
        top=PALETTE["parchment"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["sage"], PALETTE["sandstone_deep"], PALETTE["parchment"]],
        seed=302,
    )
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((520, 170, 980, 770), radius=30, outline=rgba(PALETTE["ink_soft"], 120), width=8)
    draw.rectangle((630, 250, 860, 760), fill=rgba(PALETTE["parchment_raised"], 140), outline=None)
    image.alpha_composite(radial_glow(image.size, (760, 510), 240, PALETTE["gold_soft"], 150))
    draw.line((860, 250, 860, 760), fill=rgba(PALETTE["ink_soft"], 120), width=8)
    draw.line((858, 510, 1110, 620), fill=rgba(PALETTE["sage"], 120), width=10)
    return image


def hero_dating_out_of_scope() -> Image.Image:
    image = painterly_base(
        (1500, 900),
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["parchment"], PALETTE["sage"], PALETTE["sandstone_deep"]],
        seed=303,
    )
    draw = ImageDraw.Draw(image)
    draw.line((360, 280, 360, 760), fill=rgba(PALETTE["ink_soft"], 110), width=10)
    draw.line((1140, 280, 1140, 760), fill=rgba(PALETTE["ink_soft"], 110), width=10)
    draw.arc((360, 120, 1140, 520), start=180, end=360, fill=rgba(PALETTE["ink_soft"], 110), width=10)
    draw.line((440, 740, 750, 610, 1060, 740), fill=rgba(PALETTE["gold"], 150), width=8, joint="curve")
    image.alpha_composite(radial_glow(image.size, (750, 360), 220, PALETTE["gold_soft"], 140))
    return image


def hero_offer_band() -> Image.Image:
    image = painterly_base(
        (1500, 600),
        top=PALETTE["parchment_raised"],
        bottom=PALETTE["sandstone"],
        accents=[PALETTE["gold_soft"], PALETTE["amber"], PALETTE["parchment"], PALETTE["sandstone_deep"]],
        seed=304,
    )
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((540, 180, 960, 540), radius=42, outline=rgba(PALETTE["ink_soft"], 110), width=8)
    draw.line((750, 240, 750, 480), fill=rgba(PALETTE["gold"], 180), width=14)
    draw.line((630, 360, 870, 360), fill=rgba(PALETTE["gold"], 180), width=14)
    image.alpha_composite(radial_glow(image.size, (750, 360), 180, PALETTE["gold_soft"], 160))
    return image


def object_card(size: tuple[int, int], seed: int, object_fn) -> Image.Image:
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    image.alpha_composite(radial_glow(size, (size[0] * 0.52, size[1] * 0.42), min(size) * 0.26, PALETTE["gold_soft"], 135))
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    object_fn(ImageDraw.Draw(shadow), PALETTE["ink_soft"], alpha=50)
    image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    object_fn(ImageDraw.Draw(image), PALETTE["ink_soft"], alpha=210)
    return image


def empty_today() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.line((130, 300, 340, 300), fill=c, width=8)
        draw.ellipse((170, 220, 300, 280), outline=c, width=7)
        draw.line((210, 220, 196, 170), fill=c, width=7)
        draw.line((262, 220, 276, 170), fill=c, width=7)
        draw.polygon([(268, 146), (342, 166), (326, 232), (252, 212)], outline=c, fill=None, width=7)
    return object_card((480, 480), 1, draw_obj)


def empty_people() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.line((158, 132, 158, 332), fill=c, width=8)
        draw.line((322, 132, 322, 332), fill=c, width=8)
        draw.arc((120, 92, 360, 208), start=180, end=360, fill=c, width=8)
        draw.line((120, 332, 360, 332), fill=c, width=8)
    return object_card((480, 480), 2, draw_obj)


def empty_threads() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.rectangle((138, 164, 342, 302), outline=c, width=8)
        draw.line((138, 170, 240, 246, 342, 170), fill=c, width=8, joint="curve")
    return object_card((480, 480), 3, draw_obj)


def empty_search() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.rectangle((140, 130, 300, 350), outline=c, width=8)
        draw.ellipse((220, 220, 320, 320), outline=c, width=8)
        draw.line((300, 300, 352, 352), fill=c, width=8)
    return object_card((480, 480), 4, draw_obj)


def empty_offline() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.arc((184, 112, 296, 276), start=180, end=360, fill=c, width=8)
        draw.line((200, 196, 200, 328), fill=c, width=8)
        draw.line((280, 196, 280, 328), fill=c, width=8)
        draw.line((176, 330, 304, 330), fill=c, width=8)
        draw.line((226, 142, 256, 172), fill=rgba(PALETTE["gold"], alpha), width=6)
    return object_card((480, 480), 5, draw_obj)


def empty_under_construction() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.rectangle((130, 224, 300, 316), outline=c, width=8)
        draw.rectangle((170, 170, 340, 262), outline=c, width=8)
        draw.line((300, 224, 352, 170), fill=rgba(PALETTE["gold"], alpha), width=8)
    return object_card((480, 480), 6, draw_obj)


def error_network() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.line((80, 190, 160, 150, 220, 180, 282, 132), fill=c, width=8, joint="curve")
        draw.line((282, 132, 256, 208), fill=rgba(PALETTE["amber_dark"], alpha), width=8)
    return object_card((360, 360), 7, draw_obj)


def error_server() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.rectangle((120, 88, 250, 270), outline=c, width=8)
        draw.line((250, 88, 250, 270), fill=rgba(PALETTE["gold"], alpha), width=8)
    return object_card((360, 360), 8, draw_obj)


def error_unauthorized() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.arc((92, 74, 210, 170), start=180, end=360, fill=c, width=8)
        draw.rectangle((106, 150, 196, 246), outline=c, width=8)
        draw.line((196, 198, 258, 128), fill=rgba(PALETTE["gold"], alpha), width=8)
    return object_card((360, 360), 9, draw_obj)


def error_face_detect() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.ellipse((112, 80, 234, 190), outline=c, width=8)
        draw.arc((78, 164, 270, 308), start=200, end=340, fill=c, width=8)
        draw.line((244, 174, 294, 146, 282, 212), fill=rgba(PALETTE["gold"], alpha), width=8, joint="curve")
    return object_card((360, 360), 10, draw_obj)


def error_moderation() -> Image.Image:
    def draw_obj(draw, fill, alpha=210):
        c = rgba(fill, alpha)
        draw.polygon([(118, 118), (236, 118), (260, 154), (260, 248), (118, 248)], outline=c, fill=None, width=8)
        draw.line((236, 118, 236, 154, 260, 154), fill=c, width=8)
    return object_card((360, 360), 11, draw_obj)


def parchment_grain() -> Image.Image:
    base = Image.new("RGBA", (1500, 1500), (0, 0, 0, 0))
    noise = Image.effect_noise((1500, 1500), 12)
    noise = ImageOps.autocontrast(noise)
    tint = ImageOps.colorize(noise.convert("L"), black="#8B7C65", white="#FFF3DC").convert("RGBA")
    tint.putalpha(Image.new("L", (1500, 1500), 22))
    return Image.alpha_composite(base, tint)


def gold_rule_svg() -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="200" height="4" viewBox="0 0 200 4">
  <line x1="0" y1="2" x2="200" y2="2" stroke="{PALETTE['gold']}" stroke-width="2" stroke-linecap="round"/>
</svg>
"""


def export_wordmarks() -> None:
    defs = [
        ("wordmark-primary", "BlessCupid", False, False),
        ("wordmark-inverse", "BlessCupid", True, False),
        ("bless-plus-wordmark", "Bless", False, True),
    ]
    for key, text, inverse, plus in defs:
        save_png(key, wordmark_image(text, inverse=inverse, plus=plus), OUT / "logo" / f"{key}.png", "P1")
        save_svg(key, wordmark_svg(text, inverse=inverse, plus=plus), OUT / "logo" / f"{key}.svg", 1400, 360, "P1")


def export_logo_marks() -> None:
    for key, inverse in [("logo-mark", False), ("logo-mark-inverse", True)]:
        save_png(key, logo_mark_image(512, inverse=inverse), OUT / "logo" / f"{key}.png", "P1")
        save_svg(key, logo_mark_svg(inverse=inverse), OUT / "logo" / f"{key}.svg", 512, 512, "P1")


def export_app_icon_pack() -> None:
    save_png("ios-app-icon-master-1024", app_icon_image(), OUT / "app-icon" / "ios-app-icon-master-1024.png", "P1")
    save_png("android-adaptive-background", adaptive_background_image(), OUT / "app-icon" / "android-adaptive-background.png", "P1")
    save_png("android-adaptive-foreground", adaptive_foreground_image(), OUT / "app-icon" / "android-adaptive-foreground.png", "P1")
    save_png("android-notification-icon", notification_icon_image(), OUT / "app-icon" / "android-notification-icon.png", "P1")


def export_splash() -> None:
    save_png("launch-splash-master", splash_image(), OUT / "splash" / "launch-splash-master.png", "P1")


def export_nav_icons() -> None:
    for key, drawer in NAV_DRAWERS.items():
        fill = PALETTE["amber_dark"] if key.endswith("active") else PALETTE["ink_soft"]
        img, draw = icon_canvas()
        drawer(draw, fill)
        save_png(key, img, OUT / "nav" / f"{key}.png", "P1")
        save_svg(key, nav_icon_svg(key, fill), OUT / "nav" / f"{key}.svg", 96, 96, "P1")


def export_glyphs() -> None:
    for key, drawer in GLYPH_DRAWERS.items():
        img, draw = icon_canvas()
        drawer(draw, PALETTE["ink_soft"])
        save_png(key, img, OUT / "glyphs" / f"{key}.png", "P1")
        svg = simple_icon_svg(key, PALETTE["ink_soft"])
        if svg:
            save_svg(key, svg, OUT / "glyphs" / f"{key}.svg", 96, 96, "P1")


def export_portraits() -> None:
    for i in range(1, 7):
        key = f"portrait-placeholder-{i}"
        save_png(key, portrait_placeholder(i), OUT / "portraits" / f"{key}.png", "P0")


def export_verse_backgrounds() -> None:
    for key in ("morning", "midday", "evening"):
        slug = f"verse-card-bg-{key}"
        save_png(slug, verse_background(key), OUT / "verse" / f"{slug}.png", "P1")


def export_heroes() -> None:
    save_png("welcome-hero", hero_welcome(), OUT / "heroes" / "welcome-hero.png", "P2")
    save_png("done-hero", hero_done(), OUT / "heroes" / "done-hero.png", "P2")
    save_png("dating-out-of-scope-hero", hero_dating_out_of_scope(), OUT / "heroes" / "dating-out-of-scope-hero.png", "P2")
    save_png("one-time-offer-band", hero_offer_band(), OUT / "heroes" / "one-time-offer-band.png", "P2")


def export_empty_states() -> None:
    save_png("today-empty", empty_today(), OUT / "empty" / "today-empty.png", "P2")
    save_png("people-empty", empty_people(), OUT / "empty" / "people-empty.png", "P2")
    save_png("threads-empty", empty_threads(), OUT / "empty" / "threads-empty.png", "P2")
    save_png("search-empty", empty_search(), OUT / "empty" / "search-empty.png", "P2")
    save_png("offline", empty_offline(), OUT / "empty" / "offline.png", "P2")
    save_png("under-construction", empty_under_construction(), OUT / "empty" / "under-construction.png", "P2")


def export_error_states() -> None:
    save_png("error-network", error_network(), OUT / "error" / "error-network.png", "P3")
    save_png("error-server", error_server(), OUT / "error" / "error-server.png", "P3")
    save_png("error-unauthorized", error_unauthorized(), OUT / "error" / "error-unauthorized.png", "P3")
    save_png("error-face-detect", error_face_detect(), OUT / "error" / "error-face-detect.png", "P3")
    save_png("error-moderation", error_moderation(), OUT / "error" / "error-moderation.png", "P3")


def export_badges() -> None:
    for key, drawer in TRADITION_DRAWERS.items():
        img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        drawer(ImageDraw.Draw(img), PALETTE["ink_soft"])
        save_png(key, img, OUT / "tradition" / f"{key}.png", "P3")
    for key, drawer in PRACTICE_DRAWERS.items():
        img = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        drawer(ImageDraw.Draw(img), PALETTE["ink_soft"])
        save_png(key, img, OUT / "practice" / f"{key}.png", "P3")


def export_textures() -> None:
    save_png("parchment-grain", parchment_grain(), OUT / "textures" / "parchment-grain.png", "P3")
    save_svg("gold-rule", gold_rule_svg(), OUT / "textures" / "gold-rule.svg", 200, 4, "P3")


def export_manifest() -> None:
    payload = {
        "generatedBy": "apps/mobile/scripts/generate_brand_v2.py",
        "brandDirection": "Garden Hours",
        "assets": [asdict(item) for item in sorted(MANIFEST, key=lambda x: (x.priority, x.path))],
    }
    path = OUT / "manifest.json"
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    ensure_dir(OUT)
    export_wordmarks()
    export_logo_marks()
    export_app_icon_pack()
    export_splash()
    export_nav_icons()
    export_glyphs()
    export_portraits()
    export_verse_backgrounds()
    export_heroes()
    export_empty_states()
    export_error_states()
    export_badges()
    export_textures()
    export_manifest()
    print(f"Generated {len(MANIFEST)} assets into {OUT}")


if __name__ == "__main__":
    main()
