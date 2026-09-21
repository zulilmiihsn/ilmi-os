import { describe, it, expect } from 'vitest';
import { parseTerminalInput } from './terminalInput';

describe('parseTerminalInput (Tahap 7)', () => {
	it('returns null for empty input', () => {
		expect(parseTerminalInput('')).toBeNull();
		expect(parseTerminalInput('   ')).toBeNull();
	});

	it('lowercases the command and splits arguments', () => {
		expect(parseTerminalInput('MKDIR Projects')).toEqual({ command: 'mkdir', args: ['Projects'] });
		expect(parseTerminalInput('  cd   ..  ')).toEqual({ command: 'cd', args: ['..'] });
	});

	it('keeps multi-word echo text as separate args', () => {
		expect(parseTerminalInput('echo hello world')).toEqual({
			command: 'echo',
			args: ['hello', 'world'],
		});
	});
});
