'use client';

import { useState, useCallback, useMemo, memo } from 'react';

function Calculator() {
	const [display, setDisplay] = useState('0');

	const [previousValue, setPreviousValue] = useState<number | null>(null);
	const [operation, setOperation] = useState<string | null>(null);
	const [waitingForNewValue, setWaitingForNewValue] = useState(false);
	const [calculationHistory, setCalculationHistory] = useState<string>('');

	// Format number with commas
	const formatNumber = useCallback((num: string | number): string => {
		if (typeof num === 'string') {
			// Handle decimal numbers
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
			if (waitingForNewValue) {
				setDisplay(num);
				setWaitingForNewValue(false);
			} else {
				// Prevent multiple decimal points
				if (num === '.' && display.includes('.')) {
					return;
				}
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
		if (operation && previousValue !== null) {
			const result = calculate();
			const formattedResult = String(result);
			setDisplay(formattedResult);
			// Clear history after calculation (iOS style)
			setCalculationHistory('');
			setPreviousValue(null);
			setOperation(null);
			setWaitingForNewValue(true);
		}
	}, [operation, previousValue, calculate]);

	const clear = useCallback(() => {
		setDisplay('0');
		setPreviousValue(null);
		setOperation(null);
		setWaitingForNewValue(false);
		setCalculationHistory('');
	}, []);

	const handleBackspace = useCallback(() => {
		if (display.length > 1) {
			setDisplay(display.slice(0, -1));
		} else {
			setDisplay('0');
		}
	}, [display]);

	const handlePercentage = useCallback(() => {
		const value = parseFloat(display);
		setDisplay(String(value / 100));
	}, [display]);

	const handlePlusMinus = useCallback(() => {
		if (display !== '0') {
			setDisplay(String(parseFloat(display) * -1));
		}
	}, [display]);

	// Theme Colors - Calculator on iOS is always dark styled
	const theme = {
		bg: 'bg-black',
		text: 'text-white',
		historyText: 'text-gray-400',
		btnFunction: 'bg-ios-calc-func text-black',
		btnNumber: 'bg-ios-calc-num text-white',
		btnOperator: 'bg-ios-orange text-white',
		btnOperatorActive: 'bg-white text-ios-orange',
	};

	return (
		<div
			className={`calculator w-full h-full flex flex-col overflow-hidden transition-colors duration-300 ${theme.bg}`}
			style={{
				fontFamily:
					'-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
				paddingTop: 'env(safe-area-inset-top, 0px)',
			}}
		>
			{/* Display Area */}
			<div className="display-area flex-1 flex flex-col justify-end px-8 pb-8 min-h-0">
				{/* Calculation History */}
				{calculationHistory && !waitingForNewValue && (
					<div className={`${theme.historyText} text-4xl mb-4 text-right font-medium`}>
						{calculationHistory}
					</div>
				)}
				{/* Current Display */}
				<div
					className={`${theme.text} text-8xl sm:text-9xl font-medium text-right leading-none overflow-x-auto`}
				>
					{formattedDisplay}
				</div>
			</div>

			{/* Button Grid */}
			<div className="buttons grid grid-cols-4 gap-5 p-6 pb-24">
				{/* Row 1 */}
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity flex items-center justify-center ${theme.btnFunction}`}
					onClick={handleBackspace}
					aria-label="Backspace"
				>
					<svg
						className="w-7 h-7"
						fill="currentColor"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.11c.36.53.9.89 1.59.89h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7.07L2.4 12l4.67-7H22v14z" />
						<path d="M15.5 17l-5-5 5-5 1.41 1.41L12.82 12l4.09 4.59L15.5 17z" />
					</svg>
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnFunction}`}
					onClick={clear}
				>
					AC
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnFunction}`}
					onClick={handlePercentage}
				>
					%
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-70 transition-opacity ${operation === '/' ? theme.btnOperatorActive : theme.btnOperator
						}`}
					onClick={() => inputOperation('/')}
				>
					÷
				</button>

				{/* Row 2 */}
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('7')}
				>
					7
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('8')}
				>
					8
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('9')}
				>
					9
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-70 transition-opacity ${operation === '*' ? theme.btnOperatorActive : theme.btnOperator
						}`}
					onClick={() => inputOperation('*')}
				>
					×
				</button>

				{/* Row 3 */}
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('4')}
				>
					4
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('5')}
				>
					5
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('6')}
				>
					6
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-70 transition-opacity ${operation === '-' ? theme.btnOperatorActive : theme.btnOperator
						}`}
					onClick={() => inputOperation('-')}
				>
					−
				</button>

				{/* Row 4 */}
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('1')}
				>
					1
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('2')}
				>
					2
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('3')}
				>
					3
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-70 transition-opacity ${operation === '+' ? theme.btnOperatorActive : theme.btnOperator
						}`}
					onClick={() => inputOperation('+')}
				>
					+
				</button>

				{/* Row 5 */}
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={handlePlusMinus}
				>
					±
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('0')}
				>
					0
				</button>
				<button
					className={`calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-50 transition-opacity ${theme.btnNumber}`}
					onClick={() => inputNumber('.')}
				>
					.
				</button>
				<button
					className="calc-button aspect-square rounded-full text-4xl font-semibold active:opacity-70 transition-opacity bg-[#FF9500] text-white"
					onClick={performCalculation}
				>
					=
				</button>
			</div>
		</div>
	);
}

export default memo(Calculator);

