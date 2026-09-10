"""Build the local title font: python subset-display-font.py ORIGINAL_WOFF2.

Requires fonttools[woff]. The source is Smiley Sans v2.0.1 (SIL OFL 1.1).
The subset is renamed to respect the upstream Reserved Font Names.
"""
from pathlib import Path
import sys

from fontTools import subset
from fontTools.ttLib import TTFont

fonts = Path(__file__).resolve().parents[1] / "apps/web/public/fonts"
text = (fonts / "aster-display-glyphs.txt").read_text(encoding="utf-8")
font = TTFont(sys.argv[1], recalcTimestamp=False)
options = subset.Options()
options.flavor = "woff2"
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text, unicodes=range(0x20, 0x7F))
subsetter.subset(font)
names = {
    1: "Aster Display", 2: "Oblique", 3: "AsterDisplay-Oblique-2.0.1-subset",
    4: "Aster Display Oblique", 6: "AsterDisplay-Oblique",
    16: "Aster Display", 17: "Oblique",
}
for record in font["name"].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = "woff2"
font.save(fonts / "aster-display.woff2")
