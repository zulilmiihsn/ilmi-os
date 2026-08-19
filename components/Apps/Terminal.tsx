'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
	loadFileSystem,
	createFolder as fsCreateFolder,
	createFile as fsCreateFile,
	deleteItem as fsDeleteItem,
	getBreadcrumbs,
	formatFileSize,
} from '../../utils/fileSystem';

interface OutputLine {
	id: string;
	text: string;
	type?: 'command' | 'output' | 'error' | 'success' | 'info';
}

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
		setOutputs(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, text, type }]);
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

			const [command, ...args] = cmd.split(' ').filter(Boolean);
			const fs = loadFileSystem();
			const currentItems = fs.items.filter(i => i.parentId === currentFolderId);

			switch (command.toLowerCase()) {
				case 'help':
					addOutput(
						'Available commands:\n' +
							'  ls [dir]        List directory contents\n' +
							'  cd <dir>        Change directory (cd .., cd ~, cd <folder>)\n' +
							'  pwd             Print current working directory\n' +
							'  mkdir <name>    Create a new directory\n' +
							'  touch <name>    Create a new empty file\n' +
							'  cat <file>      Display file content\n' +
							'  rm <name>       Remove a file or directory\n' +
							'  echo <text>     Print text\n' +
							'  clear           Clear the terminal screen\n' +
							'  whoami          Print current user\n' +
							'  date            Display current date and time\n' +
							'  uname -a        System information',
						'info'
					);
					break;

				case 'ls': {
					if (currentItems.length === 0) {
						addOutput('(empty directory)', 'info');
						break;
					}
					const formattedList = currentItems
						.map(i => (i.type === 'folder' ? `📁 ${i.name}/` : `📄 ${i.name} (${formatFileSize(i.size || 0)})`))
						.join('    ');
					addOutput(formattedList, 'success');
					break;
				}

				case 'pwd': {
					const crumbs = getBreadcrumbs(currentFolderId);
					const fullPath = '/Users/user' + (crumbs.length > 0 ? '/' + crumbs.map(c => c.name).join('/') : '');
					addOutput(fullPath, 'output');
					break;
				}

				case 'cd': {
					const target = args[0] || '~';
					if (target === '~' || target === '/') {
						setCurrentFolderId(null);
					} else if (target === '..') {
						if (currentFolderId) {
							const current = fs.items.find(i => i.id === currentFolderId);
							setCurrentFolderId(current?.parentId || null);
						}
					} else {
						const match = currentItems.find(
							i => i.type === 'folder' && i.name.toLowerCase() === target.toLowerCase()
						);
						if (match) {
							setCurrentFolderId(match.id);
						} else {
							addOutput(`cd: no such file or directory: ${target}`, 'error');
						}
					}
					break;
				}

				case 'mkdir': {
					const folderName = args[0];
					if (!folderName) {
						addOutput('usage: mkdir <directory_name>', 'error');
						break;
					}
					if (currentItems.some(i => i.name.toLowerCase() === folderName.toLowerCase())) {
						addOutput(`mkdir: cannot create directory '${folderName}': File exists`, 'error');
						break;
					}
					fsCreateFolder(folderName, currentFolderId);
					addOutput(`Created directory: ${folderName}`, 'success');
					break;
				}

				case 'touch': {
					const fileName = args[0];
					if (!fileName) {
						addOutput('usage: touch <file_name>', 'error');
						break;
					}
					fsCreateFile(fileName, currentFolderId, '');
					addOutput(`Created file: ${fileName}`, 'success');
					break;
				}

				case 'cat': {
					const fileName = args[0];
					if (!fileName) {
						addOutput('usage: cat <file_name>', 'error');
						break;
					}
					const match = currentItems.find(
						i => i.type === 'file' && i.name.toLowerCase() === fileName.toLowerCase()
					);
					if (match) {
						addOutput(match.content || '(empty file)', 'output');
					} else {
						addOutput(`cat: ${fileName}: No such file or directory`, 'error');
					}
					break;
				}

				case 'rm': {
					const targetName = args[0];
					if (!targetName) {
						addOutput('usage: rm <name>', 'error');
						break;
					}
					const match = currentItems.find(
						i => i.name.toLowerCase() === targetName.toLowerCase()
					);
					if (match) {
						fsDeleteItem(match.id);
						addOutput(`Removed '${targetName}'`, 'success');
					} else {
						addOutput(`rm: ${targetName}: No such file or directory`, 'error');
					}
					break;
				}

				case 'clear':
					setOutputs([]);
					break;

				case 'echo':
					addOutput(args.join(' '), 'output');
					break;

				case 'whoami':
					addOutput('user (uid=501)', 'output');
					break;

				case 'date':
					addOutput(new Date().toString(), 'output');
					break;

				case 'uname':
					addOutput('Darwin ilmi-mac.local 24.0.0 Darwin Kernel Version 24.0.0 x86_64', 'output');
					break;

				default:
					addOutput(`zsh: command not found: ${command}. Type "help" for commands.`, 'error');
					break;
			}
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
			setCurrentCommand(commandHistory[nextIdx]);
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIdx === -1) return;
			const nextIdx = historyIdx + 1;
			if (nextIdx >= commandHistory.length) {
				setHistoryIdx(-1);
				setCurrentCommand('');
			} else {
				setHistoryIdx(nextIdx);
				setCurrentCommand(commandHistory[nextIdx]);
			}
		}
	};

	return (
		<div
			className="terminal w-full h-full bg-[#1A1A1A] text-[#33FF00] font-mono p-4 flex flex-col overflow-hidden text-sm selection:bg-[#33FF00]/30 selection:text-white"
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
				<span className="text-cyan-400 font-semibold select-none">
					user@ilmi:{currentPathStr}$
				</span>
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


