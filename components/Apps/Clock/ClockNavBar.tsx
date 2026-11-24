'use client';

interface ClockNavBarProps {
	activeTab: 'world' | 'alarms' | 'stopwatch' | 'timers';
	isEditingCities: boolean;
	alarmsCount: number;
	onToggleEditCities: () => void;
	onOpenCityPicker: () => void;
	onClearAlarms: () => void;
	onAddAlarm: () => void;
	theme: {
		header: string;
		text: string;
	};
}

export default function ClockNavBar({
	activeTab,
	isEditingCities,
	alarmsCount,
	onToggleEditCities,
	onOpenCityPicker,
	onClearAlarms,
	onAddAlarm,
	theme,
}: ClockNavBarProps) {
	return (
		<div
			className={`px-4 pt-10 pb-2 border-b z-10 backdrop-blur-md sticky top-0 transition-colors ${theme.header}`}
		>
			{activeTab === 'world' && (
				<>
					<div className="flex items-center justify-between">
						<button
							onClick={onToggleEditCities}
							className={`relative ${theme.text} text-[#ff9f0a] text-base font-medium after:absolute after:-inset-y-2.5 after:content-['']`}
							aria-label="Edit cities"
						>
							{isEditingCities ? 'Done' : 'Edit'}
						</button>
						<button
							onClick={onOpenCityPicker}
							className={`relative ${theme.text} text-[#ff9f0a] text-2xl font-light leading-none after:absolute after:-inset-2.5 after:content-['']`}
							aria-label="Add city"
						>
							+
						</button>
					</div>
					<h1 className={`${theme.text} text-ios-large-title animate-slide-bottom`}>World Clock</h1>
				</>
			)}
			{activeTab === 'alarms' && (
				<>
					<div className="flex items-center justify-between">
						<button
							onClick={onClearAlarms}
							className={`relative ${theme.text} text-[#ff9f0a] text-base font-medium after:absolute after:-inset-y-2.5 after:content-['']`}
							aria-label="Clear all alarms"
						>
							{alarmsCount > 0 ? 'Clear' : ''}
						</button>
						<button
							onClick={onAddAlarm}
							className={`relative ${theme.text} text-[#ff9f0a] text-2xl font-light leading-none after:absolute after:-inset-2.5 after:content-['']`}
							aria-label="Add alarm"
						>
							+
						</button>
					</div>
					<h1 className={`${theme.text} text-ios-large-title animate-slide-bottom`}>Alarms</h1>
				</>
			)}
			{activeTab === 'stopwatch' && (
				<h1 className={`${theme.text} text-ios-large-title animate-slide-bottom`}>Stopwatch</h1>
			)}
			{activeTab === 'timers' && (
				<h1 className={`${theme.text} text-ios-large-title animate-slide-bottom`}>Timer</h1>
			)}
		</div>
	);
}
