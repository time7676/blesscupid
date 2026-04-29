#!/usr/bin/env python3
"""
Generate BlessCupid brand assets for the current mobile app runtime.

Why PNG-heavy:
- The app currently renders bitmap assets via React Native <Image>.
- `react-native-svg` is not installed, so runtime-safe PNG exports are the
  most useful output today.

This script still emits a few SVG source files for the logo, wordmark,
BottomNav icons, and the gold rule so future vector adoption has a clean base.
"""

from __future__ import annotations

import json
import math
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "brand"
IOS = ROOT / "ios" / "BlessCupid" / "Images.xcassets"
ANDROID = ROOT / "android" / "app" / "src" / "main" / "res"

PALETTE = {
    "ink": "#1A1A24",
    "ink_soft": "#625C57",
    "ink_charcoal": "#14181F",
    "parchment": "#FAF7F0",
    "parchment_raised": "#FFFDF7",
    "sandstone": "#E9DDC9",
    "sandstone_warm": "#F4ECDF",
    "sandstone_deep": "#D9C8AE",
    "gold": "#C59A35",
    "gold_soft": "#E5C97D",
    "amber": "#B46E26",
    "amber_light": "#F7DFC0",
    "cobalt_50": "#EEF3FB",
    "cobalt_100": "#D6E0F4",
    "cobalt_300": "#8EA7D7",
    "cobalt_700": "#2D4F84",
    "sage_100": "#DDE8DC",
    "sage_300": "#9DBA9A",
    "sage_700": "#4A6951",
    "white": "#FFFFFF",
}

FONT_DIR = ROOT / "node_modules" / "@expo-google-fonts" / "cormorant-garamond"
FONT_REGULAR = FONT_DIR / "400Regular" / "CormorantGaramond_400Regular.ttf"
FONT_MEDIUM = FONT_DIR / "500Medium" / "CormorantGaramond_500Medium.ttf"
FONT_ITALIC = FONT_DIR / "500Medium_Italic" / "CormorantGaramond_500Medium_Italic.ttf"


@dataclass(frozen=True)
class ExportRecord:
    key: str
    path: str
    width: int
    height: int
    kind: str


MANIFEST: list[ExportRecord] = []


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def rgba(hex_color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = hex_color.lstrip("#")
    return (
        int(value[0:2], 16),
        int(value[2:4], 16),
        int(value[4:6], 16),
        alpha,
    )


def font(size: int, weight: str = "medium") -> ImageFont.FreeTypeFont:
    source = {
        "regular": FONT_REGULAR,
        "medium": FONT_MEDIUM,
        "italic": FONT_ITALIC,
    }[weight]
    return ImageFont.truetype(str(source), size)


def save_png(key: str, image: Image.Image, path: Path) -> None:
    ensure_dir(path.parent)
    image.save(path, format="PNG")
    MANIFEST.append(
        ExportRecord(key=key, path=str(path.relative_to(ROOT)), width=image.width, height=image.height, kind="png")
    )


def save_svg(key: str, svg: str, path: Path, width: int, height: int) -> None:
    ensure_dir(path.parent)
    path.write_text(svg, encoding="utf-8")
    MANIFEST.append(
        ExportRecord(key=key, path=str(path.relative_to(ROOT)), width=width, height=height, kind="svg")
    )


def lerp(a: int, b: int, t: float) -> int:
    return round(a + (b - a) * t)


def vertical_gradient(size: tuple[int, int], top: str, bottom: str) -> Image.Image:
    width, height = size
    start = rgba(top)
    end = rgba(bottom)
    base = Image.new("RGBA", size)
    pix = base.load()
    for y in range(height):
        t = y / max(height - 1, 1)
        row = tuple(lerp(start[i], end[i], t) for i in range(4))
        for x in range(width):
            pix[x, y] = row
    return base


def radial_glow(size: tuple[int, int], center: tuple[float, float], radius: float, color: str, alpha: int) -> Image.Image:
    width, height = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    for step in range(14, 0, -1):
        frac = step / 14
        r = radius * frac
        a = int(alpha * (frac**2) * 0.6)
        fill = rgba(color, a)
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill)
    return layer.filter(ImageFilter.GaussianBlur(radius=max(6, int(radius * 0.08))))


def add_blurred_blob(image: Image.Image, box: tuple[int, int, int, int], color: str, alpha: int, blur: int) -> None:
    layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=rgba(color, alpha))
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def add_paper_grain(image: Image.Image, amount: int = 12, seed: int = 0) -> Image.Image:
    rng = random.Random(seed)
    noise = Image.effect_noise(image.size, amount)
    noise = ImageOps.autocontrast(noise)
    tinted = ImageOps.colorize(noise.convert("L"), black="#000000", white="#FFFFFF").convert("RGBA")
    tinted.putalpha(Image.new("L", image.size, 18))
    if rng.random() > 0.5:
        tinted = tinted.filter(ImageFilter.GaussianBlur(0.35))
    return Image.alpha_composite(image, tinted)


