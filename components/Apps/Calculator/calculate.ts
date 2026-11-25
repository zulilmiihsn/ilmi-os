/** Pure arithmetic & formatting core, extracted from Calculator.tsx for unit testing (no React). */

export type CalcResult = number | 'Error';

export function calculateResult(previous: number, current: number, operation: string): CalcResult {
	switch (operation) {
		case '+':
			return previous + current;
		case '-':
			return previous - current;
		case '*':
			return previous * current;
		case '/':
			return current !== 0 ? previous / current : 'Error';
		default:
			return current;
	}
}

export function formatOperatorSymbol(operation: string): string {
	switch (operation) {
		case '*':
			return '×';
		case '/':
			return '÷';
		case '-':
			return '−';
		default:
			return operation;
	}
}

export function formatCalcNumber(num: string | number): string {
	if (num === 'Error') return 'Error';
	if (typeof num === 'string') {
		if (num === '' || num === '-') return '0';
		if (num === '.') return '0.';
		if (num === '-.') return '-0.';
		if (num.includes('.')) {
			const [integerRaw, decimal = ''] = num.split('.');
			const isNeg = integerRaw?.startsWith('-') ?? false;
			const digits = isNeg ? (integerRaw ?? '').slice(1) : (integerRaw ?? '');
			const parsedInt = digits === '' ? 0 : parseFloat(digits);
			if (Number.isNaN(parsedInt)) return 'Error';
			return `${isNeg ? '-' : ''}${parsedInt.toLocaleString('en-US')}.${decimal}`;
		}
		const parsed = parseFloat(num);
		if (Number.isNaN(parsed) || !Number.isFinite(parsed)) return 'Error';
		return parsed.toLocaleString('en-US', { maximumFractionDigits: 10 });
	}
	if (Number.isNaN(num) || !Number.isFinite(num)) return 'Error';
	return num.toLocaleString('en-US', { maximumFractionDigits: 10 });
}
