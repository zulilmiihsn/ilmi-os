'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';

function Calculator() {
	const [display, setDisplay] = useState('0');
	const [previousValue, setPreviousValue] = useState<number | null>(null);
	const [operation, setOperation] = useState<string | null>(null);
	const [waitingForNewValue, setWaitingForNewValue] = useState(false);
	const [calculationHistory, setCalculationHistory] = useState<string>('');

	const { darkMode } = useSettingsStore();

	// Format number with commas
	const formatNumber = useCallback((num: string | number): string => {
		if (typeof num === 'string') {
			if (num.includes('.')) {
				const [integer, decimal] = num.split('.');
				return `${parseFloat(integer).toLocaleString('en-US')}.${decimal}`;
			}
			return parseFloat(num).toLocaleString('en-US');
		}
		return num.toLocaleString('en-US');
	}, []);

	// Format display value
	const formattedDisplay = useMemo(() => {
		return formatNumber(display);
	}, [display, formatNumber]);

	const inputNumber = useCallback(
		(num: string) => {
			triggerHaptic('light');
			if (waitingForNewValue) {
				setDisplay(num);
				setWaitingForNewValue(false);
			} else {
				if (num === '.' && display.includes('.')) return;
				setDisplay(display === '0' ? num : display + num);
			}
		},
		[display, waitingForNewValue]
	);

	const calculate = useCallback((): number => {
		if (previousValue === null) return parseFloat(display);
		const currentValue = parseFloat(display);

		switch (operation) {
			case '+':
				return previousValue + currentValue;
			case '-':
				return previousValue - currentValue;
			case '*':
				return previousValue * currentValue;
			case '/':
				return currentValue !== 0 ? previousValue / currentValue : 0;
			default:
				return currentValue;
		}
	}, [previousValue, display, operation]);

	const inputOperation = useCallback(
		(op: string) => {
			triggerHaptic('medium');
			const inputValue = parseFloat(display);

			if (previousValue === null) {
				setPreviousValue(inputValue);
				setCalculationHistory(`${formatNumber(display)}${op}`);
			} else if (operation) {
				const result = calculate();
				setDisplay(String(result));
				setPreviousValue(result);
				setCalculationHistory(`${formatNumber(result)}${op}`);
			} else {
				setCalculationHistory(`${formatNumber(display)}${op}`);
			}

			setWaitingForNewValue(true);
			setOperation(op);
		},
		[display, previousValue, operation, formatNumber, calculate]
	);

	const performCalculation = useCallback(() => {
		triggerHaptic('medium');
		if (operation && previousValue !== null) {
			const result = calculate();
			const formattedResult = String(result);
			setDisplay(formattedResult);
			setCalculationHistory('');
			setPreviousValue(null);
			setOperation(null);
			setWaitingForNewValue(true);
		}
	}, [operation, previousValue, calculate]);

	const clear = useCallback(() => {
		triggerHaptic('light');
		setDisplay('0');
		setPreviousValue(null);
		setOperation(null);
		setWaitingForNewValue(false);
		setCalculationHistory('');
	}, []);

	const handlePercentage = useCallback(() => {
		triggerHaptic('light');
		const currentValue = parseFloat(display);
		const result = currentValue / 100;
		setDisplay(String(result));
	}, [display]);

	const handlePlusMinus = useCallback(() => {
		triggerHaptic('light');
		const currentValue = parseFloat(display);
		const result = currentValue * -1;
		setDisplay(String(result));
	}, [display]);

	const backspace = useCallback(() => {
		triggerHaptic('light');
		if (display.length > 1) {
			setDisplay(display.slice(0, -1));
		} else {
			setDisplay('0');
		}
	}, [display]);

	// iOS 26 Liquid Glass Button Classes
	const btnBase = 'calc-button aspect-square rounded-full flex items-center justify-center font-medium text-3xl select-none active:scale-90 transition-transform duration-100 shadow-xs';
	const btnNumber = darkMode
		? 'bg-[#2c2c2e]/90 text-white border border-white/10 active:bg-white/30'
		: 'bg-white text-black border border-black/5 active:bg-gray-200';
	const btnFunction = darkMode
		? 'bg-[#505054]/80 text-white border border-white/15 active:bg-white/40'
		: 'bg-[#d2d2d7]/80 text-black border border-black/5 active:bg-gray-300';
	const btnOperator = 'bg-[#ff9f0a] text-white border border-white/20 active:brightness-110';
	const btnOperatorActive = 'bg-white text-[#ff9f0a] shadow-[0_0_15px_rgba(255,159,10,0.5)]';

	return (
		<div className={`calculator-app flex flex-col justify-end h-full px-5 pb-10 pt-10 select-none ${
			darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
		}`}>
			{/* Display Area */}
			<div className="flex-1 flex flex-col justify-end items-end px-3 mb-6">
				{calculationHistory && (
					<div className="text-gray-400 text-lg font-normal mb-1 tracking-tight">
						{calculationHistory}
					</div>
				)}
				<div
					className="text-right font-light tracking-tighter leading-none overflow-x-auto w-full scrollbar-none"
					style={{
						fontSize: formattedDisplay.length > 8 ? '2.5rem' : formattedDisplay.length > 5 ? '3.5rem' : '4.5rem',
					}}
				>
					{formattedDisplay}
				</div>
			</div>

			{/* iOS 26 Keypad Grid */}
			<div className="grid grid-cols-4 gap-3.5 max-w-[360px] mx-auto w-full">
				{/* Row 1 */}
				<button className={`${btnBase} ${btnFunction}`} onClick={clear}>
					{display !== '0' ? 'C' : 'AC'}
				</button>
				<button className={`${btnBase} ${btnFunction}`} onClick={handlePlusMinus}>
					±
				</button>
				<button className={`${btnBase} ${btnFunction}`} onClick={handlePercentage}>
					%
				</button>
				<button
					className={`${btnBase} ${operation === '/' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('/')}
				>
					÷
				</button>

				{/* Row 2 */}
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('7')}>
					7
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('8')}>
					8
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('9')}>
					9
				</button>
				<button
					className={`${btnBase} ${operation === '*' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('*')}
				>
					×
				</button>

				{/* Row 3 */}
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('4')}>
					4
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('5')}>
					5
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('6')}>
					6
				</button>
				<button
					className={`${btnBase} ${operation === '-' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('-')}
				>
					−
				</button>

				{/* Row 4 */}
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('1')}>
					1
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('2')}>
					2
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('3')}>
					3
				</button>
				<button
					className={`${btnBase} ${operation === '+' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('+')}
				>
					+
				</button>

				{/* Row 5 */}
				<button className={`${btnBase} ${btnNumber}`} onClick={backspace} aria-label="Backspace">
					<i className="fas fa-delete-left text-xl"></i>
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('0')}>
					0
				</button>
				<button className={`${btnBase} ${btnNumber}`} onClick={() => inputNumber('.')}>
					.
				</button>
				<button className={`${btnBase} ${btnOperator}`} onClick={performCalculation}>
					=
				</button>
			</div>
		</div>
	);
}

export default memo(Calculator);
