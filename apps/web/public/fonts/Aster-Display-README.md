# Aster Display

Title-only subset of [Smiley Sans v2.0.1](https://github.com/atelier-anchor/smiley-sans/releases/tag/v2.0.1), designed by atelierAnchor and distributed under SIL OFL 1.1. See `SmileySans-OFL.txt` for the original copyright and full license.

Renamed to Aster Display because the original font reserves the names Smiley and 得意黑. Contains printable ASCII and the fixed headings in `aster-display-glyphs.txt`. Body text and user-authored article titles must keep their normal reading font.

To add title characters, update the glyph list and regenerate from the release's `SmileySans-Oblique.ttf.woff2`:

```sh
python3 -m pip install 'fonttools[woff]'
python3 scripts/subset-display-font.py /path/to/SmileySans-Oblique.ttf.woff2
```

The result is self-hosted; no external font service is needed at runtime or during the site build.
