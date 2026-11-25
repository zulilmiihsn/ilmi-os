'use client';

import { useState, useEffect, memo, useRef } from 'react';

interface MobileClockProps {
	textColor?: string;
}

function MobileClock({ textColor }: MobileClockProps) {
	const [currentTime, setCurrentTime] = useState('');
	const [mounted, setMounted] = useState(false);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		setMounted(true);

		const updateTime = () => {
			const now = new Date();
			setCurrentTime(
				now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })
			);
		};

		// Initial set
		updateTime();

		// Calculate delay until next minute to sync updates
		const now = new Date();
		const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

		// First timeout to sync with the minute, then interval every 60 seconds
		const timeout = setTimeout(() => {
			updateTime();
			// Now start the 60-second interval
			intervalRef.current = setInterval(updateTime, 60000);
		}, msUntilNextMinute);

		return () => {
			clearTimeout(timeout);
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	if (!mounted) return null;

	return (
		<span className="tabular-nums" style={{ color: textColor }}>
			{currentTime}
		</span>
	);
}

export default memo(MobileClock);
