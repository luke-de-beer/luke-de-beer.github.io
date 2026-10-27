# luke-de-beer.github.io

Portfolio site for Luké de Beer. Plain HTML, CSS and a little JavaScript. No build step.

## Files

- `index.html`: the home page (hero, selected work, experience, skills, education, contact).
- `projects/*.html`: one case study per project, all built from the same template.
- `css/site.css`: every style, tokens at the top. `css/fonts.css` and `assets/fonts/`: the self-hosted faces (Newsreader, Schibsted Grotesk, IBM Plex Mono; Google Fonts, OFL).
- `js/site.js`: theme toggle, section counter (case pages), reveals, clock (no dependencies). `js/hero.js`: the three.js starfield hero. `js/motion.js`: Lenis smooth scroll and Motion springs. `js/cloud.js`: the skills sphere, the default above 560px; a "Still view" pill drops to rows and hides the filters. three.js, Lenis and Motion load from jsDelivr through the import map in each page head; without them the pages still read fully.
- `assets/img/`: web-sized WebP screenshots used by the pages.
- `Luke-de-Beer-CV-2026.pdf`: the CV linked from the header and contact section.

## Deploy

Hosted on GitHub Pages at https://luke-de-beer.github.io from the `main` branch. Push to `main` and the site updates within a minute or two.

To preview locally:

```bash
python3 -m http.server 8000
```

and open http://localhost:8000.
