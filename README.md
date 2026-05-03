# Starter — Astro + Keystatic

A production-ready starter template combining **Astro 5**, **Keystatic CMS**, **React**, and **Markdoc** for building content-driven websites with a local Git-based CMS.

---

## ✨ Features

- **[Astro 5](https://astro.build)** — Fast, island-architecture static site generator
- **[Keystatic CMS](https://keystatic.com)** — Local-first, Git-backed CMS with a visual editor at `/keystatic`
- **[Markdoc](https://markdoc.dev)** — Structured, extensible content authoring via `.mdoc` files
- **[React 19](https://react.dev)** — For interactive UI islands
- **[GSAP](https://gsap.com) + [Lenis](https://lenis.darkroom.engineering)** — Smooth scrolling and scroll-triggered animations
- **SEO-ready** — `Seo.astro` and `Schema.astro` components with Open Graph, canonical, and structured data support
- **Blog collection** — Posts with title, excerpt, date, author, featured image, tags, and draft mode
- **Keystatic Singletons** — Manage homepage content and business info directly from the CMS UI

---

## 🗂️ Project Structure

```text
/
├── public/
│   ├── favicon.svg
│   ├── favicon.ico
│   └── images/
│       └── posts/          # Featured images for blog posts
├── src/
│   ├── components/
│   │   ├── layout/         # Layout-level components
│   │   ├── react/          # React island components
│   │   ├── sections/       # Page section components
│   │   ├── seo/
│   │   │   ├── Seo.astro
│   │   │   └── Schema.astro
│   │   └── ui/
│   │       └── ScrollToTop.astro
│   ├── content/
│   │   └── posts/          # Blog posts (.mdoc files, managed via Keystatic)
│   ├── layouts/
│   │   └── Base.astro      # Base layout with header, footer, Lenis + GSAP setup
│   ├── lib/
│   │   ├── schemas/        # Shared Zod schemas
│   │   └── utils/          # Utility helpers (date, address, smooth-scroll, etc.)
│   ├── pages/
│   │   ├── index.astro     # Homepage
│   │   └── blog/
│   │       ├── index.astro # Blog listing
│   │       └── [slug].astro # Individual post page
│   ├── styles/
│   │   └── global.css      # Global CSS custom properties and base styles
│   └── content.config.ts   # Astro content collection schema
├── keystatic.config.ts     # Keystatic CMS configuration
├── astro.config.mjs        # Astro configuration
└── package.json
```

---

## 🧞 Commands

All commands are run from the root of the project using **pnpm**:

| Command            | Action                                            |
| :----------------- | :------------------------------------------------ |
| `pnpm install`     | Install dependencies                              |
| `pnpm dev`         | Start local dev server at `localhost:4321`        |
| `pnpm build`       | Build your production site to `./dist/`           |
| `pnpm preview`     | Preview the production build locally              |
| `pnpm astro ...`   | Run Astro CLI commands (`astro add`, `astro check`) |

---

## 🖊️ Content Management

This project uses **Keystatic** as a local, Git-backed CMS. When running the dev server, navigate to:

```
http://localhost:4321/keystatic
```

### Collections

| Collection | Path | Format |
| :--------- | :--- | :----- |
| `posts`    | `src/content/posts/*` | `.mdoc` (Markdoc) |

**Post fields:** `title`, `excerpt`, `date`, `author`, `featuredImage`, `tags`, `draft`, `content`

### Singletons

| Singleton       | Description |
| :-------------- | :---------- |
| `businessInfo`  | Business name, address, phone, email, and hours |
| `homepage`      | Hero section, features, about preview, and CTA content |

---

## 🧩 Key Dependencies

| Package | Version | Purpose |
| :------ | :------ | :------ |
| `astro` | 5 | Core framework |
| `@keystatic/astro` | ^5.0.6 | Keystatic Astro integration |
| `@keystatic/core` | ^0.5.50 | Keystatic CMS core |
| `@astrojs/react` | ^3.6.3 | React island support |
| `@astrojs/markdoc` | ^0.11.5 | Markdoc content format |
| `gsap` | ^3.15.0 | Animations & ScrollTrigger |
| `lenis` | ^1.3.23 | Smooth scroll |
| `react` / `react-dom` | ^19.2.5 | React runtime |

---

## ⚙️ Requirements

- **Node.js** `>=22.12.0`
- **pnpm** (recommended)

---

## 📚 Resources

- [Astro Docs](https://docs.astro.build)
- [Keystatic Docs](https://keystatic.com/docs)
- [Markdoc Docs](https://markdoc.dev/docs)
- [GSAP Docs](https://gsap.com/docs)
- [Lenis Docs](https://lenis.darkroom.engineering)
