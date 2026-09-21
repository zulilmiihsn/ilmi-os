export interface ParsedCommand {
	command: string;
	args: string[];
}

/** Split raw terminal input into a lowercase command and its arguments. Null when empty. */
export function parseTerminalInput(raw: string): ParsedCommand | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const [command, ...args] = trimmed.split(' ').filter(Boolean);
	return { command: command.toLowerCase(), args };
}
