'use client';

interface ClockNavBarProps {
	activeTab: 'world' | 'alarms' | 'stopwatch' | 'timers';
	isEditingCities: boolean;
	isEditingAlarms: boolean;
	alarmsCount: number;
	onToggleEditCities: () => void;
	onOpenCityPicker: () => void;
	onToggleEditAlarms: () => void;
	onOpenAddAlarm: () => void;
	theme: {
		header: string;
		text: string;
	};
}

export default function ClockNavBar({
	activeTab,
	isEditingCities,
	isEditingAlarms,
	alarmsCount,
	onToggleEditCities,
	onOpenCityPicker,
	onToggleEditAlarms,
	onOpenAddAlarm,
	theme,
}: ClockNavBarProps) {
	return (
		<div
			className={`px-4 pt-3 pb-2 border-b z-10 backdrop-blur-md sticky top-0 transition-colors ${theme.header}`}
		>
			{activeTab === 'world' && (
				<>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={onToggleEditCities}
							className="relative text-[#ff9f0a] text-base font-medium after:absolute after:-inset-y-2.5 after:content-['']"
							aria-label="Edit cities"
						>
							{isEditingCities ? 'Done' : 'Edit'}
						</button>
						<button
							type="button"
							onClick={onOpenCityPicker}
							className="relative text-[#ff9f0a] text-2xl font-light leading-none after:absolute after:-inset-2.5 after:content-['']"
							aria-label="Add city"
						>
							+
						</button>
					</div>
					<h1 className={`${theme.text} text-ios-large-title`}>World Clock</h1>
				</>
			)}
			{activeTab === 'alarms' && (
				<>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={onToggleEditAlarms}
							disabled={alarmsCount === 0}
							className="relative text-[#ff9f0a] text-base font-medium disabled:opacity-0 after:absolute after:-inset-y-2.5 after:content-['']"
							aria-label={isEditingAlarms ? 'Done editing alarms' : 'Edit alarms'}
						>
							{isEditingAlarms ? 'Done' : 'Edit'}
						</button>
						<button
							type="button"
							onClick={onOpenAddAlarm}
							className="relative text-[#ff9f0a] text-2xl font-light leading-none after:absolute after:-inset-2.5 after:content-['']"
							aria-label="Add alarm"
						>
							+
						</button>
					</div>
					<h1 className={`${theme.text} text-ios-large-title`}>Alarms</h1>
				</>
			)}
			{activeTab === 'stopwatch' && (
				<h1 className={`${theme.text} text-ios-large-title`}>Stopwatch</h1>
			)}
			{activeTab === 'timers' && <h1 className={`${theme.text} text-ios-large-title`}>Timer</h1>}
		</div>
	);
}
