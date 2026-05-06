#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent

INK = "#1A1A24"
INK_SOFT = "#3F3F4A"
PARCHMENT = "#FAF7F0"
RAISED = "#FFFDF7"
SAND = "#F4ECDF"
WARM = "#FBF3E2"
GOLD = "#C8A24B"
GOLD_SOFT = "#E5C97D"
AMBER = "#D08A2C"
AMBER_DARK = "#8C5912"
SAGE = "#E5EFE6"


def rgba(hex_color: str, a: int = 255) -> tuple[int, int, int, int]:
    h = hex_color.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a


def font_path(name: str) -> Path:
    matches = list((ROOT / "apps/mobile/node_modules").rglob(name))
    if matches:
        return matches[0]
    matches = list((ROOT / "node_modules").rglob(name))
    if matches:
        return matches[0]
    raise FileNotFoundError(name)


SERIF = font_path("CormorantGaramond_600SemiBold.ttf")
SERIF_MED = font_path("CormorantGaramond_500Medium.ttf")
SANS = font_path("Inter_600SemiBold.ttf")


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size)


def soft_bg() -> Image.Image:
    img = Image.new("RGBA", (1024, 1024), rgba(RAISED))
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.ellipse((210, 70, 820, 680), fill=rgba(GOLD_SOFT, 78))
    d.ellipse((560, 520, 1220, 1180), fill=rgba(SAGE, 120))
    d.ellipse((-220, 500, 460, 1220), fill=rgba(WARM, 160))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(54)))
    return img


def rounded_mask(radius: int = 220) -> Image.Image:
    mask = Image.new("L", (1024, 1024), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 1024, 1024), radius=radius, fill=255)
    return mask


def finish(img: Image.Image, name: str) -> Image.Image:
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(img)
    out.putalpha(rounded_mask())
    out.save(OUT / f"{name}.png")
    return out


def concept_dawn_path() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((210, 185, 814, 820), radius=230, outline=rgba(INK, 230), width=16)
    d.rectangle((210, 510, 814, 842), fill=rgba(RAISED, 0))
    d.arc((276, 148, 748, 620), 180, 360, fill=rgba(INK, 230), width=18)
    d.line((310, 650, 714, 650), fill=rgba(GOLD, 230), width=12)
    d.line((512, 660, 418, 850), fill=rgba(INK_SOFT, 170), width=14)
    d.line((512, 660, 606, 850), fill=rgba(INK_SOFT, 170), width=14)
    d.ellipse((442, 272, 582, 412), fill=rgba(GOLD_SOFT, 230))
    return finish(img, "01-dawn-path")


def concept_open_window() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((196, 168, 828, 832), radius=250, outline=rgba(INK, 225), width=14)
    d.arc((298, 230, 726, 660), 180, 360, fill=rgba(INK, 220), width=14)
    d.line((336, 636, 688, 636), fill=rgba(GOLD, 230), width=10)
    d.line((512, 302, 512, 752), fill=rgba(INK, 165), width=10)
    d.line((320, 536, 512, 752), fill=rgba(INK_SOFT, 160), width=10)
    d.line((704, 536, 512, 752), fill=rgba(INK_SOFT, 160), width=10)
    d.ellipse((448, 238, 576, 366), fill=rgba(GOLD_SOFT, 210))
    return finish(img, "02-open-window")


def concept_soft_bc() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((170, 170, 854, 854), radius=235, outline=rgba(INK, 220), width=14)
    f = font(SERIF, 410)
    d.text((246, 258), "b", font=f, fill=rgba(INK, 245))
    d.text((455, 270), "c", font=f, fill=rgba(INK, 232))
    d.ellipse((474, 226, 552, 304), fill=rgba(GOLD_SOFT, 220))
    d.line((310, 736, 714, 736), fill=rgba(GOLD, 220), width=10)
    return finish(img, "03-soft-bc")


def concept_gold_leaf() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((212, 172, 812, 840), radius=260, outline=rgba(INK, 224), width=14)
    d.arc((300, 250, 724, 674), 180, 360, fill=rgba(INK, 220), width=14)
    d.line((330, 720, 694, 720), fill=rgba(INK_SOFT, 170), width=10)
    d.line((512, 300, 512, 706), fill=rgba(INK_SOFT, 140), width=8)
    d.ellipse((408, 274, 524, 484), fill=rgba(GOLD_SOFT, 235))
    d.ellipse((500, 274, 616, 484), fill=rgba(AMBER, 190))
    d.line((512, 298, 512, 492), fill=rgba(RAISED, 180), width=7)
    return finish(img, "04-gold-leaf")


