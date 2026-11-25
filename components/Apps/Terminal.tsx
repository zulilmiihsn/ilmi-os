'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSettingsStore } from '../../stores/settings';
import { getBreadcrumbs, loadFileSystem } from '../../utils/fileSystem';
import { generateId } from '../../utils/id';
import {
	runTerminalCommand,
	TERMINAL_COMMANDS,
	type OutputLine,
} from './Terminal/terminalCommands';

export default function Terminal() {
	const { darkMode } = useSettingsStore();
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [commandHistory, setCommandHistory] = useState<string[]>([]);
	const [historyIdx, setHistoryIdx] = useState<number>(-1);
	const [currentCommand, setCurrentCommand] = useState('');
	const [outputs, setOutputs] = useState<OutputLine[]>([
		{
			id: '1',
			text: 'iLmi Darwin Kernel Version 24.0.0 (x86_64)',
			type: 'info',
		},
		{
			id: '2',
			text: 'Type "help" for a list of available commands.',
			type: 'info',
		},
	]);

	const inputRef = useRef<HTMLInputElement>(null);
	const terminalEndRef = useRef<HTMLDivElement>(null);

	// Compute current path string
	const currentPathStr = useMemo(() => {
		const crumbs = getBreadcrumbs(currentFolderId);
		if (crumbs.length === 0) return '~';
		return '~/' + crumbs.map(c => c.name).join('/');
	}, [currentFolderId]);

	const promptText = `user@ilmi-mac ${currentPathStr} %`;

	// Auto scroll to bottom
	useEffect(() => {
		terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [outputs, currentCommand]);

	// Focus input
	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const addOutput = useCallback((text: string, type: OutputLine['type'] = 'output') => {
		setOutputs(prev => [...prev, { id: generateId('line'), text, type }]);
	}, []);

	const executeCommand = useCallback(
		(rawCmd: string) => {
			const cmd = rawCmd.trim();
			if (!cmd) {
				addOutput(promptText, 'command');
				setCurrentCommand('');
				return;
			}

			addOutput(`${promptText} ${cmd}`, 'command');
			setCommandHistory(prev => [...prev, cmd]);
			setHistoryIdx(-1);
			setCurrentCommand('');

			runTerminalCommand(cmd, {
				currentFolderId,
				addOutput,
				setCurrentFolderId,
				clearOutputs: () => setOutputs([]),
			});
		},
		[addOutput, currentFolderId, promptText]
	);

	const handleTabComplete = () => {
		const hasSpace = currentCommand.includes(' ');
		if (!hasSpace) {
			const prefix = currentCommand.trim().toLowerCase();
			if (!prefix) return;
			const matches = TERMINAL_COMMANDS.filter(c => c.startsWith(prefix));
			if (matches.length === 1 && matches[0]) {
				setCurrentCommand(`${matches[0]} `);
			} else if (matches.length > 1) {
				addOutput(`${promptText} ${currentCommand}`, 'command');
				addOutput(matches.join('    '), 'info');
			}
			return;
		}

		const lastSpace = currentCommand.lastIndexOf(' ');
		const before = currentCommand.slice(0, lastSpace + 1);
		const fragment = currentCommand.slice(lastSpace + 1).replace(/^['"]/, '');
		const items = loadFileSystem().items.filter(i => i.parentId === currentFolderId);
		const matches = items.filter(i => i.name.toLowerCase().startsWith(fragment.toLowerCase()));
		if (matches.length === 1 && matches[0]) {
			const item = matches[0];
			const suffix = item.type === 'folder' ? '/' : '';
			const formatted = item.name.includes(' ')
				? `"${item.name}${suffix}"`
				: `${item.name}${suffix}`;
			setCurrentCommand(`${before}${formatted}`);
		} else if (matches.length > 1) {
			addOutput(`${promptText} ${currentCommand}`, 'command');
			addOutput(
				matches.map(m => (m.type === 'folder' ? `${m.name}/` : m.name)).join('    '),
				'info'
			);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.ctrlKey && e.key.toLowerCase() === 'l') {
			e.preventDefault();
			setOutputs([]);
			return;
		}
		if (e.ctrlKey && e.key.toLowerCase() === 'c') {
			e.preventDefault();
			addOutput(`${promptText} ${currentCommand}^C`, 'info');
			setCurrentCommand('');
			setHistoryIdx(-1);
			return;
		}
		if (e.key === 'Tab') {
			e.preventDefault();
			handleTabComplete();
			return;
		}
		if (e.key === 'Enter') {
			executeCommand(currentCommand);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			if (commandHistory.length === 0) return;
			const nextIdx = historyIdx === -1 ? commandHistory.length - 1 : Math.max(0, historyIdx - 1);
			setHistoryIdx(nextIdx);
			setCurrentCommand(commandHistory[nextIdx] ?? '');
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIdx === -1) return;
			const nextIdx = historyIdx + 1;
			if (nextIdx >= commandHistory.length) {
				setHistoryIdx(-1);
				setCurrentCommand('');
			} else {
				setHistoryIdx(nextIdx);
				setCurrentCommand(commandHistory[nextIdx] ?? '');
			}
		}
	};

	return (
		<div
			className={`terminal w-full h-full font-mono p-4 pb-[max(env(safe-area-inset-bottom),1.5rem)] flex flex-col overflow-hidden text-[13px] transition-colors duration-200 ${
				darkMode
					? 'bg-[#1c1c1e] text-[#e5e5e7] selection:bg-ios-blue/40 selection:text-white'
					: 'bg-white text-[#1d1d1f] selection:bg-ios-blue/20 selection:text-[#1d1d1f]'
			}`}
			onClick={() => {
				if (typeof window !== 'undefined' && window.getSelection()?.toString()) return;
				inputRef.current?.focus();
			}}
		>
			<div className="output flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-hide">
				{outputs.map(line => (
					<div
						key={line.id}
						className={`whitespace-pre-wrap leading-relaxed break-words ${
							line.type === 'command'
								? darkMode
									? 'text-white font-semibold'
									: 'text-[#1d1d1f] font-semibold'
								: line.type === 'error'
									? darkMode
										? 'text-red-400'
										: 'text-red-600'
									: line.type === 'success'
										? darkMode
											? 'text-emerald-400'
											: 'text-emerald-700'
										: line.type === 'info'
											? darkMode
												? 'text-gray-400'
												: 'text-gray-500'
											: darkMode
												? 'text-[#e5e5e7]'
												: 'text-[#1d1d1f]'
						}`}
					>
						{line.text}
					</div>
				))}

				{/* Inline macOS zsh prompt */}
				<div className="input-line flex items-center gap-2 leading-relaxed pt-0.5">
					<span
						className={`font-semibold select-none shrink-0 ${
							darkMode ? 'text-emerald-400' : 'text-emerald-700'
						}`}
					>
						{promptText}
					</span>
					<input
						ref={inputRef}
						type="text"
						aria-label="Terminal command input"
						className={`flex-1 bg-transparent border-none outline-none font-mono min-w-0 ${
							darkMode ? 'text-[#e5e5e7]' : 'text-[#1d1d1f]'
						}`}
						value={currentCommand}
						onChange={e => setCurrentCommand(e.target.value)}
						onKeyDown={handleKeyDown}
						autoFocus
						spellCheck={false}
						autoComplete="off"
					/>
				</div>
				<div ref={terminalEndRef} />
			</div>
		</div>
	);
}
