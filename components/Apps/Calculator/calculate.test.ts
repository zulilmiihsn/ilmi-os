import { describe, it, expect } from 'vitest';
import { calculateResult, formatCalcNumber, formatOperatorSymbol } from './calculate';

describe('calculateResult', () => {
	it('computes the four operations', () => {
		expect(calculateResult(2, 3, '+')).toBe(5);
		expect(calculateResult(5, 8, '-')).toBe(-3);
		expect(calculateResult(4, 2.5, '*')).toBe(10);
		expect(calculateResult(7, 2, '/')).toBe(3.5);
	});

	it('returns Error on division by zero like iOS', () => {
		expect(calculateResult(5, 0, '/')).toBe('Error');
		expect(calculateResult(0, 0, '/')).toBe('Error');
	});

	it('returns the current value for unknown operations', () => {
		expect(calculateResult(5, 3, '')).toBe(3);
	});
});

describe('formatCalcNumber', () => {
	it('preserves Error without turning it into NaN', () => {
		expect(formatCalcNumber('Error')).toBe('Error');
	});

	it('formats leading decimals safely without NaN', () => {
		expect(formatCalcNumber('.')).toBe('0.');
		expect(formatCalcNumber('.5')).toBe('0.5');
		expect(formatCalcNumber('-.5')).toBe('-0.5');
		expect(formatCalcNumber('1234.50')).toBe('1,234.50');
	});

	it('formats operator symbols for display', () => {
		expect(formatOperatorSymbol('*')).toBe('×');
		expect(formatOperatorSymbol('/')).toBe('÷');
		expect(formatOperatorSymbol('-')).toBe('−');
		expect(formatOperatorSymbol('+')).toBe('+');
	});
});