def concept_morning_cups() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((170, 170, 854, 854), radius=260, outline=rgba(INK, 215), width=12)
    d.ellipse((270, 342, 518, 590), outline=rgba(INK, 230), width=16)
    d.ellipse((506, 342, 754, 590), outline=rgba(AMBER_DARK, 215), width=16)
    d.arc((318, 280, 470, 430), 205, 335, fill=rgba(GOLD, 210), width=10)
    d.arc((554, 280, 706, 430), 205, 335, fill=rgba(GOLD, 210), width=10)
    d.line((316, 682, 708, 682), fill=rgba(GOLD, 220), width=10)
    return finish(img, "05-morning-cups")


def concept_sun_path() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.ellipse((380, 180, 644, 444), fill=rgba(GOLD_SOFT, 238))
    d.arc((224, 300, 800, 876), 205, 335, fill=rgba(INK, 225), width=16)
    d.line((512, 478, 420, 650, 500, 800), fill=rgba(INK_SOFT, 175), width=14)
    d.line((512, 478, 604, 650, 524, 800), fill=rgba(INK_SOFT, 175), width=14)
    d.line((334, 760, 690, 760), fill=rgba(GOLD, 220), width=10)
    return finish(img, "06-sun-path")


def concept_bless_spark() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((180, 180, 844, 844), radius=260, outline=rgba(INK, 225), width=14)
    d.ellipse((362, 362, 662, 662), fill=rgba(WARM, 230), outline=rgba(GOLD, 220), width=10)
    d.polygon([(512, 292), (554, 468), (732, 512), (554, 556), (512, 732), (470, 556), (292, 512), (470, 468)], fill=rgba(INK, 235))
    d.polygon([(512, 386), (532, 492), (638, 512), (532, 532), (512, 638), (492, 532), (386, 512), (492, 492)], fill=rgba(GOLD_SOFT, 245))
    return finish(img, "07-bless-spark")


def concept_window_smile() -> Image.Image:
    img = soft_bg()
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((194, 160, 830, 852), radius=270, outline=rgba(INK, 220), width=14)
    d.arc((302, 210, 722, 650), 180, 360, fill=rgba(INK, 210), width=14)
    d.ellipse((432, 250, 592, 410), fill=rgba(GOLD_SOFT, 225))
    d.arc((324, 510, 700, 782), 22, 158, fill=rgba(AMBER_DARK, 220), width=18)
    d.line((344, 720, 680, 720), fill=rgba(GOLD, 205), width=10)
    return finish(img, "08-window-smile")


def make_sheet(images: list[tuple[str, Image.Image]]) -> None:
    tile = 360
    label_h = 72
    pad = 28
    sheet = Image.new("RGB", (pad + 2 * (tile + pad), pad + 2 * (tile + label_h + pad)), (250, 247, 240))
    d = ImageDraw.Draw(sheet)
    label_font = font(SANS, 20)
    desc_font = font(SANS, 14)
    desc = {
        "01-dawn-path": "best balance: warm, mature, app-icon readable",
        "02-open-window": "most brand-ownable, chapel-light without religion kitsch",
        "03-soft-bc": "closest to old mark, softer and friendlier",
        "04-gold-leaf": "most alive, garden feel, slightly less dating-specific",
        "05-morning-cups": "warmest, social, less solemn",
        "06-sun-path": "cleanest app icon, mature but hopeful",
        "07-bless-spark": "most playful, strong small-size read",
        "08-window-smile": "friendly chapel-light, not boring",
    }
    for i, (name, img) in enumerate(images):
        x = pad + (i % 2) * (tile + pad)
        y = pad + (i // 2) * (tile + label_h + pad)
        thumb = img.resize((tile, tile), Image.LANCZOS)
        sheet.paste(thumb.convert("RGB"), (x, y))
        d.text((x, y + tile + 10), name, font=label_font, fill=rgba(INK)[:3])
        d.text((x, y + tile + 38), desc[name], font=desc_font, fill=rgba(INK_SOFT)[:3])
    sheet.save(OUT / "icon-concepts-sheet.png")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    images = [
        ("01-dawn-path", concept_dawn_path()),
        ("02-open-window", concept_open_window()),
        ("03-soft-bc", concept_soft_bc()),
        ("04-gold-leaf", concept_gold_leaf()),
        ("05-morning-cups", concept_morning_cups()),
        ("06-sun-path", concept_sun_path()),
        ("07-bless-spark", concept_bless_spark()),
        ("08-window-smile", concept_window_smile()),
    ]
    make_sheet(images)


if __name__ == "__main__":
    main()
