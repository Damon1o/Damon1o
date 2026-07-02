/* ─── Admin Tabs ─────────────────────────────────── */
function initAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const targetId = tab.getAttribute('data-tab');
            tabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-tab-content').forEach((c) => c.classList.remove('active'));
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
        });
    });

    var hash = window.location.hash.substring(1);
    if (hash) {
        var tab = document.querySelector('.admin-tab[data-tab="' + hash + '"]');
        if (tab) tab.click();
    }
}

/* ─── toggleMsg ─────────────────────────────────── */
window.toggleMsg = function (btn, msgId) {
    const body = document.getElementById('msg-' + msgId);
    if (!body) return;
    const isVisible = body.style.display === 'block';
    body.style.display = isVisible ? 'none' : 'block';
    btn.textContent = isVisible ? 'View' : 'Hide';
    if (!isVisible) {
        fetch('/admin/messages/mark-read/' + msgId, { method: 'POST' }).catch(() => {});
    }
};
