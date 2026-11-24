'use client';

import type React from 'react';
import { Search, Signal, SlidersHorizontal, Wifi } from 'lucide-react';
import DesktopClock from '../DesktopClock';

interface SystemTrayProps {
	isSpotlightOpen: boolean;
	onToggleSpotlight: () => void;
	isWifi: boolean;
	batteryCharging: boolean;
	batteryColor: string;
	batteryFillWidth: number;
	onToggleControlCenter: (e: React.MouseEvent) => void;
}

export default function SystemTray({
	isSpotlightOpen,
	onToggleSpotlight,
	isWifi,
	batteryCharging,
	batteryColor,
	batteryFillWidth,
	onToggleControlCenter,
}: SystemTrayProps) {
	return (
		<div className="flex items-center gap-2.5 text-black dark:text-white">
			<button
				className={`w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70 ${isSpotlightOpen ? 'bg-gray-200/50 dark:bg-gray-700/50' : ''}`}
				aria-label="Search"
				onClick={onToggleSpotlight}
			>
				<Search aria-hidden="true" size={12} />
			</button>
			<button
				className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70"
				aria-label="Wi-Fi"
			>
				{isWifi ? <Wifi aria-hidden="true" size={12} /> : <Signal aria-hidden="true" size={12} />}
			</button>
			{/* Battery */}
			<div className="flex items-center gap-px">
				<div className="relative flex items-center">
					{/* Battery Body */}
					<div className="w-[22px] h-[10px] border border-black/30 dark:border-white/30 rounded-[2.6px] p-px relative">
						{/* Battery Fill */}
						<div
							className={`h-full rounded-[1.5px] transition-all duration-300 ${
								batteryCharging ? 'bg-green-500' : ''
							}`}
							style={{
								width: `${batteryFillWidth}%`,
								backgroundColor: batteryCharging ? 'var(--color-ios-green)' : batteryColor,
							}}
						></div>

						{/* Charging Bolt */}
						{batteryCharging && (
							<div className="absolute inset-0 flex items-center justify-center">
								<svg
									className="w-2.5 h-2.5 text-white drop-shadow-sm"
									viewBox="0 0 24 24"
									fill="currentColor"
								>
									<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
								</svg>
							</div>
						)}
					</div>
					{/* Battery Terminal (Cap) */}
					<div className="w-[1.5px] h-[4px] bg-black/30 dark:bg-white/30 rounded-r-[1px] translate-x-[-0.5px]"></div>
				</div>
			</div>
			<button
				type="button"
				className="w-5 h-5 flex items-center justify-center rounded transition-opacity hover:opacity-70 relative z-70 cursor-pointer"
				onClick={onToggleControlCenter}
				aria-label="Control Center"
			>
				<SlidersHorizontal aria-hidden="true" size={12} className="pointer-events-none" />
			</button>
			{/* Date and Time */}
			<DesktopClock />
		</div>
	);
}
