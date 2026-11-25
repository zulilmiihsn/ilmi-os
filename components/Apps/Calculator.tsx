'use client';

import { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Delete } from 'lucide-react';
import { calculateResult, formatCalcNumber, formatOperatorSymbol } from './Calculator/calculate';
import { useSettingsStore } from '../../stores/settings';
import { triggerHaptic } from '../../utils/haptic';

interface LastOperation {
	op: string;
	operand: number;
}

function isEditableElement(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

function Calculator() {
	const [display, setDisplay] = useState('0');
	const [previousValue, setPreviousValue] = useState<number | null>(null);
	const [operation, setOperation] = useState<string | null>(null);
	const [waitingForNewValue, setWaitingForNewValue] = useState(false);
	const [calculationHistory, setCalculationHistory] = useState<string>('');
	const [lastOperation, setLastOperation] = useState<LastOperation | null>(null);

	const { darkMode } = useSettingsStore();

	// Format display value
	const formattedDisplay = useMemo(() => {
		return formatCalcNumber(display);
	}, [display]);

	const inputNumber = useCallback(
		(num: string) => {
			triggerHaptic('light');
			setLastOperation(null);
			if (waitingForNewValue || display === 'Error') {
				setDisplay(num === '.' ? '0.' : num);
				setWaitingForNewValue(false);
			} else {
				if (num === '.' && display.includes('.')) return;
				if (num === '.' && display === '0') {
					setDisplay('0.');
				} else {
					setDisplay(display === '0' ? num : display + num);
				}
			}
		},
		[display, waitingForNewValue]
	);

	const calculate = useCallback((): number | 'Error' => {
		if (previousValue === null) return parseFloat(display);
		return calculateResult(previousValue, parseFloat(display), operation ?? '');
	}, [previousValue, display, operation]);

	const inputOperation = useCallback(
		(op: string) => {
			triggerHaptic('medium');
			if (display === 'Error') return;
			setLastOperation(null);
			const symbol = formatOperatorSymbol(op);

			// Swap operator without re-evaluating when user taps two operators in a row.
			if (waitingForNewValue && previousValue !== null) {
				setOperation(op);
				setCalculationHistory(`${formatCalcNumber(previousValue)} ${symbol}`);
				return;
			}

			const inputValue = parseFloat(display);

			if (previousValue === null) {
				setPreviousValue(inputValue);
				setCalculationHistory(`${formatCalcNumber(display)} ${symbol}`);
			} else if (operation) {
				const result = calculate();
				if (result === 'Error') {
					setDisplay('Error');
					setPreviousValue(null);
					setOperation(null);
					setCalculationHistory('');
					setWaitingForNewValue(true);
					return;
				}
				setDisplay(String(result));
				setPreviousValue(result);
				setCalculationHistory(`${formatCalcNumber(result)} ${symbol}`);
			} else {
				setCalculationHistory(`${formatCalcNumber(display)} ${symbol}`);
			}

			setWaitingForNewValue(true);
			setOperation(op);
		},
		[display, previousValue, operation, waitingForNewValue, calculate]
	);

	const performCalculation = useCallback(() => {
		triggerHaptic('medium');
		if (display === 'Error') return;

		if (operation && previousValue !== null) {
			const currentOperand = parseFloat(display);
			const result = calculate();
			const symbol = formatOperatorSymbol(operation);
			if (result === 'Error') {
				setDisplay('Error');
				setCalculationHistory('');
				setLastOperation(null);
			} else {
				setDisplay(String(result));
				setCalculationHistory(
					`${formatCalcNumber(previousValue)} ${symbol} ${formatCalcNumber(currentOperand)} =`
				);
				setLastOperation({ op: operation, operand: currentOperand });
			}
			setPreviousValue(null);
			setOperation(null);
			setWaitingForNewValue(true);
		} else if (lastOperation) {
			const currentVal = parseFloat(display);
			const result = calculateResult(currentVal, lastOperation.operand, lastOperation.op);
			const symbol = formatOperatorSymbol(lastOperation.op);
			if (result === 'Error') {
				setDisplay('Error');
				setCalculationHistory('');
				setLastOperation(null);
			} else {
				setDisplay(String(result));
				setCalculationHistory(
					`${formatCalcNumber(currentVal)} ${symbol} ${formatCalcNumber(lastOperation.operand)} =`
				);
			}
			setWaitingForNewValue(true);
		}
	}, [display, operation, previousValue, calculate, lastOperation]);

	const clear = useCallback(() => {
		triggerHaptic('light');
		setDisplay('0');
		setPreviousValue(null);
		setOperation(null);
		setWaitingForNewValue(false);
		setCalculationHistory('');
		setLastOperation(null);
	}, []);

	const handlePercentage = useCallback(() => {
		triggerHaptic('light');
		if (display === 'Error') return;
		const currentValue = parseFloat(display);
		const result = currentValue / 100;
		setDisplay(String(result));
	}, [display]);

	const handlePlusMinus = useCallback(() => {
		triggerHaptic('light');
		if (display === 'Error') return;
		const currentValue = parseFloat(display);
		const result = currentValue * -1;
		setDisplay(String(result));
	}, [display]);

	const backspace = useCallback(() => {
		triggerHaptic('light');
		if (display === 'Error') {
			setDisplay('0');
		} else if (display.length > 1) {
			const next = display.slice(0, -1);
			setDisplay(next === '-' ? '0' : next);
		} else {
			setDisplay('0');
		}
	}, [display]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if (isEditableElement(e.target)) return;

			if (e.key >= '0' && e.key <= '9') {
				e.preventDefault();
				inputNumber(e.key);
			} else if (e.key === '.') {
				e.preventDefault();
				inputNumber('.');
			} else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
				e.preventDefault();
				inputOperation(e.key);
			} else if (e.key === 'Enter' || e.key === '=') {
				e.preventDefault();
				performCalculation();
			} else if (e.key === 'Backspace') {
				e.preventDefault();
				backspace();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				clear();
			} else if (e.key === '%') {
				e.preventDefault();
				handlePercentage();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [inputNumber, inputOperation, performCalculation, backspace, clear, handlePercentage]);

	// iOS 26 Liquid Glass Button Classes
	const btnBase =
		'aspect-square rounded-full flex items-center justify-center font-medium text-2xl select-none active:scale-90 transition-transform duration-100 shadow-xs';
	const btnNumber = darkMode
		? 'bg-[#2c2c2e]/90 text-white border border-white/10 active:bg-white/30'
		: 'bg-white text-black border border-black/5 active:bg-gray-200';
	const btnFunction = darkMode
		? 'bg-[#505054]/80 text-white border border-white/15 active:bg-white/40'
		: 'bg-[#d2d2d7]/80 text-black border border-black/5 active:bg-gray-300';
	const btnOperator = 'bg-[#ff9f0a] text-white border border-white/20 active:brightness-110';
	const btnOperatorActive = darkMode
		? 'bg-white text-[#ff9f0a] shadow-[0_0_15px_rgba(255,159,10,0.5)]'
		: 'ring-2 ring-ios-orange bg-ios-orange/15 text-ios-orange';

	return (
		<div
			className={`calculator-app flex flex-col justify-end h-full overflow-y-auto font-sans px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-4 select-none ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			{/* Display Area */}
			<div className="flex-1 min-h-[72px] flex flex-col justify-end items-end px-3 mb-4 max-w-[330px] mx-auto w-full">
				{calculationHistory && (
					<div className="text-gray-500 dark:text-gray-400 text-lg font-normal mb-1 tracking-tight tabular-nums">
						{calculationHistory}
					</div>
				)}
				<div
					className="text-right font-light tracking-tighter leading-none overflow-x-auto w-full scrollbar-hide tabular-nums"
					style={{
						fontSize:
							formattedDisplay.length > 8
								? '2.25rem'
								: formattedDisplay.length > 5
									? '3rem'
									: '3.75rem',
					}}
				>
					{formattedDisplay}
				</div>
			</div>

			{/* iOS 26 Keypad Grid */}
			<div className="grid grid-cols-4 gap-2.5 max-w-[330px] mx-auto w-full shrink-0">
				{/* Row 1 */}
				<button
					type="button"
					className={`${btnBase} ${btnFunction}`}
					onClick={clear}
					aria-label={display !== '0' ? 'Clear' : 'All clear'}
				>
					{display !== '0' ? 'C' : 'AC'}
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnFunction}`}
					onClick={handlePlusMinus}
					aria-label="Toggle sign"
				>
					±
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnFunction}`}
					onClick={handlePercentage}
					aria-label="Percent"
				>
					%
				</button>
				<button
					type="button"
					className={`${btnBase} ${operation === '/' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('/')}
					aria-label="Divide"
					aria-pressed={operation === '/'}
				>
					÷
				</button>

				{/* Row 2 */}
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('7')}
				>
					7
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('8')}
				>
					8
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('9')}
				>
					9
				</button>
				<button
					type="button"
					className={`${btnBase} ${operation === '*' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('*')}
					aria-label="Multiply"
					aria-pressed={operation === '*'}
				>
					×
				</button>

				{/* Row 3 */}
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('4')}
				>
					4
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('5')}
				>
					5
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('6')}
				>
					6
				</button>
				<button
					type="button"
					className={`${btnBase} ${operation === '-' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('-')}
					aria-label="Subtract"
					aria-pressed={operation === '-'}
				>
					−
				</button>

				{/* Row 4 */}
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('1')}
				>
					1
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('2')}
				>
					2
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('3')}
				>
					3
				</button>
				<button
					type="button"
					className={`${btnBase} ${operation === '+' ? btnOperatorActive : btnOperator}`}
					onClick={() => inputOperation('+')}
					aria-label="Add"
					aria-pressed={operation === '+'}
				>
					+
				</button>

				{/* Row 5 */}
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={backspace}
					aria-label="Backspace"
				>
					<Delete aria-hidden="true" size={20} />
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('0')}
				>
					0
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnNumber}`}
					onClick={() => inputNumber('.')}
					aria-label="Decimal point"
				>
					.
				</button>
				<button
					type="button"
					className={`${btnBase} ${btnOperator}`}
					onClick={performCalculation}
					aria-label="Equals"
				>
					=
				</button>
			</div>
		</div>
	);
}

export default memo(Calculator);
