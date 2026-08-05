# Damon Lin — Portfolio

A warm, personal portfolio site built with Flask, featuring an interactive canvas particle system, dark/light mode, and a file-based JSON admin panel.

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

## Tech Stack

- **Backend**: Python 3.10+, Flask 3.x
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Fonts**: Fraunces (display), Outfit (body), JetBrains Mono (code)
- **Data**: JSON file storage — no database required
- **Email**: Python `smtplib` with Gmail SMTP
- **Deployment**: Gunicorn + any WSGI-compatible host

## Quick Start

### Prerequisites
- Python 3.10 or higher
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/Damon1o/Damon1o.git
cd Damon1o

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Run the development server
python app.py
```

Visit `http://localhost:5000`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | Flask secret key for session encryption |
| `SMTP_PASSWORD` | No | Gmail app password for contact form email notifications |

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
│   │   ├── core.css            # Tokens, layout, nav, footer, shared components
│   │   ├── pages/              # Per-page styles (index, projects, about, legal, …)
│   │   └── admin/              # Admin dashboard styles
│   ├── js/
│   │   ├── core.js             # Particle canvas, theme toggle, scroll reveals, animations
│   │   ├── pages/              # Per-page scripts (hero background, filtering, …)
│   │   └── admin/              # Admin dashboard scripts
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

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero section, particle background, featured projects marquee |
| `/projects` | Full project showcase with tag filtering and search |
| `/experience` | Learning journey and hackathon history timeline |
| `/about` | Bio, skills, personal values, and downloadable resume |
| `/contact` | Contact form — saves to JSON, optional email notification |
| `/admin` | Admin login (password-protected) |
| `/admin/dashboard` | Content management dashboard |

## Admin Panel

Access at `/admin`. Default password: `admin123` (change immediately via dashboard or `siteConfig.json`).

The admin dashboard lets you:

- **Projects** — Add, edit, or delete portfolio projects with title, category, tags, description, cover image, and links
- **Experience** — Manage learning entries and hackathon history (name, role, period, skills, description)
- **Messages** — View contact form submissions, mark as read, or delete
- **Site Config** — Edit hero text and status, contact links, admin password
- **Hero Photos** — Manage the floating skill-card grid flanking the hero section

All data lives in flat JSON files under `static/data/` — no database migrations, no setup.

## Deployment

This app runs anywhere that supports WSGI.

### Vercel

`vercel.json` is already configured. Install the [Vercel CLI](https://vercel.com/docs/cli) and run `vercel`, or import the repo at vercel.com. Set `SECRET_KEY` (required — without it, admin sessions break across serverless cold starts) and optionally `SMTP_PASSWORD` in the project's environment variables.

**Serverless caveat**: Vercel's filesystem is read-only, so runtime writes don't persist — admin panel edits, image uploads, and contact-message storage are disabled there. Manage content by editing the JSON files under `static/data/` and redeploying. The contact form still works: email notification is sent if SMTP is configured, but messages won't appear in the admin dashboard.

### Heroku / Render / Railway

The `Procfile` is already configured:

```
web: gunicorn wsgi:app
```

### Manual (any Linux server)

```bash
pip install -r requirements.txt
gunicorn wsgi:app --bind 0.0.0.0:8000
```

### Environment Variables for Production

| Variable | Required | Notes |
|---|---|---|
| `SECRET_KEY` | Yes | Use a strong random string |
| `SMTP_PASSWORD` | No | Gmail app password for email notifications |
| `FLASK_DEBUG` | No | Set to `0` to disable debug mode |

## Design

The site uses a warm, organic design language:

- **Accent color**: Terracotta `#C8744D` with hover `#B05E39`
- **Typography**: Fraunces (display headings) + Outfit (body) + JetBrains Mono (code)
- **Background**: Interactive canvas particle system with glow nodes and mouse interaction
- **Theme**: Light/dark mode toggle persisted to `localStorage`, controlled via CSS custom properties
- **Motion**: Scroll-triggered reveals (`IntersectionObserver`), typewriter subtitle animation, parallax hero cards, project card marquee
- **Design tokens**: Full CSS variable system for spacing, radii, shadows, easing curves, and fluid typography

## License

MIT
