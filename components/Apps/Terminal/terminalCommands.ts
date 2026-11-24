import {
	loadFileSystem,
	createFolder as fsCreateFolder,
	createFile as fsCreateFile,
	deleteItem as fsDeleteItem,
	getBreadcrumbs,
	formatFileSize,
} from '../../../utils/fileSystem';
import { parseTerminalInput } from './terminalInput';

export interface OutputLine {
	id: string;
	text: string;
	type?: 'command' | 'output' | 'error' | 'success' | 'info';
}

export interface TerminalCommandContext {
	currentFolderId: string | null;
	addOutput: (text: string, type?: OutputLine['type']) => void;
	setCurrentFolderId: (id: string | null) => void;
	clearOutputs: () => void;
}

export function runTerminalCommand(cmd: string, ctx: TerminalCommandContext): void {
	const { currentFolderId, addOutput, setCurrentFolderId, clearOutputs } = ctx;
	const parsed = parseTerminalInput(cmd);
	if (!parsed) return;
	const { command, args } = parsed;
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
				.map(i =>
					i.type === 'folder' ? `📁 ${i.name}/` : `📄 ${i.name} (${formatFileSize(i.size || 0)})`
				)
				.join('    ');
			addOutput(formattedList, 'success');
			break;
		}

		case 'pwd': {
			const crumbs = getBreadcrumbs(currentFolderId);
			const fullPath =
				'/Users/user' + (crumbs.length > 0 ? '/' + crumbs.map(c => c.name).join('/') : '');
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
			if (!fsCreateFolder(folderName, currentFolderId)) {
				addOutput(`mkdir: cannot create directory '${folderName}': storage unavailable`, 'error');
				break;
			}
			addOutput(`Created directory: ${folderName}`, 'success');
			break;
		}

		case 'touch': {
			const fileName = args[0];
			if (!fileName) {
				addOutput('usage: touch <file_name>', 'error');
				break;
			}
			if (!fsCreateFile(fileName, currentFolderId, '')) {
				addOutput(`touch: cannot create file '${fileName}': storage unavailable`, 'error');
				break;
			}
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
			const match = currentItems.find(i => i.name.toLowerCase() === targetName.toLowerCase());
			if (match) {
				if (!fsDeleteItem(match.id)) {
					addOutput(`rm: cannot remove '${targetName}': storage unavailable`, 'error');
					break;
				}
				addOutput(`Removed '${targetName}'`, 'success');
			} else {
				addOutput(`rm: ${targetName}: No such file or directory`, 'error');
			}
			break;
		}

		case 'clear':
			clearOutputs();
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
}
