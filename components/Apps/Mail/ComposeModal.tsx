'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { triggerHaptic } from '../../../utils/haptic';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';

interface ComposeModalProps {
	onClose: () => void;
	onSend: (to: string, subject: string, body: string) => boolean;
	darkMode?: boolean;
}

function ComposeModal({ onClose, onSend, darkMode = false }: ComposeModalProps) {
	const [to, setTo] = useState('');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');
	const [sendError, setSendError] = useState(false);
	const [isClosing, setIsClosing] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const modalRef = useRef<HTMLDivElement>(null);
	// Mounted only while open: restores focus on send/close/unmount.
	useRestoreFocus(true, modalRef);
	useFocusTrap(true, modalRef);

	useEffect(() => {
		requestAnimationFrame(() => setIsVisible(true));
	}, []);

	const handleClose = () => {
		triggerHaptic('light');
		setIsClosing(true);
	};

	const handleSend = () => {
		if (!to) return;
		triggerHaptic('medium');
		if (!onSend(to, subject, body)) {
			setSendError(true);
			return;
		}
		setSendError(false);
		handleClose();
	};

	const handleTransitionEnd = (e: React.TransitionEvent) => {
		if (e.target === modalRef.current && isClosing) {
			onClose();
		}
	};

	return (
		<div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none">
			{/* Backdrop */}
			<div
				className={`absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto ${
					isVisible && !isClosing ? 'opacity-100' : 'opacity-0'
				}`}
				onClick={handleClose}
			/>

			{/* iOS Sheet Modal */}
			<div
				ref={modalRef}
				onKeyDown={e => {
					if (e.key === 'Escape') handleClose();
				}}
				className={`w-full h-[92%] rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto transition-transform duration-300 ease-out transform ${
					darkMode ? 'bg-[#1c1c1e] text-white' : 'bg-white text-black'
				} ${isVisible && !isClosing ? 'translate-y-0' : 'translate-y-full'}`}
				onTransitionEnd={handleTransitionEnd}
			>
				{/* Header */}
				<div
					className={`flex items-center justify-between px-4 py-3 border-b ${
						darkMode ? 'border-white/10' : 'border-gray-100'
					}`}
				>
					<button
						onClick={handleClose}
						className="text-[#007aff] text-base font-normal active:opacity-50 transition-opacity"
					>
						Cancel
					</button>
					<span className="font-semibold text-base">New Message</span>
					<button
						onClick={handleSend}
						disabled={!to}
						className={`font-semibold text-base transition-opacity ${
							to ? 'text-[#007aff] active:opacity-50' : 'text-gray-300 dark:text-gray-600'
						}`}
					>
						Send
					</button>
				</div>

				{sendError && (
					<div
						role="alert"
						className="mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
					>
						Could not save the message. Storage may be unavailable — your draft is kept open.
					</div>
				)}

				{/* Fields */}
				<div className="flex flex-col text-sm">
					<div
						className={`flex items-center px-4 py-2.5 border-b ${
							darkMode ? 'border-white/10' : 'border-gray-100'
						}`}
					>
						<span className="text-gray-400 w-16">To:</span>
						<input
							type="text"
							value={to}
							onChange={e => setTo(e.target.value)}
							placeholder="recipient@example.com"
							className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
							autoFocus
						/>
						<button className="text-[#007aff] ml-2 text-base" aria-label="Add recipient">
							<i className="fas fa-plus-circle" aria-hidden="true"></i>
						</button>
					</div>
					<div
						className={`flex items-center px-4 py-2.5 border-b ${
							darkMode ? 'border-white/10' : 'border-gray-100'
						}`}
					>
						<span className="text-gray-400 w-16">Cc/Bcc:</span>
						<span className="text-gray-500">user@ilmi.os</span>
					</div>
					<div
						className={`flex items-center px-4 py-2.5 border-b ${
							darkMode ? 'border-white/10' : 'border-gray-100'
						}`}
					>
						<span className="text-gray-400 w-16">Subject:</span>
						<input
							type="text"
							value={subject}
							onChange={e => setSubject(e.target.value)}
							placeholder="Subject"
							className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
						/>
					</div>
				</div>

				{/* Body */}
				<textarea
					value={body}
					onChange={e => setBody(e.target.value)}
					className="flex-1 p-4 bg-transparent outline-none resize-none text-[15px] leading-relaxed placeholder-gray-400"
					placeholder="Sent from my iPhone"
				/>
			</div>
		</div>
	);
}

export default memo(ComposeModal);
