'use client';

import { memo } from 'react';
import ClockWorldTab from './ClockWorldTab';
import ClockAlarmsTab from './ClockAlarmsTab';
import ClockStopwatchTab from './ClockStopwatchTab';
import ClockTimerTab from './ClockTimerTab';
import ClockTabBar from './ClockTabBar';
import ClockNavBar from './ClockNavBar';
import CityPickerModal from './CityPickerModal';
import { useClockState } from './useClockState';

function Clock() {
	const state = useClockState();

	return (
		<div
			className={`clock-app w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${state.theme.bg} ${state.theme.text}`}
			style={{
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
				paddingTop: 'env(safe-area-inset-top, 0px)',
			}}
		>
			<ClockNavBar
				activeTab={state.activeTab}
				isEditingCities={state.isEditingCities}
				alarmsCount={state.alarms.length}
				onToggleEditCities={() => state.setIsEditingCities(prev => !prev)}
				onOpenCityPicker={() => state.setShowCityPicker(true)}
				onClearAlarms={() => {
					if (state.alarms.length > 0) {
						state.setAlarms([]);
						state.setDeletableAlarmId(null);
					}
				}}
				onAddAlarm={state.handleAddAlarm}
				theme={state.theme}
			/>

			<div
				className="flex-1 overflow-y-auto overflow-x-hidden"
				onScroll={() => state.setDeletableAlarmId(null)}
			>
				{state.activeTab === 'world' && (
					<ClockWorldTab
						cityTimes={state.cityTimes}
						direction={state.direction}
						theme={state.theme}
						isEditingCities={state.isEditingCities}
						onRemoveCity={state.handleRemoveCity}
					/>
				)}

				{state.activeTab === 'alarms' && (
					<ClockAlarmsTab
						alarms={state.alarms}
						direction={state.direction}
						deletableAlarmId={state.deletableAlarmId}
						deletingAlarmId={state.deletingAlarmId}
						onToggleAlarm={state.handleToggleAlarm}
						onDeleteAlarm={state.handleDeleteAlarm}
						onPressStart={state.handlePressStart}
						onPressEnd={state.handlePressEnd}
						onClearDeletable={() => state.setDeletableAlarmId(null)}
						theme={state.theme}
					/>
				)}

				{state.activeTab === 'stopwatch' && (
					<ClockStopwatchTab
						stopwatchTime={state.stopwatchTime}
						stopwatchRunning={state.stopwatchRunning}
						lapTimes={state.lapTimes}
						resetKey={state.resetKey}
						direction={state.direction}
						formatStopwatchTime={state.formatStopwatchTime}
						onStartStop={state.handleStopwatchStartStop}
						onReset={state.handleStopwatchReset}
						onLap={state.handleLap}
						theme={state.theme}
					/>
				)}

				{state.activeTab === 'timers' && (
					<ClockTimerTab
						timerMinutes={state.timerMinutes}
						timerSeconds={state.timerSeconds}
						timerRunning={state.timerRunning}
						timerRemaining={state.timerRemaining}
						resetKey={state.resetKey}
						direction={state.direction}
						formatTimerTime={state.formatTimerTime}
						onMinutesChange={state.setTimerMinutes}
						onSecondsChange={state.setTimerSeconds}
						onStart={state.handleTimerStart}
						onReset={state.handleTimerReset}
						theme={state.theme}
					/>
				)}
			</div>

			<ClockTabBar activeTab={state.activeTab} onTabChange={state.handleTabChange} />

			<CityPickerModal
				isOpen={state.showCityPicker}
				availableChoices={state.availableChoices}
				onClose={() => state.setShowCityPicker(false)}
				onAddCity={state.handleAddCity}
			/>
		</div>
	);
}

export default memo(Clock);
