'use client';

import { useState, useEffect, memo } from 'react';
import { getBatteryInfo } from '../../utils/deviceInfo';
import { useControlCenterStore } from '../../stores/controlCenter';

interface WidgetProps {
	type?: 'battery' | 'calendar' | 'weather';
}

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function Widget({ type = 'battery' }: WidgetProps) {
	const [batteryLevel, setBatteryLevel] = useState<number>(100);
	const [batteryCharging, setBatteryCharging] = useState<boolean>(false);
	const [calendarDate, setCalendarDate] = useState<{ weekday: string; day: string }>({
		weekday: '',
		day: '',
	});
	const lowPowerMode = useControlCenterStore(state => state.lowPowerMode);

	useEffect(() => {
		if (type === 'battery') {
			async function updateBattery() {
				const battery = await getBatteryInfo();
				if (battery) {
					setBatteryLevel(Math.round(battery.level * 100));
					setBatteryCharging(battery.charging);
				}
			}
			updateBattery();

			// Reduced from 60 seconds to 5 minutes - battery level changes slowly
			const interval = setInterval(updateBattery, 300000);
			return () => clearInterval(interval);
		}

		if (type === 'calendar') {
			const updateDate = () => {
				const now = new Date();
				setCalendarDate({
					weekday: now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
					day: String(now.getDate()),
				});
			};
			updateDate();
			const interval = setInterval(updateDate, 60000);
			return () => clearInterval(interval);
		}
	}, [type]);

	const clampedBattery = Math.max(0, Math.min(100, batteryLevel));
	const strokeOffset = RING_CIRCUMFERENCE * (1 - clampedBattery / 100);
	const ringColor = batteryCharging
		? '#34c759'
		: lowPowerMode
			? '#ffcc00'
			: clampedBattery <= 20
				? '#ff3b30'
				: '#34c759';

	return (
		<div className="ios-widget w-full h-full flex flex-col">
			{type === 'battery' && (
				<>
					{/* Widget Box (Liquid Glass surface) */}
					<div className="w-full flex-1 p-3.5 rounded-[22px] bg-white/18 dark:bg-black/30 backdrop-blur-2xl border border-white/25 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)]">
						{/* Grid Layout: 2x2 */}
						<div className="grid grid-cols-2 gap-3 h-full">
							{/* Top Left: Circular SVG Progress Ring + Device Glyph */}
							<div className="w-full aspect-square flex items-center justify-center">
								<div className="relative w-16 h-16 flex items-center justify-center">
									<svg aria-hidden="true" viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
										<circle
											cx="32"
											cy="32"
											r={RING_RADIUS}
											fill="none"
											stroke="rgba(255,255,255,0.18)"
											strokeWidth="5"
										/>
										<circle
											cx="32"
											cy="32"
											r={RING_RADIUS}
											fill="none"
											stroke={ringColor}
											strokeWidth="5"
											strokeLinecap="round"
											strokeDasharray={RING_CIRCUMFERENCE}
											strokeDashoffset={strokeOffset}
											className="transition-[stroke-dashoffset,stroke] duration-500 ease-out"
										/>
									</svg>
									{/* Center Phone / Charging Glyph */}
									<div
										aria-hidden="true"
										className="absolute inset-0 flex items-center justify-center text-white"
									>
										{batteryCharging ? (
											<svg
												viewBox="0 0 16 20"
												className="w-4 h-5 text-[#34c759]"
												fill="currentColor"
											>
												<path d="M9.5 0.5L2 11h5l-1 8.5L14 9H9l0.5-8.5z" />
											</svg>
										) : (
											<svg
												viewBox="0 0 24 24"
												className="w-5 h-5 text-white/90"
												fill="none"
												stroke="currentColor"
												strokeWidth="2.2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<rect x="6" y="2.5" width="12" height="19" rx="2.5" />
												<line x1="10.5" y1="18.5" x2="13.5" y2="18.5" />
											</svg>
										)}
									</div>
								</div>
							</div>
							{/* Top Right: Empty */}
							<div />
							{/* Bottom: Battery Percentage */}
							<div className="col-span-2 flex items-center justify-center">
								<div className="text-5xl font-semibold text-white drop-shadow-md tabular-nums">
									{clampedBattery}%
								</div>
							</div>
						</div>
					</div>
					{/* Battery Label (outside box) */}
					<div className="text-xs font-medium text-white drop-shadow-md mt-1.5 text-center">
						Battery
					</div>
				</>
			)}
			{type === 'calendar' && (
				<>
					<div className="w-full flex-1 p-3.5 rounded-[22px] bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-2xl border border-white/40 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between">
						<div className="text-xs font-bold tracking-wider text-ios-red uppercase">
							{calendarDate.weekday}
						</div>
						<div className="text-5xl font-semibold leading-none text-gray-900 dark:text-white tabular-nums">
							{calendarDate.day}
						</div>
					</div>
					<div className="text-xs font-medium text-white drop-shadow-md mt-1.5 text-center">
						Calendar
					</div>
				</>
			)}
			{type === 'weather' && (
				<>
					<div className="w-full flex-1 p-3.5 rounded-[22px] bg-white/18 dark:bg-black/30 backdrop-blur-2xl border border-white/25 dark:border-white/15 shadow-[0_8px_24px_rgba(0,0,0,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)] flex flex-col justify-between text-white">
						<div className="text-3xl font-semibold tabular-nums drop-shadow-sm">72°</div>
						<div className="text-sm font-medium text-white/85">Sunny</div>
					</div>
					<div className="text-xs font-medium text-white drop-shadow-md mt-1.5 text-center">
						Weather
					</div>
				</>
			)}
		</div>
	);
}

export default memo(Widget);
