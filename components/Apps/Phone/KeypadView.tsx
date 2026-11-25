'use client';

import { useEffect, useRef } from 'react';
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
	lastRecentNumber: string | null;
	onAddNumber: () => void;
	onInputDigit: (digit: string) => void;
	onCall: (number: string) => void;
	onRedialLast: () => void;
	onBackspace: () => void;
}

export default function KeypadView({
	number,
	lastRecentNumber,
	onAddNumber,
	onInputDigit,
	onCall,
	onRedialLast,
	onBackspace,
}: KeypadViewProps) {
	const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const longPressedZeroRef = useRef(false);

	useEffect(() => {
		return () => {
			if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
		};
	}, []);

	const clearZeroHold = () => {
		if (holdTimerRef.current) {
			clearTimeout(holdTimerRef.current);
			holdTimerRef.current = null;
		}
	};

	const handleZeroPointerDown = () => {
		clearZeroHold();
		longPressedZeroRef.current = false;
		holdTimerRef.current = setTimeout(() => {
			longPressedZeroRef.current = true;
			onInputDigit('+');
			holdTimerRef.current = null;
		}, 450);
	};

	return (
		<div className="flex-1 min-h-0 overflow-y-auto flex flex-col bg-white dark:bg-black">
			{/* Add Number: only visible once digits are typed */}
			<div className="pt-4 h-10 flex items-center justify-center shrink-0">
				{number && (
					<button
						onClick={onAddNumber}
						aria-label="Add number to favorites"
						className="text-ios-blue text-base font-normal active:opacity-50 transition-opacity"
					>
						Add Number
					</button>
				)}
			</div>
			<div className="flex-1 flex flex-col items-center justify-end px-6 pb-2 min-h-[52px]">
				<div
					aria-live="polite"
					className="text-4xl font-light tracking-tight tabular-nums truncate max-w-full"
				>
					{number || <span className="opacity-0 select-none">0</span>}
				</div>
			</div>

			{/* Keypad */}
			<div className="shrink-0 px-8 pb-3">
				<div className="grid grid-cols-3 gap-x-6 gap-y-2.5 max-w-[280px] mx-auto justify-items-center">
					{KEYS.map(key => {
						const isZero = key.digit === '0';
						return (
							<button
								key={key.digit}
								onPointerDown={isZero ? handleZeroPointerDown : undefined}
								onPointerUp={isZero ? clearZeroHold : undefined}
								onPointerLeave={isZero ? clearZeroHold : undefined}
								onPointerCancel={isZero ? clearZeroHold : undefined}
								onClick={() => {
									if (isZero && longPressedZeroRef.current) {
										longPressedZeroRef.current = false;
										return;
									}
									onInputDigit(key.digit);
								}}
								aria-label={key.label}
								className="w-16 h-16 rounded-full bg-black/[0.06] dark:bg-white/[0.15] active:bg-black/15 dark:active:bg-white/25 transition-colors flex flex-col items-center justify-center select-none"
							>
								<span className="text-2xl font-normal leading-none">{key.digit}</span>
								{key.letters && (
									<span className="text-[10px] font-medium tracking-[0.2em] text-gray-500 dark:text-gray-400 leading-none mt-1">
										{key.letters}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Call row: green button centered, translucent backspace appears when digits exist */}
				<div className="grid grid-cols-3 gap-x-6 max-w-[280px] mx-auto justify-items-center items-center mt-2.5">
					<span aria-hidden="true" />
					<button
						onClick={() => {
							if (number.trim()) {
								onCall(number);
							} else if (lastRecentNumber) {
								onRedialLast();
							}
						}}
						aria-label={number ? `Call ${number}` : 'Call'}
						className="w-16 h-16 rounded-full bg-ios-green text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
					>
						<PhoneIcon aria-hidden="true" size={26} />
					</button>
					{number ? (
						<button
							onClick={onBackspace}
							aria-label="Delete digit"
							className="w-14 h-14 rounded-full text-gray-500 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 transition-all flex items-center justify-center"
						>
							<Delete aria-hidden="true" size={22} />
						</button>
					) : (
						<span aria-hidden="true" className="w-14 h-14" />
					)}
				</div>
			</div>
		</div>
	);
}
