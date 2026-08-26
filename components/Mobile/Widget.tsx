'use client';

import { useState, useEffect, memo } from 'react';
import { getBatteryInfo } from '../../utils/deviceInfo';

interface WidgetProps {
	type?: 'battery' | 'calendar' | 'weather';
}

function Widget({ type = 'battery' }: WidgetProps) {
	const [batteryLevel, setBatteryLevel] = useState<number>(100);

	useEffect(() => {
		if (type === 'battery') {
			async function updateBattery() {
				const battery = await getBatteryInfo();
				if (battery) {
					setBatteryLevel(Math.round(battery.level * 100));
				}
			}
			updateBattery();

			// Reduced from 60 seconds to 5 minutes - battery level changes slowly
			const interval = setInterval(updateBattery, 300000);
			return () => clearInterval(interval);
		}
	}, [type]);

	return (
		<div className="ios-widget w-full h-full flex flex-col">
			{type === 'battery' && (
				<>
					{/* Widget Box (only wraps the grid) */}
					<div className="ios-widget-box w-full flex-1 p-3">
						{/* Grid Layout: 2x2 */}
						<div className="grid grid-cols-2 gap-3 h-full">
							{/* Top Left: Battery Icon (1 box) */}
							<div className="w-full aspect-square flex items-center justify-center">
								<div className="relative flex items-center justify-center">
									{/* Green Circle Outline */}
									<div className="absolute w-16 h-16 rounded-full border-4 border-green-500"></div>
									{/* Battery Icon */}
									<div className="relative flex items-center justify-center">
										{/* Battery Body (grey rectangle) */}
										<div className="w-8 h-5 bg-gray-400 rounded-sm relative">
											{/* Battery Top (darker grey square) */}
											<div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-2.5 bg-gray-600 rounded-r-sm"></div>
										</div>
									</div>
								</div>
							</div>
							{/* Top Right: Empty */}
							<div></div>
							{/* Bottom: Battery Percentage (2 boxes) */}
							<div className="col-span-2 flex items-center justify-center">
								<div className="text-5xl font-semibold text-white drop-shadow-md">
									{batteryLevel}%
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
				<div className="flex flex-col">
					<div className="text-lg font-semibold text-gray-900">TUE 9</div>
					<div className="text-sm text-gray-600">Calendar</div>
				</div>
			)}
			{type === 'weather' && (
				<div className="flex flex-col">
					<div className="text-2xl font-semibold text-gray-900">72°</div>
					<div className="text-sm text-gray-600">Sunny</div>
				</div>
			)}
		</div>
	);
}

export default memo(Widget);
