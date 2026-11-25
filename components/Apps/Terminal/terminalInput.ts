export interface ParsedCommand {
	command: string;
	args: string[];
}

/** Split raw terminal input into a lowercase command and its arguments (supports quotes). Null when empty. */
export function parseTerminalInput(raw: string): ParsedCommand | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;

	const tokens: string[] = [];
	let current = '';
	let quote: '"' | "'" | null = null;
	let inToken = false;

	for (let i = 0; i < trimmed.length; i += 1) {
		const ch = trimmed[i] ?? '';
		if (quote) {
			if (ch === quote) {
				quote = null;
			} else if (ch === '\\' && quote === '"' && i + 1 < trimmed.length) {
				i += 1;
				current += trimmed[i] ?? '';
			} else {
				current += ch;
			}
			inToken = true;
		} else if (ch === '"' || ch === "'") {
			quote = ch;
			inToken = true;
		} else if (/\s/.test(ch)) {
			if (inToken) {
				tokens.push(current);
				current = '';
				inToken = false;
			}
		} else {
			current += ch;
			inToken = true;
		}
	}

	if (inToken) tokens.push(current);

	const [command, ...args] = tokens;
	if (!command) return null;
	return { command: command.toLowerCase(), args };
}
