'use client';

import { Delete, Phone as PhoneIcon } from 'lucide-react';

const KEYS: { digit: string; letters: string; label: string }[] = [
	{ digit: '1', letters: '', label: '1' },
	{ digit: '2', letters: 'ABC', label: '2 ABC' },
	{ digit: '3', letters: 'DEF', label: '3 DEF' },
	{ digit: '4', letters: 'GHI', label: '4 GHI' },
	{ digit: '5', letters: 'JKL', label: '5 JKL' },
	{ digit: '6', letters: 'MNO', label: '6 MNO' },
	{ digit: '7', letters: 'PQRS', label: '7 PQRS' },
	{ digit: '8', letters: 'TUV', label: '8 TUV' },
	{ digit: '9', letters: 'WXYZ', label: '9 WXYZ' },
	{ digit: '*', letters: '', label: 'star' },
	{ digit: '0', letters: '+', label: '0 plus' },
	{ digit: '#', letters: '', label: 'hash' },
];

interface KeypadViewProps {
	number: string;
	onAddNumber: () => void;
	onInputDigit: (digit: string) => void;
	onCall: (number: string) => void;
	onBackspace: () => void;
}

export default function KeypadView({
	number,
	onAddNumber,
	onInputDigit,
	onCall,
	onBackspace,
}: KeypadViewProps) {
	return (
		<>
			{/* Add Number: saves the typed number to Favorites */}
			<div className="pt-10 flex justify-center shrink-0">
				<button
					onClick={onAddNumber}
					aria-label="Add number to favorites"
					className="text-ios-blue text-base font-normal active:opacity-50 transition-opacity"
				>
					Add Number
				</button>
			</div>
			<div className="flex-1 flex flex-col items-center justify-end px-6 pb-4 min-h-0">
				<div
					aria-live="polite"
					className="text-[40px] font-light tracking-tight tabular-nums truncate max-w-full"
				>
					{number || <span className="opacity-0 select-none">0</span>}
				</div>
			</div>

			{/* Keypad */}
			<div className="shrink-0 px-8 pb-2">
				<div className="grid grid-cols-3 gap-x-6 gap-y-3.5 max-w-[312px] mx-auto justify-items-center">
					{KEYS.map(key => (
						<button
							key={key.digit}
							onClick={() => onInputDigit(key.digit)}
							aria-label={key.label}
							className="w-[72px] h-[72px] rounded-full bg-black/5 dark:bg-white/[0.15] active:bg-black/10 dark:active:bg-white/20 transition-colors flex flex-col items-center justify-center select-none"
						>
							<span className="text-3xl font-normal leading-none">{key.digit}</span>
							{key.letters && (
								<span className="text-[10px] font-medium tracking-[0.2em] text-gray-500 dark:text-gray-400 leading-none mt-1">
									{key.letters}
								</span>
							)}
						</button>
					))}
				</div>

				{/* Call row: green button centered, small backspace chip
					on the right like iOS */}
				<div className="grid grid-cols-3 gap-x-6 max-w-[312px] mx-auto justify-items-center items-center mt-3.5">
					<span aria-hidden="true" />
					<button
						onClick={() => onCall(number)}
						aria-label={number ? `Call ${number}` : 'Call'}
						className="w-[72px] h-[72px] rounded-full bg-ios-green text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
					>
						<PhoneIcon aria-hidden="true" size={30} />
					</button>
					<button
						onClick={onBackspace}
						aria-label="Delete digit"
						className="w-11 h-8 rounded-lg bg-ios-gray5 dark:bg-ios-dark-gray5 active:brightness-90 transition-all flex items-center justify-center"
					>
						<Delete aria-hidden="true" size={18} className="text-gray-600 dark:text-gray-300" />
					</button>
				</div>
			</div>
		</>
	);
}
