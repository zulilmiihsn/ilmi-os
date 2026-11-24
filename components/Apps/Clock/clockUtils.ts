export interface CityTime {
	city: string;
	timezone: string;
	offset: number; // Hours offset from UTC
}

export interface Alarm {
	id: string;
	time: string;
	enabled: boolean;
	label: string;
}

export interface LapTime {
	id: string;
	time: number;
	lapDiff: number;
}

export const INITIAL_CITIES: CityTime[] = [
	{ city: 'Samarinda', timezone: 'Asia/Makassar', offset: 8 }, // WITA
	{ city: 'Malang', timezone: 'Asia/Jakarta', offset: 7 }, // WIB
];

// Curated addable cities (real IANA zones; offset computed live, DST-aware).
export const CITY_CHOICES: { city: string; timezone: string }[] = [
	{ city: 'Jakarta', timezone: 'Asia/Jakarta' },
	{ city: 'Makassar', timezone: 'Asia/Makassar' },
	{ city: 'Jayapura', timezone: 'Asia/Jayapura' },
	{ city: 'Singapore', timezone: 'Asia/Singapore' },
	{ city: 'Tokyo', timezone: 'Asia/Tokyo' },
	{ city: 'Seoul', timezone: 'Asia/Seoul' },
	{ city: 'Sydney', timezone: 'Australia/Sydney' },
	{ city: 'Dubai', timezone: 'Asia/Dubai' },
	{ city: 'London', timezone: 'Europe/London' },
	{ city: 'Paris', timezone: 'Europe/Paris' },
	{ city: 'New York', timezone: 'America/New_York' },
	{ city: 'Los Angeles', timezone: 'America/Los_Angeles' },
];

// Current UTC offset of a zone in whole hours, DST-aware at call time.
export const zoneOffsetHours = (timezone: string, at = new Date()): number => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	}).formatToParts(at);
	const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0);
	const asUTC = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		get('hour'),
		get('minute'),
		get('second')
	);
	return Math.round((asUTC - at.getTime()) / 3600000);
};

export function computeCityTimes(cities: CityTime[], currentTime: Date) {
	const localTime = new Date();
	const localOffset = -localTime.getTimezoneOffset() / 60; // Local timezone offset in hours from UTC

	return cities.map(cityData => {
		const cityTime = new Date(currentTime.toLocaleString('en-US', { timeZone: cityData.timezone }));

		const hours = cityTime.getHours();
		const minutes = cityTime.getMinutes();
		const ampm = hours >= 12 ? 'PM' : 'AM';
		const displayHours = hours % 12 || 12;
		const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;

		const localDate = new Date(
			localTime.getFullYear(),
			localTime.getMonth(),
			localTime.getDate()
		);
		const cityDate = new Date(cityTime.getFullYear(), cityTime.getMonth(), cityTime.getDate());
		const dayDiff = Math.floor(
			(cityDate.getTime() - localDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		let dayLabel = 'Today';
		if (dayDiff === 1) dayLabel = 'Tomorrow';
		else if (dayDiff === -1) dayLabel = 'Yesterday';

		const cityOffset = cityData.offset;
		const hourDiff = cityOffset - localOffset;

		let hourDiffString = '';
		if (hourDiff === 0) {
			hourDiffString = '+0HRS';
		} else if (hourDiff > 0) {
			hourDiffString = `+${hourDiff}HRS`;
		} else {
			hourDiffString = `${hourDiff}HRS`;
		}

		return {
			...cityData,
			time: timeString,
			dayLabel,
			hourDiffString,
		};
	});
}
