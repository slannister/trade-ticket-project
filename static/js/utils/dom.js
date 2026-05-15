export function query(selector, scope = document) {
    return scope.querySelector(selector);
}

export function queryAll(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
}

export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                el.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on')) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, value);
        } else {
            el.setAttribute(key, value);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            el.appendChild(child);
        }
    });
    return el;
}

export function removeChildren(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

export function show(el) {
    if (!el) return;
    el.classList.remove('is-hidden');
    el.hidden = false;
}

export function hide(el) {
    if (!el) return;
    el.classList.add('is-hidden');
    el.hidden = true;
}

export function toggle(el, condition) {
    if (condition) {
        show(el);
    } else {
        hide(el);
    }
}

export { showToast } from './toast.js';