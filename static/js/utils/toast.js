export function showToast(message, variant = 'neutral') {
    const toastRoot = document.getElementById('toast-root');
    if (!toastRoot) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${variant}`;
    toast.textContent = message;
    toastRoot.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    setTimeout(() => {
        toast.classList.remove('toast-visible');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}