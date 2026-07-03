/* ─── Hero Background — fully-coded WebGL shader ───
   Domain-warped simplex "silk" + drifting radial ripples,
   theme-aware palettes, mouse lens, film grain. No dependencies. */
(function () {
    'use strict';

    var VERT = [
        'attribute vec2 aPos;',
        'void main() { gl_Position = vec4(aPos, 0.0, 1.0); }'
    ].join('\n');

    var FRAG = [
        'precision highp float;',
        '',
        'uniform vec2  uRes;',
        'uniform float uTime;',
        'uniform vec2  uMouse;',
        'uniform float uTheme;',
        'uniform float uIntro;',
        '',
        '/* ── simplex noise (Ashima Arts, MIT) ── */',
        'vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
        'vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }',
        'vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }',
        '',
        'float snoise(vec2 v) {',
        '    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);',
        '    vec2 i  = floor(v + dot(v, C.yy));',
        '    vec2 x0 = v - i + dot(i, C.xx);',
        '    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
        '    vec4 x12 = x0.xyxy + C.xxzz;',
        '    x12.xy -= i1;',
        '    i = mod289(i);',
        '    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
        '    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);',
        '    m = m * m;',
        '    m = m * m;',
        '    vec3 x = 2.0 * fract(p * C.www) - 1.0;',
        '    vec3 h = abs(x) - 0.5;',
        '    vec3 ox = floor(x + 0.5);',
        '    vec3 a0 = x - ox;',
        '    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);',
        '    vec3 g;',
        '    g.x  = a0.x  * x0.x  + h.x  * x0.y;',
        '    g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
        '    return 130.0 * dot(m, g);',
        '}',
        '',
        'const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);',
        '',
        'float fbm(vec2 p) {',
        '    float sum = 0.0;',
        '    float amp = 0.5;',
        '    for (int i = 0; i < 4; i++) {',
        '        sum += amp * snoise(p);',
        '        p = ROT * p * 2.02;',
        '        amp *= 0.5;',
        '    }',
        '    return sum * 0.5 + 0.5;',
        '}',
        '',
        'void main() {',
        '    vec2 frag = gl_FragCoord.xy / uRes;',
        '    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;',
        '    float t = uTime * 0.055;',
        '',
        '    /* ── drifting radial ripple emitters ── */',
        '    float ripple = 0.0;',
        '    for (int i = 0; i < 3; i++) {',
        '        float fi = float(i);',
        '        vec2 c = vec2(sin(t * 0.72 + fi * 2.1) * 0.62, cos(t * 0.53 + fi * 1.7) * 0.38);',
        '        float d = length(p - c);',
        '        ripple += sin(d * 24.0 - uTime * 0.85 - fi * 1.3) * exp(-d * 2.8);',
        '    }',
        '    ripple *= 0.5;',
        '',
        '    /* ── mouse lens warp ── */',
        '    vec2 mv = p - uMouse;',
        '    float mForce = exp(-dot(mv, mv) * 8.0);',
        '    vec2 mWarp = normalize(mv + 0.0001) * mForce * 0.16;',
        '',
        '    /* ── double domain warp (silk) ── */',
        '    vec2 s = p * 1.35;',
        '    vec2 q = vec2(fbm(s + vec2(0.0, t * 0.50)),',
        '                  fbm(s + vec2(5.2, 1.3) - t * 0.35));',
        '    vec2 r = vec2(fbm(s + 2.4 * q + vec2(1.7, 9.2) + t * 0.42),',
        '                  fbm(s + 2.4 * q + vec2(8.3, 2.8) - t * 0.27));',
        '    float f = fbm(s + 2.2 * r + mWarp + ripple * 0.14);',
        '',
        '    /* ── theme palettes (light -> dark) ── */',
        '    vec3 base = mix(vec3(0.981, 0.977, 0.970), vec3(0.051, 0.051, 0.102), uTheme);',
        '    vec3 c1   = mix(vec3(0.960, 0.912, 0.862), vec3(0.093, 0.093, 0.176), uTheme);',
        '    vec3 c2   = mix(vec3(0.943, 0.777, 0.647), vec3(0.238, 0.130, 0.220), uTheme);',
        '    vec3 c3   = mix(vec3(0.784, 0.455, 0.302), vec3(0.784, 0.455, 0.302), uTheme);',
        '    vec3 hi   = mix(vec3(0.580, 0.310, 0.180), vec3(0.980, 0.690, 0.480), uTheme);',
        '',
        '    vec3 col = base;',
        '    col = mix(col, c1, smoothstep(0.14, 0.60, f));',
        '    col = mix(col, c2, smoothstep(0.44, 0.86, f) * 0.85);',
        '    col = mix(col, c3, smoothstep(0.62, 0.98, f) * 0.68);',
        '',
        '    /* iridescent veins where the warp folds */',
        '    col = mix(col, hi, smoothstep(0.55, 0.92, length(r) * 0.72) * smoothstep(0.58, 0.95, f) * 0.45);',
        '    /* ripple shimmer */',
        '    col += (hi - base) * ripple * 0.055;',
        '    /* warm glow following the cursor */',
        '    col = mix(col, c3, mForce * 0.10);',
        '',
        '    /* ── calm clearing behind the headline ── */',
        '    float cd = length(p - vec2(0.0, 0.02));',
        '    col = mix(col, base, (1.0 - smoothstep(0.12, 0.85, cd)) * 0.52);',
        '',
        '    /* ── vignette ── */',
        '    vec2 vuv = frag * (1.0 - frag);',
        '    float vig = pow(vuv.x * vuv.y * 15.0, 0.18);',
        '    col *= mix(1.0, vig, mix(0.16, 0.42, uTheme));',
        '',
        '    /* ── fade into the page background at the hero\'s foot ── */',
        '    vec3 page = mix(vec3(0.980, 0.980, 0.980), vec3(0.051, 0.051, 0.102), uTheme);',
        '    col = mix(col, page, smoothstep(0.30, 0.0, frag.y) * 0.9);',
        '',
        '    /* ── intro bloom + film grain ── */',
        '    col = mix(base, col, uIntro);',
        '    float grain = fract(sin(dot(gl_FragCoord.xy + fract(uTime) * 61.0, vec2(12.9898, 78.233))) * 43758.5453);',
        '    col += (grain - 0.5) * (2.6 / 255.0);',
        '',
        '    gl_FragColor = vec4(col, 1.0);',
        '}'
    ].join('\n');

    function HeroBackground(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.program = null;
        this.uniforms = {};
        this.frame = null;
        this.startTime = 0;
        this.lastTime = 0;
        this.elapsed = 0;
        this.visible = true;
        this.hidden = document.hidden;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.theme = document.documentElement.classList.contains('dark') ? 1 : 0;
        this.themeTarget = this.theme;
        this.intro = 0;

        this.mouse = { x: 0, y: -2 };
        this.mouseTarget = { x: 0, y: -2 };

        // adaptive quality: drop render scale if frames run slow
        this.qualityTiers = [1, 0.75, 0.55];
        this.tier = 0;
        this.emaDt = 16;
        this.framesSinceDrop = 0;
    }

    HeroBackground.prototype.initGL = function () {
        var gl = this.canvas.getContext('webgl', {
            alpha: false, depth: false, stencil: false, antialias: false,
            preserveDrawingBuffer: false
        });
        if (!gl) return false;
        this.gl = gl;

        var vs = this._compile(gl.VERTEX_SHADER, VERT);
        var fs = this._compile(gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return false;

        var prog = gl.createProgram();
        gl.attachShader(prog, vs);
        gl.attachShader(prog, fs);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);
        this.program = prog;

        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        var names = ['uRes', 'uTime', 'uMouse', 'uTheme', 'uIntro'];
        for (var i = 0; i < names.length; i++) {
            this.uniforms[names[i]] = gl.getUniformLocation(prog, names[i]);
        }
        return true;
    };

    HeroBackground.prototype._compile = function (type, src) {
        var gl = this.gl;
        var sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            if (window.console && console.warn) console.warn('Hero shader:', gl.getShaderInfoLog(sh));
            return null;
        }
        return sh;
    };

    HeroBackground.prototype.resize = function () {
        var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * this.qualityTiers[this.tier];
        var w = Math.max(1, Math.round(this.canvas.clientWidth * dpr));
        var h = Math.max(1, Math.round(this.canvas.clientHeight * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.gl.viewport(0, 0, w, h);
        }
    };

    HeroBackground.prototype.render = function (time) {
        var gl = this.gl;
        var dt = this.lastTime ? Math.min(time - this.lastTime, 50) : 16;
        this.lastTime = time;
        this.elapsed += dt / 1000;

        // adaptive quality
        this.emaDt = this.emaDt * 0.95 + dt * 0.05;
        this.framesSinceDrop++;
        if (this.emaDt > 26 && this.tier < this.qualityTiers.length - 1 && this.framesSinceDrop > 90) {
            this.tier++;
            this.framesSinceDrop = 0;
            this.emaDt = 16;
            this.resize();
        }

        // smooth followers
        this.mouse.x += (this.mouseTarget.x - this.mouse.x) * 0.055;
        this.mouse.y += (this.mouseTarget.y - this.mouse.y) * 0.055;
        this.theme += (this.themeTarget - this.theme) * 0.045;
        this.intro = Math.min(1, this.intro + dt / 1600);
        var introEased = 1 - Math.pow(1 - this.intro, 3);

        gl.uniform2f(this.uniforms.uRes, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uniforms.uTime, this.elapsed);
        gl.uniform2f(this.uniforms.uMouse, this.mouse.x, this.mouse.y);
        gl.uniform1f(this.uniforms.uTheme, this.theme);
        gl.uniform1f(this.uniforms.uIntro, introEased);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    HeroBackground.prototype.loop = function (time) {
        if (!this.running) return;
        this.render(time);
        var self = this;
        this.frame = requestAnimationFrame(function (t) { self.loop(t); });
    };

    HeroBackground.prototype.updateRunning = function () {
        var shouldRun = this.visible && !this.hidden && !this.reducedMotion && !!this.gl;
        if (shouldRun && !this.running) {
            this.running = true;
            this.lastTime = 0;
            var self = this;
            this.frame = requestAnimationFrame(function (t) { self.loop(t); });
        } else if (!shouldRun && this.running) {
            this.running = false;
            if (this.frame) cancelAnimationFrame(this.frame);
            this.frame = null;
        }
    };

    HeroBackground.prototype.start = function () {
        if (!this.initGL()) return false;
        this.resize();

        var self = this;

        window.addEventListener('resize', function () { self.resize(); });

        var hero = this.canvas.closest('.hero') || this.canvas.parentElement;
        hero.addEventListener('pointermove', function (e) {
            var rect = self.canvas.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            var aspect = rect.width / rect.height;
            self.mouseTarget.x = ((e.clientX - rect.left) / rect.width - 0.5) * aspect;
            self.mouseTarget.y = 0.5 - (e.clientY - rect.top) / rect.height;
        });
        hero.addEventListener('pointerleave', function () {
            self.mouseTarget.x = 0;
            self.mouseTarget.y = -2;
        });

        document.documentElement.addEventListener('themechange', function (e) {
            self.themeTarget = e.detail && e.detail.mode === 'dark' ? 1 : 0;
            if (self.reducedMotion && self.gl) {
                // no animation loop: snap and paint one frame
                self.theme = self.themeTarget;
                self.render(performance.now());
            }
        });

        document.addEventListener('visibilitychange', function () {
            self.hidden = document.hidden;
            self.updateRunning();
        });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                self.visible = entries[0].isIntersecting;
                self.updateRunning();
            }, { threshold: 0 }).observe(this.canvas);
        }

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function (e) {
            self.reducedMotion = e.matches;
            self.updateRunning();
            if (e.matches && self.gl) {
                self.intro = 1;
                self.render(performance.now());
            }
        });

        this.canvas.addEventListener('webglcontextlost', function (e) {
            e.preventDefault();
            self.running = false;
            if (self.frame) cancelAnimationFrame(self.frame);
            self.frame = null;
            self.gl = null;
        });
        this.canvas.addEventListener('webglcontextrestored', function () {
            if (self.initGL()) {
                self.resize();
                self.updateRunning();
            }
        });

        if (this.reducedMotion) {
            // single still frame — composition without motion
            this.intro = 1;
            this.elapsed = 40;
            this.render(performance.now());
        } else {
            this.updateRunning();
        }
        return true;
    };

    document.addEventListener('DOMContentLoaded', function () {
        var canvas = document.getElementById('heroCanvas');
        if (!canvas) return;
        var bg = new HeroBackground(canvas);
        if (bg.start()) {
            canvas.classList.add('is-ready');
        }
        // if WebGL is unavailable the canvas stays transparent and the
        // CSS gradient fallback on .hero shows through
    });
})();
