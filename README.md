# Damon Lin — Portfolio

## Features

- **Canvas particle background** — DPR-aware interactive particle field with glow effects and mouse repulsion, gracefully degrades for reduced-motion users
- **Dark/Light mode** — Theme toggle persisted to `localStorage`, driven entirely by CSS variables
- **Project showcase** — Filterable project grid with tag-based search, GitHub and live-site links
- **Experience timeline** — Learning journey and hackathon history with tagged skills
- **Hero photo cards** — Parallax-floating skill cards flanking the hero section with scroll-driven motion
- **Typewriter animation** — Sequential subtitle text reveal on the hero
- **Scroll-triggered reveals** — Elements fade and slide in as they enter the viewport
- **Contact form** — Saves messages to JSON; optional email notification via SMTP (Gmail)
- **Admin panel** — Password-protected dashboard to manage projects, experience entries, site config, and contact messages — all via JSON files
- **Responsive design** — Fluid typography scale (`clamp`), content-aware breakpoints, mobile nav
- **SEO** — Auto-generated `sitemap.xml` and `robots.txt`
- **Custom error pages** — Styled 404 and 500 pages

## Project Structure

```
portfolio/
├── app.py                      # Main Flask application
├── wsgi.py                     # WSGI entry point for production
├── Procfile                    # Heroku/Render process definition
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variable template
├── .gitignore
├── templates/
│   ├── partials/
│   │   ├── base.html           # Root layout (head, scripts, nav, footer)
│   │   ├── navigation.html     # Top nav bar with theme toggle
│   │   ├── footer.html         # Site footer
│   │   ├── project-card.html   # Project grid card
│   │   └── project-marquee-card.html  # Marquee project card
│   ├── admin/
│   │   ├── login.html          # Admin password login
│   │   └── dashboard.html      # Content management dashboard
│   ├── errors/
│   │   ├── 404.html
│   │   └── 500.html
│   ├── index.html              # Home page
│   ├── projects.html           # Project showcase
│   ├── experience.html         # Experience & hackathons
│   ├── about.html              # Bio, skills, values, resume
│   └── contact.html            # Contact form
├── static/
│   ├── css/
│   │   └── style.css           # All styles (~2500 lines, warm terracotta theme)
│   ├── js/
│   │   └── main.js             # Particle canvas, theme toggle, scroll reveals, animations
│   ├── data/
│   │   ├── siteConfig.json     # Hero text, contact links, email config, admin password
│   │   ├── featuredProjects.json  # Project portfolio data
│   │   ├── experience.json     # Learning journey + hackathon entries
│   │   ├── about.json          # Bio, skills, values
│   │   ├── heroPhotos.json     # Floating skill card layout data
│   │   └── contactMessages.json   # Submitted contact messages
│   ├── images/                 # Static images and project screenshots
│   └── files/                  # Downloadable assets (resume, etc.)
└── .opencode/                  # AI assistant configuration
```

## Design

The site uses a warm, organic design language:

- **Accent color**: Terracotta `#C8744D` with hover `#B05E39`
- **Typography**: Fraunces (display headings) + Outfit (body) + JetBrains Mono (code)
- **Background**: Interactive canvas particle system with glow nodes and mouse interaction
- **Theme**: Light/dark mode toggle persisted to `localStorage`, controlled via CSS custom properties
- **Motion**: Scroll-triggered reveals (`IntersectionObserver`), typewriter subtitle animation, parallax hero cards, project card marquee
- **Design tokens**: Full CSS variable system for spacing, radii, shadows, easing curves, and fluid typography
