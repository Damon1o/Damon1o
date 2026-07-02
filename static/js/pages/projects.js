/* ─── Project Search ────────────────────────────── */
function initProjectSearch() {
    const search = document.querySelector('.project-search');
    const form = search ? search.closest('form') : null;
    if (!search || !form) return;

    let timer;
    search.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => form.submit(), 300);
    });
}

