# Krishna Singh — portfolio

Next.js 16 (App Router, TypeScript) + Lenis smooth scroll, exported as a static site.

```bash
npm run dev      # http://localhost:4870
npm run build    # writes the deployable site to out/
```

## Layout

- `components/Providers.tsx`: page transitions (brackets close over the next page's colours), Lenis, sound, and `setLook()`, which colours the whole page.
- `components/Chrome.tsx`: the wordmark, nav, clock, grid toggle and sound button, which stay on screen across every page.
- `components/Home.tsx`: the preloader, plus an endless image column (vertical or horizontal) with the bracket frame, the synced name list, tags and services.
- `components/CaseStudy.tsx` and `components/About.tsx`: the inner pages.
- `lib/projects.ts`: all projects. Each one's `bg`/`fg` is the colour the page turns when it is in focus or opened.
- `_archive/`: the earlier wheel, zombie and text-reflow code, kept out of the build.

## Adding your images

Missing images show a placeholder printing the exact path they want. Drop the file there and it appears.

| Project | Files (16:10) |
|---|---|
| VÄRA | `public/images/vara/cover.jpg`, `01.jpg` – `04.jpg` |
| ANANTA | `public/images/ananta/cover.jpg`, `01.jpg` – `04.jpg` |
| Musée Centennial | `public/images/musee/cover.jpg`, `01.jpg` – `04.jpg` |
| Shelfmark | `public/images/shelfmark/cover.jpg`, `01.jpg` – `04.jpg` |

## Deploy free on Cloudflare Pages (`krishnasingh.pages.dev`)

1. Push this folder to a GitHub repo.
2. In Cloudflare, go to Workers & Pages → Create → Pages → connect the repo.
3. Set the build command to `npm run build` and the output directory to `out`. Name the project `krishnasingh`.

You can also skip GitHub: run `npm run build`, then use Pages → Upload assets and drop in the `out/` folder.

`tools/media.sh` rebuilds `public/media/` (photos, clips, renders) from the original files.