def painterly_canvas(
    size: tuple[int, int],
    *,
    top: str,
    bottom: str,
    accents: Iterable[str],
    seed: int,
    grain: int = 12,
) -> Image.Image:
    rng = random.Random(seed)
    image = vertical_gradient(size, top, bottom)
    width, height = size
    image.alpha_composite(radial_glow(size, (width * 0.28, height * 0.2), width * 0.32, PALETTE["gold_soft"], 120))
    image.alpha_composite(radial_glow(size, (width * 0.72, height * 0.7), width * 0.36, PALETTE["cobalt_100"], 72))
    palette = list(accents)
    for idx in range(8):
        color = palette[idx % len(palette)]
        left = int(rng.uniform(-0.15, 0.7) * width)
        top_pos = int(rng.uniform(-0.1, 0.75) * height)
        blob_w = int(rng.uniform(0.18, 0.5) * width)
        blob_h = int(rng.uniform(0.18, 0.55) * height)
        alpha = rng.randint(42, 88)
        blur = rng.randint(max(12, width // 40), max(26, width // 18))
        add_blurred_blob(image, (left, top_pos, left + blob_w, top_pos + blob_h), color, alpha, blur)
    return add_paper_grain(image, amount=grain, seed=seed)


def add_halo(image: Image.Image, center: tuple[int, int], radius: int, color: str, alpha: int) -> None:
    image.alpha_composite(radial_glow(image.size, center, radius, color, alpha))


def center_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, fnt: ImageFont.FreeTypeFont, fill: tuple[int, int, int, int]) -> tuple[int, int]:
    left, top, right, bottom = box
    bb = draw.textbbox((0, 0), text, font=fnt)
    x = left + (right - left - (bb[2] - bb[0])) // 2
    y = top + (bottom - top - (bb[3] - bb[1])) // 2 - 4
    draw.text((x, y), text, font=fnt, fill=fill)
    return x, y


def draw_logo_mark(size: int = 512, inverse: bool = False) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    stroke = PALETTE["parchment"] if inverse else PALETTE["ink"]
    soft = PALETTE["sandstone"] if inverse else PALETTE["gold_soft"]
    cx = size / 2
    cy = size / 2
    outer = int(size * 0.11)
    draw.rounded_rectangle(
        (size * 0.18, size * 0.18, size * 0.82, size * 0.82),
        radius=size * 0.22,
        outline=rgba(stroke, 210),
        width=max(3, size // 64),
    )
    add_halo(image, (int(cx), int(cy - size * 0.03)), int(size * 0.22), soft, 95)
    monogram = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    monodraw = ImageDraw.Draw(monogram)
    fnt = font(int(size * 0.48), "medium")
    monodraw.text((size * 0.24, size * 0.18), "B", font=fnt, fill=rgba(stroke, 255))
    monodraw.text((size * 0.44, size * 0.2), "C", font=fnt, fill=rgba(stroke, 235))
    monogram = monogram.filter(ImageFilter.GaussianBlur(radius=max(0, size // 220)))
    image.alpha_composite(monogram)
    draw.arc(
        (size * 0.24, size * 0.54, size * 0.76, size * 0.9),
        start=205,
        end=335,
        fill=rgba(stroke, 200),
        width=max(3, size // 80),
    )
    draw.line(
        [(size * 0.36, size * 0.72), (size * 0.64, size * 0.72)],
        fill=rgba(stroke, 180),
        width=max(2, size // 96),
    )
    return image


def wordmark_svg(text: str, fill: str, width: int = 1024, height: int = 320) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="100%" height="100%" fill="none"/>
  <text x="50%" y="52%" text-anchor="middle" dominant-baseline="middle"
    font-family="Cormorant Garamond, serif" font-size="172" font-weight="500"
    letter-spacing="-1.2" fill="{fill}">{text}</text>
</svg>
"""


def logo_mark_svg(stroke: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="92" y="92" width="328" height="328" rx="112" fill="none" stroke="{stroke}" stroke-width="10" opacity="0.9"/>
  <text x="196" y="286" font-family="Cormorant Garamond, serif" font-size="214" font-weight="500" fill="{stroke}">B</text>
  <text x="258" y="292" font-family="Cormorant Garamond, serif" font-size="214" font-weight="500" fill="{stroke}" opacity="0.92">C</text>
  <path d="M170 370 Q256 430 342 370" fill="none" stroke="{stroke}" stroke-width="8" stroke-linecap="round" opacity="0.82"/>
  <path d="M198 368 H314" fill="none" stroke="{stroke}" stroke-width="5" stroke-linecap="round" opacity="0.76"/>
</svg>
"""


def draw_wordmark(text: str, inverse: bool = False, plus: bool = False) -> Image.Image:
    width, height = 1400, 360
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    fill = rgba(PALETTE["parchment"] if inverse else PALETTE["ink"])
    base_font = font(182, "medium")
    bb = draw.textbbox((0, 0), text, font=base_font)
    x = (width - (bb[2] - bb[0])) // 2
    y = (height - (bb[3] - bb[1])) // 2 - 16
    draw.text((x, y), text, font=base_font, fill=fill)
    if plus:
        plus_font = font(126, "italic")
        px = bb[2] + x + 8
        py = y + 36
        draw.text((px, py), "+", font=plus_font, fill=rgba(PALETTE["amber"] if not inverse else PALETTE["gold_soft"]))
    return image


def draw_app_icon() -> Image.Image:
    size = 1024
    base = Image.new("RGBA", (size, size), rgba(PALETTE["parchment_raised"]))
    add_halo(base, (size // 2, int(size * 0.28)), 280, PALETTE["gold_soft"], 96)
    add_halo(base, (int(size * 0.72), int(size * 0.78)), 320, PALETTE["cobalt_100"], 52)
    mark = draw_logo_mark(700)
    mark = mark.resize((700, 700), Image.LANCZOS)
    shadow = Image.new("RGBA", base.size, (0, 0, 0, 0))
    shadow.paste(mark, (162, 182))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    shadow = ImageEnhanceAlpha(shadow, 0.14)
    base.alpha_composite(shadow)
    base.alpha_composite(mark, (162, 154))
    return add_paper_grain(base, amount=10, seed=11)


def ImageEnhanceAlpha(image: Image.Image, factor: float) -> Image.Image:
    r, g, b, a = image.split()
    a = a.point(lambda p: int(p * factor))
    return Image.merge("RGBA", (r, g, b, a))


def make_splash() -> Image.Image:
    size = 2732
    image = Image.new("RGBA", (size, size), rgba(PALETTE["parchment"]))
    add_halo(image, (size // 2, int(size * 0.33)), 780, PALETTE["gold_soft"], 84)
    add_halo(image, (int(size * 0.68), int(size * 0.72)), 920, PALETTE["cobalt_50"], 58)
    mark = draw_logo_mark(900)
    image.alpha_composite(mark, ((size - 900) // 2, 760))
    wordmark = draw_wordmark("BlessCupid")
    image.alpha_composite(wordmark.resize((1200, 308), Image.LANCZOS), ((size - 1200) // 2, 1590))
    draw = ImageDraw.Draw(image)
    draw.line(
        ((size - 320) // 2, 1948, (size + 320) // 2, 1948),
        fill=rgba(PALETTE["gold"], 224),
        width=6,
    )
    return add_paper_grain(image, amount=10, seed=29)


def hero_scene(kind: str, size: tuple[int, int]) -> Image.Image:
    width, height = size
    if kind == "welcome":
        image = painterly_canvas(
            size,
            top=PALETTE["parchment"],
            bottom=PALETTE["sandstone_warm"],
            accents=[PALETTE["gold_soft"], PALETTE["amber_light"], PALETTE["cobalt_100"]],
            seed=101,
        )
        draw = ImageDraw.Draw(image)
        add_halo(image, (width // 2, int(height * 0.18)), int(width * 0.18), PALETTE["gold_soft"], 140)
        for side in (0.34, 0.66):
            palm = Image.new("RGBA", size, (0, 0, 0, 0))
            d = ImageDraw.Draw(palm)
            base_x = int(width * side)
            d.ellipse((base_x - 58, int(height * 0.56), base_x + 58, int(height * 0.82)), fill=rgba(PALETTE["sandstone_deep"], 150))
            d.rectangle((base_x - 26, int(height * 0.72), base_x + 26, int(height * 0.9)), fill=rgba(PALETTE["sandstone_deep"], 150))
            d.rounded_rectangle((base_x - 90, int(height * 0.62), base_x + 90, int(height * 0.78)), radius=48, outline=rgba(PALETTE["ink_soft"], 80), width=4)
            image.alpha_composite(palm.filter(ImageFilter.GaussianBlur(14)))
        return image

    if kind == "done":
        image = painterly_canvas(
            size,
            top=PALETTE["parchment_raised"],
            bottom=PALETTE["sage_100"],
            accents=[PALETTE["gold_soft"], PALETTE["sage_300"], PALETTE["amber_light"]],
            seed=102,
        )
        draw = ImageDraw.Draw(image)
        horizon = int(height * 0.66)
        draw.rounded_rectangle((0, horizon, width, height), radius=0, fill=rgba(PALETTE["sandstone"], 144))
        draw.ellipse((int(width * 0.39), int(height * 0.32), int(width * 0.61), int(height * 0.54)), fill=rgba(PALETTE["gold_soft"], 210))
        image = image.filter(ImageFilter.GaussianBlur(0.5))
        return add_paper_grain(image, amount=9, seed=202)

    if kind == "out-of-scope":
        image = painterly_canvas(
            size,
            top=PALETTE["parchment"],
            bottom=PALETTE["cobalt_50"],
            accents=[PALETTE["sage_100"], PALETTE["sandstone"], PALETTE["gold_soft"]],
            seed=103,
        )
        draw = ImageDraw.Draw(image)
        center = (width // 2, int(height * 0.78))
        draw.polygon(
            [
                (center[0] - 42, height),
                (center[0] + 42, height),
                (center[0] + 14, int(height * 0.68)),
                (center[0] - 14, int(height * 0.68)),
            ],
            fill=rgba(PALETTE["sandstone_deep"], 180),
        )
        draw.line((center[0], int(height * 0.7), int(width * 0.26), int(height * 0.38)), fill=rgba(PALETTE["ink_soft"], 120), width=16)
        draw.line((center[0], int(height * 0.7), int(width * 0.74), int(height * 0.4)), fill=rgba(PALETTE["ink_soft"], 120), width=16)
        return image.filter(ImageFilter.GaussianBlur(0.6))

    if kind == "one-time-offer":
        image = painterly_canvas(
            size,
            top=PALETTE["sandstone_warm"],
            bottom=PALETTE["parchment"],
            accents=[PALETTE["gold_soft"], PALETTE["amber_light"], PALETTE["cobalt_100"]],
            seed=104,
        )
        add_halo(image, (int(width * 0.26), int(height * 0.3)), int(width * 0.18), PALETTE["gold_soft"], 132)
        return image

    raise ValueError(f"unknown hero kind: {kind}")


def portrait_placeholder(seed: int, size: tuple[int, int], scheme: tuple[str, str, str]) -> Image.Image:
    image = painterly_canvas(size, top=scheme[0], bottom=scheme[1], accents=[scheme[1], scheme[2], PALETTE["parchment"]], seed=seed, grain=11)
    width, height = size
    silhouette = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(silhouette)
    d.ellipse((int(width * 0.32), int(height * 0.18), int(width * 0.68), int(height * 0.54)), fill=rgba(PALETTE["parchment_raised"], 78))
    d.rounded_rectangle((int(width * 0.24), int(height * 0.48), int(width * 0.76), int(height * 0.92)), radius=160, fill=rgba(PALETTE["parchment_raised"], 72))
    silhouette = silhouette.filter(ImageFilter.GaussianBlur(34))
    image.alpha_composite(silhouette)
    return image


def illustration_base(kind: str, size: tuple[int, int], seed: int) -> Image.Image:
    top = PALETTE["parchment"]
    bottom = PALETTE["sandstone_warm"] if kind in {"today-empty", "under-construction", "server"} else PALETTE["cobalt_50"]
    accents = [PALETTE["gold_soft"], PALETTE["amber_light"], PALETTE["cobalt_100"], PALETTE["sage_100"]]
    image = painterly_canvas(size, top=top, bottom=bottom, accents=accents, seed=seed, grain=10)
    return image


def empty_or_error(kind: str, size: tuple[int, int], seed: int) -> Image.Image:
    image = illustration_base(kind, size, seed)
    draw = ImageDraw.Draw(image)
    width, height = size
    stroke = rgba(PALETTE["ink_soft"], 170)
    soft_fill = rgba(PALETTE["parchment_raised"], 180)
    gold_fill = rgba(PALETTE["gold_soft"], 156)

    if kind in {"today-empty", "error-moderation"}:
        draw.rounded_rectangle((width * 0.22, height * 0.2, width * 0.78, height * 0.76), radius=18, fill=soft_fill, outline=stroke, width=4)
        draw.line((width * 0.3, height * 0.34, width * 0.7, height * 0.34), fill=rgba(PALETTE["gold"], 160), width=5)
        if kind == "error-moderation":
            draw.line((width * 0.32, height * 0.52, width * 0.68, height * 0.52), fill=stroke, width=5)
            draw.line((width * 0.38, height * 0.6, width * 0.62, height * 0.6), fill=stroke, width=5)

    elif kind == "people-empty":
        draw.rounded_rectangle((width * 0.36, height * 0.22, width * 0.64, height * 0.72), radius=24, fill=soft_fill, outline=stroke, width=4)
        draw.line((width * 0.42, height * 0.72, width * 0.58, height * 0.72), fill=rgba(PALETTE["gold"], 150), width=4)

    elif kind == "threads-empty":
        draw.rounded_rectangle((width * 0.22, height * 0.34, width * 0.78, height * 0.66), radius=20, fill=soft_fill, outline=stroke, width=4)
        draw.line((width * 0.22, height * 0.34, width * 0.5, height * 0.54), fill=stroke, width=4)
        draw.line((width * 0.78, height * 0.34, width * 0.5, height * 0.54), fill=stroke, width=4)

    elif kind == "search-empty":
        draw.ellipse((width * 0.28, height * 0.24, width * 0.62, height * 0.58), outline=stroke, width=5)
        draw.line((width * 0.56, height * 0.52, width * 0.74, height * 0.72), fill=stroke, width=5)
        draw.rounded_rectangle((width * 0.42, height * 0.36, width * 0.86, height * 0.8), radius=18, outline=rgba(PALETTE["gold"], 120), width=3)

    elif kind == "offline":
        draw.polygon(
            [(width * 0.48, height * 0.22), (width * 0.42, height * 0.48), (width * 0.58, height * 0.48)],
            fill=gold_fill,
            outline=stroke,
        )
        draw.rounded_rectangle((width * 0.38, height * 0.48, width * 0.62, height * 0.74), radius=18, fill=soft_fill, outline=stroke, width=4)

    elif kind == "under-construction":
        draw.rectangle((width * 0.22, height * 0.32, width * 0.78, height * 0.72), outline=stroke, width=4)
        draw.line((width * 0.26, height * 0.68, width * 0.42, height * 0.36), fill=stroke, width=4)
        draw.line((width * 0.58, height * 0.68, width * 0.74, height * 0.36), fill=stroke, width=4)
        draw.line((width * 0.32, height * 0.52, width * 0.68, height * 0.52), fill=rgba(PALETTE["gold"], 160), width=4)

    elif kind == "error-network":
        draw.arc((width * 0.22, height * 0.32, width * 0.78, height * 0.72), start=205, end=340, fill=stroke, width=5)
        draw.line((width * 0.4, height * 0.48, width * 0.6, height * 0.56), fill=rgba(PALETTE["amber"], 150), width=5)
        draw.line((width * 0.54, height * 0.42, width * 0.36, height * 0.62), fill=rgba(PALETTE["amber"], 150), width=5)

    elif kind == "error-server":
        draw.rounded_rectangle((width * 0.3, height * 0.22, width * 0.7, height * 0.82), radius=18, fill=soft_fill, outline=stroke, width=4)
        draw.rectangle((width * 0.46, height * 0.22, width * 0.54, height * 0.72), fill=rgba(PALETTE["ink_soft"], 180))
        add_halo(image, (width // 2, int(height * 0.72)), int(width * 0.1), PALETTE["gold_soft"], 88)

    elif kind == "error-unauthorized":
        draw.ellipse((width * 0.32, height * 0.18, width * 0.68, height * 0.54), outline=stroke, width=5)
        draw.rectangle((width * 0.47, height * 0.46, width * 0.53, height * 0.8), fill=stroke)
        draw.ellipse((width * 0.4, height * 0.72, width * 0.6, height * 0.92), fill=gold_fill, outline=stroke)

    elif kind == "error-face-detect":
        silhouette = Image.new("RGBA", size, (0, 0, 0, 0))
        d = ImageDraw.Draw(silhouette)
        d.ellipse((width * 0.32, height * 0.16, width * 0.68, height * 0.52), fill=rgba(PALETTE["parchment_raised"], 120))
        d.rounded_rectangle((width * 0.24, height * 0.48, width * 0.76, height * 0.88), radius=120, fill=rgba(PALETTE["parchment_raised"], 102))
        silhouette = silhouette.filter(ImageFilter.GaussianBlur(24))
        image.alpha_composite(silhouette)
        draw.arc((width * 0.2, height * 0.32, width * 0.8, height * 0.88), start=295, end=70, fill=stroke, width=5)
        draw.polygon([(width * 0.7, height * 0.36), (width * 0.78, height * 0.38), (width * 0.72, height * 0.46)], fill=stroke)

    return add_paper_grain(image, amount=8, seed=seed + 99)


def verse_bg(size: tuple[int, int], mode: str, seed: int) -> Image.Image:
    config = {
        "morning": (PALETTE["parchment_raised"], PALETTE["amber_light"], [PALETTE["gold_soft"], PALETTE["sandstone"]]),
        "midday": (PALETTE["parchment"], PALETTE["cobalt_50"], [PALETTE["cobalt_100"], PALETTE["gold_soft"]]),
        "evening": (PALETTE["sandstone_warm"], PALETTE["sage_100"], [PALETTE["amber_light"], PALETTE["cobalt_300"]]),
    }[mode]
    image = painterly_canvas(size, top=config[0], bottom=config[1], accents=config[2], seed=seed, grain=10)
    draw = ImageDraw.Draw(image)
    width, height = size
    draw.rounded_rectangle((int(width * 0.12), int(height * 0.16), int(width * 0.88), int(height * 0.84)), radius=56, outline=rgba(PALETTE["parchment_raised"], 90), width=4)
    return image


def texture_tile(size: tuple[int, int], seed: int) -> Image.Image:
    image = Image.new("RGBA", size, (255, 255, 255, 0))
    rng = random.Random(seed)
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for _ in range(360):
        x = rng.randint(0, size[0] - 1)
        y = rng.randint(0, size[1] - 1)
        alpha = rng.randint(8, 18)
        draw.point((x, y), fill=rgba(PALETTE["ink"], alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(0.35))
    image.alpha_composite(layer)
    return image


def render_line_icon(name: str, active: bool = False, size: int = 96) -> Image.Image:
    scale = 4
    canvas = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    stroke = rgba(PALETTE["ink"], 255)
    fill = rgba(PALETTE["ink"], 255)
    w = 6 * scale // 2
    s = size * scale

    if name == "tab-today":
        draw.line((s * 0.18, s * 0.68, s * 0.82, s * 0.68), fill=stroke, width=w)
        if active:
            draw.pieslice((s * 0.28, s * 0.28, s * 0.72, s * 0.72), 180, 360, fill=fill)
        else:
            draw.arc((s * 0.28, s * 0.28, s * 0.72, s * 0.72), 180, 360, fill=stroke, width=w)
        for x in (0.34, 0.5, 0.66):
            draw.line((s * x, s * 0.16, s * x, s * 0.28), fill=stroke, width=w)

    elif name == "tab-people":
        if active:
            draw.ellipse((s * 0.22, s * 0.24, s * 0.48, s * 0.5), fill=fill)
            draw.ellipse((s * 0.5, s * 0.2, s * 0.78, s * 0.48), fill=fill)
            draw.rounded_rectangle((s * 0.18, s * 0.52, s * 0.56, s * 0.82), radius=s * 0.12, fill=fill)
            draw.rounded_rectangle((s * 0.44, s * 0.48, s * 0.82, s * 0.78), radius=s * 0.12, fill=fill)
        else:
            draw.ellipse((s * 0.22, s * 0.24, s * 0.48, s * 0.5), outline=stroke, width=w)
            draw.ellipse((s * 0.5, s * 0.2, s * 0.78, s * 0.48), outline=stroke, width=w)
            draw.arc((s * 0.16, s * 0.46, s * 0.56, s * 0.82), 200, 340, fill=stroke, width=w)
            draw.arc((s * 0.42, s * 0.42, s * 0.84, s * 0.78), 200, 340, fill=stroke, width=w)

    elif name == "tab-threads":
        if active:
            draw.rounded_rectangle((s * 0.18, s * 0.28, s * 0.82, s * 0.74), radius=s * 0.08, fill=fill)
            draw.polygon([(s * 0.18, s * 0.28), (s * 0.5, s * 0.54), (s * 0.82, s * 0.28)], fill=rgba(PALETTE["parchment"], 255))
        else:
            draw.rounded_rectangle((s * 0.18, s * 0.28, s * 0.82, s * 0.74), radius=s * 0.08, outline=stroke, width=w)
            draw.line((s * 0.18, s * 0.28, s * 0.5, s * 0.54), fill=stroke, width=w)
            draw.line((s * 0.82, s * 0.28, s * 0.5, s * 0.54), fill=stroke, width=w)

    elif name == "tab-you":
        draw.ellipse((s * 0.18, s * 0.16, s * 0.82, s * 0.84), outline=stroke, width=w)
        if active:
            draw.ellipse((s * 0.36, s * 0.28, s * 0.62, s * 0.5), fill=fill)
            draw.rounded_rectangle((s * 0.3, s * 0.5, s * 0.66, s * 0.74), radius=s * 0.12, fill=fill)
        else:
            draw.ellipse((s * 0.36, s * 0.28, s * 0.62, s * 0.5), outline=stroke, width=w)
            draw.arc((s * 0.28, s * 0.42, s * 0.7, s * 0.78), 200, 340, fill=stroke, width=w)

    elif name.startswith("glyph-"):
        g = name.removeprefix("glyph-")
        if g in {"chevron-back", "chevron-forward", "chevron-down", "chevron-up"}:
            pts = {
                "chevron-back": [(0.62, 0.22), (0.38, 0.5), (0.62, 0.78)],
                "chevron-forward": [(0.38, 0.22), (0.62, 0.5), (0.38, 0.78)],
                "chevron-down": [(0.24, 0.38), (0.5, 0.62), (0.76, 0.38)],
                "chevron-up": [(0.24, 0.62), (0.5, 0.38), (0.76, 0.62)],
            }[g]
            draw.line(tuple((s * x, s * y) for x, y in pts), fill=stroke, width=w, joint="curve")
        elif g == "close":
            draw.line((s * 0.28, s * 0.28, s * 0.72, s * 0.72), fill=stroke, width=w)
            draw.line((s * 0.72, s * 0.28, s * 0.28, s * 0.72), fill=stroke, width=w)
        elif g == "plus":
            draw.line((s * 0.5, s * 0.22, s * 0.5, s * 0.78), fill=stroke, width=w)
            draw.line((s * 0.22, s * 0.5, s * 0.78, s * 0.5), fill=stroke, width=w)
        elif g == "minus":
            draw.line((s * 0.22, s * 0.5, s * 0.78, s * 0.5), fill=stroke, width=w)
        elif g == "check":
            draw.line((s * 0.22, s * 0.52, s * 0.42, s * 0.72, s * 0.78, s * 0.28), fill=stroke, width=w, joint="curve")
        elif g == "check-circle":
            draw.ellipse((s * 0.16, s * 0.16, s * 0.84, s * 0.84), outline=stroke, width=w)
            draw.line((s * 0.28, s * 0.52, s * 0.44, s * 0.68, s * 0.74, s * 0.34), fill=stroke, width=w, joint="curve")
        elif g == "search":
            draw.ellipse((s * 0.22, s * 0.22, s * 0.62, s * 0.62), outline=stroke, width=w)
            draw.line((s * 0.56, s * 0.56, s * 0.78, s * 0.78), fill=stroke, width=w)
        elif g == "bell":
            draw.arc((s * 0.24, s * 0.18, s * 0.76, s * 0.72), 200, 340, fill=stroke, width=w)
            draw.line((s * 0.28, s * 0.66, s * 0.72, s * 0.66), fill=stroke, width=w)
            draw.ellipse((s * 0.44, s * 0.72, s * 0.56, s * 0.84), fill=fill)
        elif g == "shield":
            draw.polygon([(s * 0.5, s * 0.18), (s * 0.76, s * 0.28), (s * 0.7, s * 0.68), (s * 0.5, s * 0.82), (s * 0.3, s * 0.68), (s * 0.24, s * 0.28)], outline=stroke, width=w)
        elif g == "gear":
            draw.ellipse((s * 0.32, s * 0.32, s * 0.68, s * 0.68), outline=stroke, width=w)
            for angle in range(0, 360, 45):
                rad = math.radians(angle)
                x1 = s * 0.5 + math.cos(rad) * s * 0.22
                y1 = s * 0.5 + math.sin(rad) * s * 0.22
                x2 = s * 0.5 + math.cos(rad) * s * 0.32
                y2 = s * 0.5 + math.sin(rad) * s * 0.32
                draw.line((x1, y1, x2, y2), fill=stroke, width=w)
        elif g == "report-flag":
            draw.line((s * 0.3, s * 0.18, s * 0.3, s * 0.82), fill=stroke, width=w)
            draw.polygon([(s * 0.34, s * 0.22), (s * 0.72, s * 0.32), (s * 0.34, s * 0.46)], outline=stroke, fill=rgba(PALETTE["parchment"], 0), width=w)
        elif g == "block":
            draw.ellipse((s * 0.18, s * 0.18, s * 0.82, s * 0.82), outline=stroke, width=w)
            draw.line((s * 0.28, s * 0.72, s * 0.72, s * 0.28), fill=stroke, width=w)
        elif g == "heart-outline":
            draw.line((s * 0.5, s * 0.78, s * 0.22, s * 0.46, s * 0.3, s * 0.24, s * 0.5, s * 0.34, s * 0.7, s * 0.24, s * 0.78, s * 0.46, s * 0.5, s * 0.78), fill=stroke, width=w, joint="curve")
        elif g == "camera":
            draw.rounded_rectangle((s * 0.2, s * 0.3, s * 0.8, s * 0.74), radius=s * 0.08, outline=stroke, width=w)
            draw.rectangle((s * 0.3, s * 0.22, s * 0.46, s * 0.32), fill=stroke)
            draw.ellipse((s * 0.38, s * 0.4, s * 0.62, s * 0.64), outline=stroke, width=w)
        elif g == "edit-pencil":
            draw.line((s * 0.24, s * 0.72, s * 0.62, s * 0.34), fill=stroke, width=w)
            draw.polygon([(s * 0.62, s * 0.34), (s * 0.72, s * 0.24), (s * 0.8, s * 0.32), (s * 0.7, s * 0.42)], fill=stroke)
            draw.line((s * 0.24, s * 0.72, s * 0.32, s * 0.8), fill=stroke, width=w)
        elif g == "sign-out":
            draw.rounded_rectangle((s * 0.2, s * 0.2, s * 0.56, s * 0.8), radius=s * 0.08, outline=stroke, width=w)
            draw.line((s * 0.46, s * 0.5, s * 0.8, s * 0.5), fill=stroke, width=w)
            draw.line((s * 0.66, s * 0.36, s * 0.8, s * 0.5, s * 0.66, s * 0.64), fill=stroke, width=w)
        elif g == "language-globe":
            draw.ellipse((s * 0.18, s * 0.18, s * 0.82, s * 0.82), outline=stroke, width=w)
            draw.arc((s * 0.34, s * 0.18, s * 0.66, s * 0.82), 90, 270, fill=stroke, width=w)
            draw.arc((s * 0.34, s * 0.18, s * 0.66, s * 0.82), -90, 90, fill=stroke, width=w)
            draw.line((s * 0.18, s * 0.5, s * 0.82, s * 0.5), fill=stroke, width=w)
        elif g == "info-circle":
            draw.ellipse((s * 0.18, s * 0.18, s * 0.82, s * 0.82), outline=stroke, width=w)
            draw.ellipse((s * 0.46, s * 0.28, s * 0.54, s * 0.36), fill=fill)
            draw.line((s * 0.5, s * 0.42, s * 0.5, s * 0.68), fill=stroke, width=w)
        elif g == "lock":
            draw.arc((s * 0.3, s * 0.18, s * 0.7, s * 0.54), 200, 340, fill=stroke, width=w)
            draw.rounded_rectangle((s * 0.24, s * 0.46, s * 0.76, s * 0.8), radius=s * 0.08, outline=stroke, width=w)
    else:
        raise ValueError(f"unknown icon {name}")

    return canvas.resize((size, size), Image.LANCZOS)


def nav_icon_svg(name: str, active: bool) -> str:
    fill = PALETTE["ink"]
    if name == "tab-today":
        sun = '<path d="M7 16a5 5 0 0 1 10 0Z" fill="currentColor"/>' if active else '<path d="M7 16a5 5 0 0 1 10 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'  # noqa: E501
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M4.5 16.5h15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>{sun}<path d="M8 4.5v2.5M12 3.5V6M16 4.5v2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>"""
    if name == "tab-people":
        if active:
            return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="8.5" cy="9" r="3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="3.2" fill="currentColor"/><rect x="4.5" y="13" width="8.5" height="5.5" rx="2.7" fill="currentColor"/><rect x="11" y="12.5" width="8.5" height="5.5" rx="2.7" fill="currentColor"/></svg>"""
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="8.5" cy="9" r="3" stroke="currentColor" stroke-width="1.6"/><circle cx="15.5" cy="8.5" r="3.2" stroke="currentColor" stroke-width="1.6"/><path d="M4 17.3c.6-2.3 2.4-3.8 4.7-3.8s4.1 1.5 4.7 3.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10.8 16.8c.6-2.3 2.5-3.9 4.9-3.9s4.3 1.6 4.9 3.9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>"""
    if name == "tab-threads":
        if active:
            return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="4.5" y="7" width="15" height="10" rx="2.5" fill="currentColor"/><path d="M4.5 7 12 13l7.5-6" stroke="#FAF7F0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>"""
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="7" width="15" height="10" rx="2.5" stroke="currentColor" stroke-width="1.6"/><path d="M4.5 7 12 13l7.5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>"""
    if name == "tab-you":
        if active:
            return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="7.3" ry="8.3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.4" r="2.6" fill="currentColor"/><rect x="8.6" y="12.4" width="6.8" height="4.8" rx="2.4" fill="currentColor"/></svg>"""
        return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><ellipse cx="12" cy="12" rx="7.3" ry="8.3" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.4" r="2.6" stroke="currentColor" stroke-width="1.6"/><path d="M8.2 16.4c.5-2.1 2.1-3.4 3.8-3.4s3.3 1.3 3.8 3.4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>"""
    raise ValueError(name)


def export_logo_assets() -> None:
    ensure_dir(ASSETS / "logo")
    wordmark = draw_wordmark("BlessCupid")
    wordmark_inverse = draw_wordmark("BlessCupid", inverse=True)
    bless_plus = draw_wordmark("Bless", plus=True)
    mark = draw_logo_mark(512)
    mark_inverse = draw_logo_mark(512, inverse=True)
    save_png("wordmark-primary", wordmark, ASSETS / "logo" / "wordmark-primary.png")
    save_png("wordmark-inverse", wordmark_inverse, ASSETS / "logo" / "wordmark-inverse.png")
    save_png("bless-plus-wordmark", bless_plus, ASSETS / "logo" / "bless-plus-wordmark.png")
    save_png("logo-mark", mark, ASSETS / "logo" / "logo-mark.png")
    save_png("logo-mark-inverse", mark_inverse, ASSETS / "logo" / "logo-mark-inverse.png")
    save_svg("wordmark-primary", wordmark_svg("BlessCupid", PALETTE["ink"]), ASSETS / "logo" / "wordmark-primary.svg", 1024, 320)
    save_svg("wordmark-inverse", wordmark_svg("BlessCupid", PALETTE["parchment"]), ASSETS / "logo" / "wordmark-inverse.svg", 1024, 320)
    save_svg("bless-plus-wordmark", wordmark_svg("Bless+", PALETTE["ink"]), ASSETS / "logo" / "bless-plus-wordmark.svg", 1024, 320)
    save_svg("logo-mark", logo_mark_svg(PALETTE["ink"]), ASSETS / "logo" / "logo-mark.svg", 512, 512)
    save_svg("logo-mark-inverse", logo_mark_svg(PALETTE["parchment"]), ASSETS / "logo" / "logo-mark-inverse.svg", 512, 512)


def export_platform_assets() -> None:
    ensure_dir(ASSETS / "app-icon")
    app_icon = draw_app_icon()
    save_png("app-icon-ios-master", app_icon, ASSETS / "app-icon" / "app-icon-ios-1024.png")
    save_png("ios-app-icon", app_icon, IOS / "AppIcon.appiconset" / "App-Icon-1024x1024@1x.png")

    splash = make_splash()
    save_png("splash-master", splash, ASSETS / "splash" / "splash.png")
    save_png("ios-splash", splash, IOS / "SplashScreenBackground.imageset" / "image.png")

    foreground = draw_logo_mark(432)
    save_png("android-adaptive-foreground", foreground, ASSETS / "app-icon" / "android-adaptive-foreground.png")
    bg = Image.new("RGBA", (432, 432), rgba(PALETTE["sandstone_warm"]))
    save_png("android-adaptive-background", bg, ASSETS / "app-icon" / "android-adaptive-background.png")

    notif = render_line_icon("glyph-bell", size=96)
    alpha_mask = notif.getchannel("A")
    white_icon = Image.new("RGBA", notif.size, (255, 255, 255, 0))
    white_icon.putalpha(alpha_mask)
    save_png("notification-icon-android", white_icon, ASSETS / "app-icon" / "notification-icon-android.png")

    android_sizes = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, size in android_sizes.items():
        resized = app_icon.resize((size, size), Image.LANCZOS)
        save_png(f"{folder}-launcher", resized, ANDROID / folder / "ic_launcher.png")
        save_png(f"{folder}-launcher-round", resized, ANDROID / folder / "ic_launcher_round.png")


def export_nav_assets() -> None:
    for tab in ("today", "people", "threads", "you"):
        for state in ("active", "inactive"):
            active = state == "active"
            key = f"tab-{tab}-{state}"
            base_name = f"tab-{tab}"
            image = render_line_icon(base_name, active=active, size=96)
            save_png(key, image, ASSETS / "nav" / f"{key}.png")
            save_svg(key, nav_icon_svg(base_name, active), ASSETS / "nav" / f"{key}.svg", 24, 24)


def export_glyph_assets() -> None:
    glyphs = [
        "chevron-back",
        "chevron-forward",
        "chevron-down",
        "chevron-up",
        "close",
        "plus",
        "minus",
        "check",
        "check-circle",
        "search",
        "bell",
        "shield",
        "gear",
        "report-flag",
        "block",
        "heart-outline",
        "camera",
        "edit-pencil",
        "sign-out",
        "language-globe",
        "info-circle",
        "lock",
    ]
    for glyph in glyphs:
        image = render_line_icon(f"glyph-{glyph}", size=96)
        save_png(f"glyph-{glyph}", image, ASSETS / "glyphs" / f"{glyph}.png")


def export_portraits() -> None:
    schemes = [
        (PALETTE["sandstone_warm"], PALETTE["gold_soft"], PALETTE["cobalt_100"]),
        (PALETTE["cobalt_50"], PALETTE["parchment"], PALETTE["gold_soft"]),
        (PALETTE["sage_100"], PALETTE["sandstone"], PALETTE["cobalt_300"]),
        (PALETTE["amber_light"], PALETTE["parchment_raised"], PALETTE["cobalt_100"]),
        (PALETTE["cobalt_50"], PALETTE["sandstone_deep"], PALETTE["gold_soft"]),
        (PALETTE["sandstone"], PALETTE["parchment"], PALETTE["sage_100"]),
    ]
    for idx, scheme in enumerate(schemes, start=1):
        image = portrait_placeholder(300 + idx, (750, 1000), scheme)
        save_png(f"portrait-placeholder-{idx}", image, ASSETS / "portraits" / f"portrait-placeholder-{idx}.png")


def export_hero_assets() -> None:
    hero_map = {
        "welcome-hero": ("welcome", (1500, 1800)),
        "done-hero": ("done", (1500, 1800)),
        "dating-out-of-scope-hero": ("out-of-scope", (1200, 1200)),
        "one-time-offer-band": ("one-time-offer", (1500, 600)),
    }
    for key, (kind, size) in hero_map.items():
        save_png(key, hero_scene(kind, size), ASSETS / "heroes" / f"{key}.png")


def export_empty_assets() -> None:
    kinds = [
        "today-empty",
        "people-empty",
        "threads-empty",
        "search-empty",
        "offline",
        "under-construction",
    ]
    for idx, kind in enumerate(kinds, start=1):
        image = empty_or_error(kind, (480, 480), 400 + idx)
        save_png(kind, image, ASSETS / "empty" / f"{kind}.png")


def export_error_assets() -> None:
    kinds = [
        "error-network",
        "error-server",
        "error-unauthorized",
        "error-face-detect",
        "error-moderation",
    ]
    for idx, kind in enumerate(kinds, start=1):
        image = empty_or_error(kind, (360, 360), 500 + idx)
        save_png(kind, image, ASSETS / "error" / f"{kind}.png")


def export_verse_assets() -> None:
    for idx, mode in enumerate(("morning", "midday", "evening"), start=1):
        image = verse_bg((1080, 1350), mode, 600 + idx)
        save_png(f"verse-card-bg-{mode}", image, ASSETS / "verse" / f"verse-card-bg-{mode}.png")


def export_texture_assets() -> None:
    grain = texture_tile((1500, 1500), 702)
    save_png("parchment-grain", grain, ASSETS / "textures" / "parchment-grain.png")
    save_svg(
        "gold-rule",
        f"""<svg xmlns="http://www.w3.org/2000/svg" width="200" height="4" viewBox="0 0 200 4"><line x1="0" y1="2" x2="200" y2="2" stroke="{PALETTE['gold']}" stroke-width="2" stroke-linecap="round"/></svg>""",
        ASSETS / "textures" / "gold-rule.svg",
        200,
        4,
    )


def export_simple_badge_assets(folder: str, names: Iterable[str]) -> None:
    for idx, name in enumerate(names, start=1):
        image = render_line_icon("glyph-info-circle", size=64)
        if folder == "tradition":
            glyph = {
                "catholic": "glyph-check-circle",
                "protestant-evangelical": "glyph-camera",
                "protestant-pentecostal": "glyph-plus",
                "protestant-reformed": "glyph-heart-outline",
                "protestant-mainline": "glyph-minus",
                "orthodox": "glyph-plus",
                "other-christian": "glyph-check",
                "still-figuring": "glyph-info-circle",
            }[name]
        else:
            glyph = {
                "sunday-in-person": "glyph-check-circle",
                "sunday-online": "glyph-camera",
                "catholic-mass": "glyph-heart-outline",
                "daily-prayer": "glyph-check",
                "small-group": "glyph-plus",
                "worship-at-home": "glyph-gear",
                "still-finding-a-community": "glyph-chevron-forward",
            }[name]
        image = render_line_icon(glyph, size=64)
        save_png(f"{folder}-{name}", image, ASSETS / folder / f"{name}.png")


def write_readme() -> None:
    lines = [
        "# BlessCupid Brand Assets",
        "",
        "Generated by `scripts/generate_brand_assets.py`.",
        "",
        "This pack is runtime-focused for the current Expo / React Native app:",
        "- PNG exports for immediate `<Image>` usage",
        "- SVG source files where the app or design spec benefits from vector masters",
        "",
        "Top-level categories:",
        "- `logo/` wordmarks, Bless+ marks, monogram",
        "- `app-icon/` iOS master, Android adaptive layers, notification icon",
        "- `splash/` launch artwork",
        "- `nav/` BottomNav active/inactive icons",
        "- `glyphs/` monochrome UI glyph PNGs",
        "- `heroes/` painterly onboarding / monetization art",
        "- `empty/`, `error/`, `portraits/`, `verse/`, `textures/`",
        "",
        "Manifest: `manifest.json`",
    ]
    (ASSETS / "README.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_manifest() -> None:
    payload = {
        "generatedBy": "scripts/generate_brand_assets.py",
        "assets": [record.__dict__ for record in MANIFEST],
    }
    (ASSETS / "manifest.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    export_logo_assets()
    export_platform_assets()
    export_nav_assets()
    export_glyph_assets()
    export_portraits()
    export_hero_assets()
    export_empty_assets()
    export_error_assets()
    export_verse_assets()
    export_texture_assets()
    export_simple_badge_assets(
        "tradition",
        [
            "catholic",
            "protestant-evangelical",
            "protestant-pentecostal",
            "protestant-reformed",
            "protestant-mainline",
            "orthodox",
            "other-christian",
            "still-figuring",
        ],
    )
    export_simple_badge_assets(
        "practice",
        [
            "sunday-in-person",
            "sunday-online",
            "catholic-mass",
            "daily-prayer",
            "small-group",
            "worship-at-home",
            "still-finding-a-community",
        ],
    )
    write_readme()
    write_manifest()
    print(f"Generated {len(MANIFEST)} asset exports in {ASSETS}")


if __name__ == "__main__":
    main()
