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
			className={`clock-app relative w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${state.theme.bg} ${state.theme.text}`}
			style={{
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
				paddingTop: 'env(safe-area-inset-top, 0px)',
			}}
		>
			<ClockNavBar
				activeTab={state.activeTab}
				isEditingCities={state.isEditingCities}
				isEditingAlarms={state.isEditingAlarms}
				alarmsCount={state.alarms.length}
				onToggleEditCities={() => state.setIsEditingCities(prev => !prev)}
				onOpenCityPicker={() => state.setShowCityPicker(true)}
				onToggleEditAlarms={() => {
					state.setIsEditingAlarms(prev => !prev);
					state.setDeletableAlarmId(null);
				}}
				onOpenAddAlarm={() => {
					state.setIsEditingAlarms(false);
					state.setShowAddAlarm(true);
				}}
				theme={state.theme}
			/>

			<div
				className="flex-1 overflow-y-auto overflow-x-hidden pb-24"
				onScroll={() => state.setDeletableAlarmId(null)}
			>
				{state.activeTab === 'world' && (
					<ClockWorldTab
						cityTimes={state.cityTimes}
						theme={state.theme}
						isEditingCities={state.isEditingCities}
						onRemoveCity={state.handleRemoveCity}
					/>
				)}

				{state.activeTab === 'alarms' && (
					<ClockAlarmsTab
						alarms={state.alarms}
						isEditingAlarms={state.isEditingAlarms}
						showAddAlarm={state.showAddAlarm}
						deletableAlarmId={state.deletableAlarmId}
						deletingAlarmId={state.deletingAlarmId}
						onToggleAlarm={state.handleToggleAlarm}
						onDeleteAlarm={state.handleDeleteAlarm}
						onAddAlarm={state.handleAddAlarm}
						onCloseAddAlarm={() => state.setShowAddAlarm(false)}
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
						formatStopwatchTime={state.formatStopwatchTime}
						onStartStop={state.handleStopwatchStartStop}
						onReset={state.handleStopwatchReset}
						onLap={state.handleLap}
						theme={state.theme}
					/>
				)}

				{state.activeTab === 'timers' && (
					<ClockTimerTab
						timerHours={state.timerHours}
						timerMinutes={state.timerMinutes}
						timerSeconds={state.timerSeconds}
						timerRunning={state.timerRunning}
						timerRemaining={state.timerRemaining}
						timerTotalMs={state.timerTotalMs}
						timerCompleted={state.timerCompleted}
						resetKey={state.resetKey}
						formatTimerTime={state.formatTimerTime}
						onHoursChange={state.setTimerHours}
						onMinutesChange={state.setTimerMinutes}
						onSecondsChange={state.setTimerSeconds}
						onStart={state.handleTimerStart}
						onReset={state.handleTimerReset}
						onDismissCompleted={() => state.setTimerCompleted(false)}
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
