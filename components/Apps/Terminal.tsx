'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { getBreadcrumbs } from '../../utils/fileSystem';
import { generateId } from '../../utils/id';
import { runTerminalCommand, type OutputLine } from './Terminal/terminalCommands';

export default function Terminal() {
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

	// Auto scroll to bottom
	useEffect(() => {
		terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [outputs]);

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
			if (!cmd) return;

			// Add command to output
			addOutput(`user@ilmi:${currentPathStr}$ ${cmd}`, 'command');

			// Save to history
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
		[addOutput, currentFolderId, currentPathStr]
	);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
			className="terminal w-full h-full bg-[#1A1A1A] text-[#33FF00] font-mono p-4 pb-[max(env(safe-area-inset-bottom),1rem)] flex flex-col overflow-hidden text-sm selection:bg-[#33FF00]/30 selection:text-white"
			onClick={() => inputRef.current?.focus()}
		>
			<div className="output flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-hide">
				{outputs.map(line => (
					<div
						key={line.id}
						className={`whitespace-pre-wrap leading-relaxed ${
							line.type === 'command'
								? 'text-white font-semibold'
								: line.type === 'error'
									? 'text-red-400'
									: line.type === 'success'
										? 'text-emerald-400'
										: line.type === 'info'
											? 'text-gray-400'
											: 'text-green-300'
						}`}
					>
						{line.text}
					</div>
				))}
				<div ref={terminalEndRef} />
			</div>

			<div className="input-line flex items-center gap-2 pt-2 border-t border-white/10 shrink-0">
				<span className="text-cyan-400 font-semibold select-none">user@ilmi:{currentPathStr}$</span>
				<input
					ref={inputRef}
					type="text"
					className="flex-1 bg-transparent border-none outline-none text-white font-mono"
					value={currentCommand}
					onChange={e => setCurrentCommand(e.target.value)}
					onKeyDown={handleKeyDown}
					autoFocus
					spellCheck={false}
					autoComplete="off"
				/>
			</div>
		</div>
	);
}
