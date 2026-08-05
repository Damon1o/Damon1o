/* ─── ShaderBackground ──────────────────────────── */
class ShaderBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.glowParticles = [];
        this.mouse = { x: -9999, y: -9999 };
        this.width = 0;
        this.height = 0;
        this.subtle = canvas.classList.contains('canvas-bg--subtle');
        this.maxDist = 150;
        this.mouseRadius = this.subtle ? 140 : 200;
        this.repelForce = this.subtle ? 0.3 : 0.5;
        this.cursorGlow = this.subtle ? 0.025 : 0.04;
        this.particleCount = this.subtle
            ? Math.min(Math.floor(window.innerWidth * 0.045), 80)
            : Math.min(Math.floor(window.innerWidth * 0.08), 140);
        this.glowCount = Math.floor(this.particleCount * 0.12);
        this.cellSize = this.maxDist;
        this.grid = {};
        this.frame = null;
        this.running = false;
        this.paused = false;
        this.time = 0;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.cellSize = this.maxDist;
        this.cols = Math.ceil(this.width / this.cellSize) + 1;
        this.rows = Math.ceil(this.height / this.cellSize) + 1;
        if (!this.running) this.create();
    }

    create() {
        this.particles = [];
        this.glowParticles = [];

        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                r: Math.random() * 2 + 1,
                baseX: Math.random() * 1000,
                baseY: Math.random() * 1000,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.4 + 0.2,
            });
        }

        for (let i = 0; i < this.glowCount; i++) {
            this.glowParticles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                r: Math.random() * 6 + 3,
                baseX: Math.random() * 1000,
                baseY: Math.random() * 1000,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.2 + 0.1,
            });
        }
    }

    flowAt(x, y, t) {
        const scale = 0.0008;
        const sx = x * scale + 1000;
        const sy = y * scale + 500;
        const angle =
            Math.sin(sx * 1.3 + t * 0.0004) * Math.cos(sy * 1.7 + t * 0.0003) * 0.8 +
            Math.sin(sx * 2.7 - t * 0.0005) * 0.4 +
            Math.cos(sy * 3.1 + sx * 0.9 + t * 0.0002) * 0.3;
        return angle * 0.35;
    }

    _cellKey(col, row) { return `${col},${row}`; }

    _buildGrid() {
        this.grid = {};
        const allParticles = [...this.particles, ...this.glowParticles];
        for (const p of allParticles) {
            const col = Math.floor(p.x / this.cellSize);
            const row = Math.floor(p.y / this.cellSize);
            const key = this._cellKey(col, row);
            if (!this.grid[key]) this.grid[key] = [];
            this.grid[key].push(p);
        }
    }

    _getNeighbors(col, row) {
        const neighbors = [];
        for (let dc = -1; dc <= 1; dc++) {
            for (let dr = -1; dr <= 1; dr++) {
                const key = this._cellKey(col + dc, row + dr);
                if (this.grid[key]) neighbors.push(...this.grid[key]);
            }
        }
        return neighbors;
    }

    update(delta) {
        if (this.paused) return;
        const dt = Math.min(delta || 16, 32);

        for (const p of this.particles) {
            const flow = this.flowAt(p.x, p.y, this.time);
            p.vx += Math.cos(flow) * 0.015;
            p.vy += Math.sin(flow) * 0.015;
            p.vx *= 0.995;
            p.vy *= 0.995;
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const maxSpeed = p.speed;
            if (speed > maxSpeed) {
                p.vx = (p.vx / speed) * maxSpeed;
                p.vy = (p.vy / speed) * maxSpeed;
            }
            p.x += p.vx * (dt / 16);
            p.y += p.vy * (dt / 16);
            if (p.x < -20) p.x = this.width + 20;
            if (p.x > this.width + 20) p.x = -20;
            if (p.y < -20) p.y = this.height + 20;
            if (p.y > this.height + 20) p.y = -20;
        }

        for (const g of this.glowParticles) {
            const flow = this.flowAt(g.x, g.y, this.time) * 0.6;
            g.vx += Math.cos(flow) * 0.008;
            g.vy += Math.sin(flow) * 0.008;
            g.vx *= 0.997;
            g.vy *= 0.997;
            const speed = Math.sqrt(g.vx * g.vx + g.vy * g.vy);
            if (speed > g.speed) {
                g.vx = (g.vx / speed) * g.speed;
                g.vy = (g.vy / speed) * g.speed;
            }
            g.x += g.vx * (dt / 16);
            g.y += g.vy * (dt / 16);
            if (g.x < -50) g.x = this.width + 50;
            if (g.x > this.width + 50) g.x = -50;
            if (g.y < -50) g.y = this.height + 50;
            if (g.y > this.height + 50) g.y = -50;
        }

        const allParticles = [...this.particles, ...this.glowParticles];
        for (const p of allParticles) {
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < this.mouseRadius && dist > 0.5) {
                const force = (1 - dist / this.mouseRadius) * this.repelForce;
                p.x += (dx / dist) * force;
                p.y += (dy / dist) * force;
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        const grd = this.ctx.createRadialGradient(
            this.mouse.x, this.mouse.y, 0,
            this.mouse.x, this.mouse.y, this.mouseRadius
        );
        grd.addColorStop(0, `rgba(200, 116, 77, ${this.cursorGlow})`);
        grd.addColorStop(1, 'rgba(200, 116, 77, 0)');
        this.ctx.fillStyle = grd;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this._buildGrid();

        for (let i = 0; i < this.particles.length; i++) {
            const a = this.particles[i];
            const col = Math.floor(a.x / this.cellSize);
            const row = Math.floor(a.y / this.cellSize);
            const neighbors = this._getNeighbors(col, row);

            for (const b of neighbors) {
                if (a === b || b.r > 3) continue;
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.maxDist) {
                    const alpha = (1 - dist / this.maxDist) * 0.07;
                    this.ctx.strokeStyle = `rgba(200, 116, 77, ${alpha})`;
                    this.ctx.lineWidth = 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                }
            }
        }

        for (const p of this.particles) {
            this.ctx.fillStyle = 'rgba(200, 116, 77, 0.15)';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            this.ctx.fill();
        }

        for (const g of this.glowParticles) {
            const glowGrd = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 2);
            glowGrd.addColorStop(0, 'rgba(200, 116, 77, 0.08)');
            glowGrd.addColorStop(0.4, 'rgba(200, 116, 77, 0.04)');
            glowGrd.addColorStop(1, 'rgba(200, 116, 77, 0)');
            this.ctx.fillStyle = glowGrd;
            this.ctx.beginPath();
            this.ctx.arc(g.x, g.y, g.r * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    animate(timestamp) {
        if (!this.running) return;
        const delta = this._lastTime ? timestamp - this._lastTime : 16;
        this._lastTime = timestamp;
        this.time += delta;
        this.update(delta);
        this.draw();
        this.frame = requestAnimationFrame((t) => this.animate(t));
    }

    start() {
        if (this.reducedMotion) return;
        this.resize();
        this.create();
        this.running = true;
        this.paused = false;
        this._lastTime = 0;

        this._resizeHandler = () => this.resize();
        window.addEventListener('resize', this._resizeHandler);

        this._mouseHandler = (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        };
        document.addEventListener('mousemove', this._mouseHandler);

        this._mouseLeaveHandler = () => {
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        };
        document.addEventListener('mouseleave', this._mouseLeaveHandler);

        this._motionHandler = (e) => {
            this.reducedMotion = e.matches;
            if (e.matches) this.stop();
            else { this.start(); }
        };
        this._motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        this._motionQuery.addEventListener('change', this._motionHandler);

        this._visibilityHandler = () => {
            this.paused = document.hidden;
        };
        document.addEventListener('visibilitychange', this._visibilityHandler);

        this.frame = requestAnimationFrame((t) => this.animate(t));
    }

    stop() {
        this.running = false;
        if (this.frame) { cancelAnimationFrame(this.frame); this.frame = null; }
        if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
        if (this._mouseHandler) document.removeEventListener('mousemove', this._mouseHandler);
        if (this._mouseLeaveHandler) document.removeEventListener('mouseleave', this._mouseLeaveHandler);
        if (this._motionQuery && this._motionHandler) this._motionQuery.removeEventListener('change', this._motionHandler);
        if (this._visibilityHandler) document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
}

/* ─── Navigation ─────────────────────────────────── */
function initNav(themeToggleFn) {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                navbar.classList.toggle('scrolled', window.scrollY > 10);
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            const expanded = hamburger.getAttribute('aria-expanded') === 'true';
            hamburger.setAttribute('aria-expanded', !expanded);
            hamburger.classList.toggle('open');
            mobileMenu.classList.toggle('open');
        });

        mobileMenu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                mobileMenu.classList.remove('open');
                hamburger.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    if (themeToggleFn) {
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.innerHTML = themeToggleFn.getIcon();
            themeBtn.addEventListener('click', themeToggleFn.toggle);
        }
    }
}

