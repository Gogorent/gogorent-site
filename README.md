# GoGoRent — new design (preview)

Lives in `/new/` next to the current site, so gogorent.ge keeps working while the new design is reviewed at **gogorent.ge/new/**.
One static page: plain HTML, CSS and JavaScript. No build step, no dependencies.

## Languages: EN / RU / KA

- The switch is in the top bar, the sticky bar and the footer.
- First visit: the language comes from the browser (Russian → RU, Georgian → KA, anything else → EN). The choice is remembered.
- Direct links: `gogorent.ge/new/?lang=ru`, `?lang=ka`, `?lang=en` (or `#ru`, `#ka`).
- English text lives in the HTML. Russian and Georgian live in the `DICT`, `WORDS`, `ROUTE_T`, `EXTRA_T` and `CAR_T` objects in the `<script>` at the end of `index.html`. Each text element has a `data-t="key"`; the same key in `DICT.ru` / `DICT.ka` holds its translation.

## Structure

```
index.html          the whole page (markup, styles, scripts, translations)
assets/img/         car photos, route photos, thumbnails, video poster
assets/video/       hero background video (MP4, H.264)
```

## What to edit

- Car names, prices and specs: `CARS` and `FLEET` in the script (and `CAR_T` for RU/KA).
- Phone and WhatsApp: search for `995500054521`.
- Photos: replace files in `assets/img/` keeping the same names.

## Credits

- Route photos via Wikimedia Commons: "Gergeti Trinity Church, Kazbegi" by Stefan Wisselink (CC BY 2.0); "Tbilisi, Old town, Georgia" by Vyacheslav Argenberg (CC BY 4.0); "Alazani valley seen from Sighnaghi" by Alexey Komarov (CC BY-SA 4.0); "Georgian Military Road Krestovy pass" by Alexxx1979 (CC BY-SA 4.0).
- Background video: drone footage of Georgia from Pexels (Pexels licence, free for commercial use).
- Fonts: Onest and Noto Sans Georgian (Google Fonts, SIL Open Font License).
