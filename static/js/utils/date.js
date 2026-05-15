export function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'number') {
        const fromNumber = new Date(value);
        return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
    }
    if (value.toDate && typeof value.toDate === 'function') {
        const fromToDate = value.toDate();
        return fromToDate instanceof Date && !Number.isNaN(fromToDate.getTime()) ? fromToDate : null;
    }
    if (value.seconds) {
        const fromSeconds = new Date(value.seconds * 1000);
        return Number.isNaN(fromSeconds.getTime()) ? null : fromSeconds;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const [yearStr, monthStr, dayStr] = trimmed.split('-');
            const year = Number(yearStr);
            const month = Number(monthStr);
            const day = Number(dayStr);
            if ([year, month, day].some(num => Number.isNaN(num))) return null;
            const localDate = new Date(year, month - 1, day);
            return Number.isNaN(localDate.getTime()) ? null : localDate;
        }
        let normalized = trimmed.includes('T') ? trimmed : trimmed.replace(/\s+/, 'T');
        normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
        normalized = normalized.replace(/([+-]\d{2})$/, '$1:00');
        normalized = normalized.replace(/(\.\d{3})\d+/, '$1');
        let date = new Date(normalized);
        if (!Number.isNaN(date.getTime())) return date;
        if (!/(?:[zZ]|[+-]\d{2}:\d{2})$/.test(normalized)) {
            date = new Date(`${normalized}Z`);
            if (!Number.isNaN(date.getTime())) return date;
        }
        return null;
    }
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function formatDateValue(value) {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
}

export function formatDateTimeValue(value) {
    const date = parseDate(value);
    if (!date) return '';
    return new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(date);
}

export function toIsoString(value) {
    const date = parseDate(value);
    return date ? date.toISOString() : null;
}

export function formatTimeValue(value) {
    if (!value) return '';
    const timeParts = value.split(':');
    const hour = (timeParts[0] || '00').padStart(2, '0');
    const minute = (timeParts[1] || '00').padStart(2, '0');
    return `${hour}:${minute}`;
}