/** Pure arithmetic core, extracted from Calculator.tsx for unit testing (no React). */

export type CalcResult = number | 'Error';

export function calculateResult(
	previous: number,
	current: number,
	operation: string
): CalcResult {
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
