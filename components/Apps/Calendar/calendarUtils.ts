export interface CalendarEvent {
	date: string; // YYYY-MM-DD
	title: string;
	color?: string;
}

export const CALENDAR_STORAGE_KEY = 'ilmi:calendar:v1';

export const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

export const getDaysInMonth = (year: number, month: number) => {
	return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year: number, month: number) => {
	return new Date(year, month, 1).getDay();
};

export const isSameDay = (d1: Date, d2: Date) => {
	return (
		d1.getFullYear() === d2.getFullYear() &&
		d1.getMonth() === d2.getMonth() &&
		d1.getDate() === d2.getDate()
	);
};

export const formatDateStr = (date: Date) => {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function getDefaultCalendarEvents(now = new Date()): CalendarEvent[] {
	return [
		{ date: formatDateStr(new Date(now.getFullYear(), 11, 25)), title: 'Christmas' },
		{ date: formatDateStr(new Date(now.getFullYear() + 1, 0, 1)), title: 'New Year' },
	];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Decode stored calendar events. Empty arrays are valid; anything malformed returns null. */
export function decodeCalendarEvents(payload: unknown): CalendarEvent[] | null {
	if (!Array.isArray(payload)) return null;
	const events: CalendarEvent[] = [];
	for (const record of payload) {
		if (typeof record !== 'object' || record === null) return null;
		const item = record as Record<string, unknown>;
		if (typeof item.date !== 'string' || !ISO_DATE_RE.test(item.date)) return null;
		if (typeof item.title !== 'string' || item.title.trim().length === 0) return null;
		events.push({
			date: item.date,
			title: item.title,
			color: typeof item.color === 'string' ? item.color : undefined,
		});
	}
	return events;
}

export interface CalendarLoadResult {
	events: CalendarEvent[];
	skipInitialSave: boolean;
}

export function resolveInitialCalendarEvents(
	stored: unknown,
	destinationPresent: boolean,
	defaults: CalendarEvent[] = getDefaultCalendarEvents()
): CalendarLoadResult {
	const decoded = stored === null ? null : decodeCalendarEvents(stored);
	if (decoded) {
		return { events: decoded, skipInitialSave: false };
	}
	if (destinationPresent) {
		return { events: defaults, skipInitialSave: true };
	}
	return { events: defaults, skipInitialSave: false };
}
