/* ─── Typing Animation ───────────────────────────── */
function initTyping() {
    const textEl = document.querySelector('.hero-typing-text');
    const cursorEl = document.querySelector('.typing-cursor');
    if (!textEl || !cursorEl) return;

        const phrases = ['I design', 'I build', 'I create'];
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pause = 2000;
    let phraseIdx = 0;
    let charIdx = 0;
    let deleting = false;

    const type = () => {
        const current = phrases[phraseIdx];
        if (!deleting) {
            textEl.textContent = current.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === current.length) {
                setTimeout(() => { deleting = true; type(); }, pause);
                return;
            }
        } else {
            textEl.textContent = current.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                deleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
            }
        }
        setTimeout(type, deleting ? deleteSpeed : typeSpeed);
    };

    textEl.textContent = '';
    cursorEl.style.display = 'block';
    type();
}

/* ─── Marquee ───────────────────────────────────── */
function initMarquee() {
    const track = document.querySelector('.marquee-content');
    if (!track) return;
    if (track.children.length < 3 && track.parentElement) {
        const clone = track.cloneNode(true);
        track.parentElement.appendChild(clone);
    }
}

/* ─── Parallax ───────────────────────────────────── */
function initParallax() {
    const heroContent = document.querySelector('.hero-content');
    const photoWrappers = document.querySelectorAll('.hero-photo-wrapper');
    if (!heroContent && !photoWrappers.length) return;

    let ticking = false;
    const onScroll = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                if (scrollY < window.innerHeight) {
                    if (heroContent) {
                        heroContent.style.transform = `translateY(${scrollY * 0.08}px)`;
                        heroContent.style.opacity = 1 - scrollY / (window.innerHeight * 1.2);
                    }
                    photoWrappers.forEach((el) => {
                        const speed = parseFloat(el.dataset.parallax) || 0.08;
                        el.style.transform = `translateY(${scrollY * speed}px)`;
                    });
                }
                ticking = false;
            });
            ticking = true;
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
}