/* ─── Intersection Observer - Reveal ─────────────── */
function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach((el) => {
        const delay = el.getAttribute('data-delay');
        if (delay) {
            el.style.transitionDelay = `${(parseInt(delay) - 1) * 0.08}s`;
        }
        observer.observe(el);
    });
}

/* ─── Theme Toggle ───────────────────────────────── */
const ThemeToggle = {
    key: 'portfolio-theme',
    get() {
        return localStorage.getItem(this.key) || 'light';
    },
    set(mode) {
        localStorage.setItem(this.key, mode);
        document.documentElement.classList.toggle('dark', mode === 'dark');
        document.documentElement.dispatchEvent(new CustomEvent('themechange', { detail: { mode: mode } }));
    },
    getIcon() {
        return this.get() === 'dark'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    },
    toggle() {
        const next = ThemeToggle.get() === 'dark' ? 'light' : 'dark';
        ThemeToggle.set(next);
        const btn = document.querySelector('.theme-toggle');
        if (btn) btn.innerHTML = ThemeToggle.getIcon();
    },
    init() {
        ThemeToggle.set(ThemeToggle.get());
    }
};

/* ─── Smooth Scroll ──────────────────────────────── */
function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

/* ─── Init ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    ThemeToggle.init();

    const canvas = document.getElementById('shaderCanvas');
    if (canvas) {
        const bg = new ShaderBackground(canvas);
        bg.start();
    }

    initNav(ThemeToggle);
    initReveal();
    if (typeof initTyping === 'function') initTyping();
    if (typeof initMarquee === 'function') initMarquee();
    if (typeof initAdminTabs === 'function') initAdminTabs();
    initSmoothScroll();
    if (typeof initParallax === 'function') initParallax();
    if (typeof initProjectSearch === 'function') initProjectSearch();
});
