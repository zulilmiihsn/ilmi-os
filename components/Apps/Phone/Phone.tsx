'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
	Clock,
	Delete,
	Grid3x3,
	Phone as PhoneIcon,
	PhoneOff,
	PhoneOutgoing,
	Star,
	User,
	Voicemail,
	X,
} from 'lucide-react';
import { useSettingsStore } from '../../../stores/settings';
import { triggerHaptic } from '../../../utils/haptic';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import {
	addCallLog,
	addFavorite,
	formatCallDuration,
	formatCallTime,
	loadFavorites,
	loadRecents,
	removeFavorite,
	saveFavorites,
	saveRecents,
	type CallLogEntry,
	type FavoriteEntry,
} from './recents';

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

const MAX_DIGITS = 20;

type Tab = 'favorites' | 'recents' | 'contacts' | 'keypad' | 'voicemail';

export default function Phone() {
	const { darkMode } = useSettingsStore();
	const [tab, setTab] = useState<Tab>('keypad');
	const [number, setNumber] = useState('');
	const [recents, setRecents] = useState<CallLogEntry[]>([]);
	const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
	const [contactQuery, setContactQuery] = useState('');
	const [persistError, setPersistError] = useState(false);
	const [activeCall, setActiveCall] = useState<{ number: string; startedAt: number } | null>(null);
	const [elapsed, setElapsed] = useState(0);
	const callRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(!!activeCall, callRef);
	useFocusTrap(!!activeCall, callRef);

	useEffect(() => {
		setRecents(loadRecents());
		setFavorites(loadFavorites());
	}, []);

	useEffect(() => {
		if (!activeCall) return;
		setElapsed(0);
		const timer = setInterval(() => {
			setElapsed(Math.floor((Date.now() - activeCall.startedAt) / 1000));
		}, 1000);
		return () => clearInterval(timer);
	}, [activeCall]);

	const inputDigit = (digit: string) => {
		triggerHaptic('light');
		setNumber(prev => (prev.length >= MAX_DIGITS ? prev : prev + digit));
	};

	const backspace = () => {
		triggerHaptic('light');
		setNumber(prev => prev.slice(0, -1));
	};

	const startCall = (to: string) => {
		const target = to.trim();
		if (!target) return;
		triggerHaptic('medium');
		setActiveCall({ number: target, startedAt: Date.now() });
	};

	const endCall = () => {
		if (!activeCall) return;
		triggerHaptic('medium');
		const durationSec = Math.floor((Date.now() - activeCall.startedAt) / 1000);
		const next = addCallLog(recents, {
			number: activeCall.number,
			startedAt: new Date(activeCall.startedAt).toISOString(),
			durationSec,
		});
		setRecents(next);
		if (!saveRecents(next)) setPersistError(true);
		setActiveCall(null);
		setNumber('');
	};

	const handleAddNumber = () => {
		const target = number.trim();
		if (!target) return;
		triggerHaptic('medium');
		const next = addFavorite(favorites, target);
		setFavorites(next);
		if (!saveFavorites(next)) setPersistError(true);
		setNumber('');
	};

	const handleRemoveFavorite = (target: string) => {
		triggerHaptic('medium');
		const next = removeFavorite(favorites, target);
		setFavorites(next);
		if (!saveFavorites(next)) setPersistError(true);
	};

	// Contacts are derived from real activity: favorited and dialed numbers.
	const contacts = useMemo(() => {
		const seen = new Set<string>();
		const list: { number: string; sub: string }[] = [];
		for (const f of favorites) {
			if (!seen.has(f.number)) {
				seen.add(f.number);
				list.push({ number: f.number, sub: `Added ${formatCallTime(f.addedAt)}` });
			}
		}
		for (const r of recents) {
			if (!seen.has(r.number)) {
				seen.add(r.number);
				list.push({
					number: r.number,
					sub: `${formatCallTime(r.startedAt)} · ${formatCallDuration(r.durationSec)}`,
				});
			}
		}
		const q = contactQuery.trim().toLowerCase();
		return q ? list.filter(c => c.number.toLowerCase().includes(q)) : list;
	}, [favorites, recents, contactQuery]);

	return (
		<div
			className={`phone-app w-full h-full flex flex-col overflow-hidden font-sans select-none transition-colors duration-300 ${
				darkMode ? 'bg-black text-white' : 'bg-[#f2f2f7] text-black'
			}`}
		>
			{persistError && (
				<div
					role="alert"
					className="shrink-0 mx-4 mt-2 px-3 py-2 text-xs rounded-lg bg-red-500/15 text-red-600 dark:text-red-400"
				>
					Could not save call history. Storage may be unavailable — changes will be lost on
					reload.
				</div>
			)}

			{tab === 'favorites' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Favorites</h1>
					</div>
					<div className="flex-1 overflow-y-auto pb-4">
						{favorites.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
								<p className="text-lg font-semibold mb-1">No Favorites</p>
								<p className="text-sm">Type a number on the keypad, then tap Add Number.</p>
							</div>
						) : (
							<div
								className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
									darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
								}`}
							>
								{favorites.map((fav, i) => (
									<div
										key={fav.number}
										className={`flex items-center justify-between pl-4 pr-2 py-2 ${
											i < favorites.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
										}`}
									>
										<button
											onClick={() => startCall(fav.number)}
											aria-label={`Call ${fav.number}`}
											className="flex-1 flex items-center gap-3 text-left active:opacity-60 transition-opacity py-1"
										>
											<Star aria-hidden="true" size={16} className="text-ios-yellow shrink-0" />
											<span>
												<span className="block text-base font-normal">{fav.number}</span>
												<span className="block text-xs text-gray-400">
													Added {formatCallTime(fav.addedAt)}
												</span>
											</span>
										</button>
										<button
											onClick={() => handleRemoveFavorite(fav.number)}
											aria-label={`Remove ${fav.number} from favorites`}
											className="w-11 h-11 flex items-center justify-center active:opacity-50 transition-opacity"
										>
											<X aria-hidden="true" size={16} className="text-gray-400" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</>
			)}

			{tab === 'keypad' && (
				<>
					{/* Add Number: saves the typed number to Favorites */}
					<div className="pt-10 flex justify-center shrink-0">
						<button
							onClick={handleAddNumber}
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
									onClick={() => inputDigit(key.digit)}
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
								onClick={() => startCall(number)}
								aria-label={number ? `Call ${number}` : 'Call'}
								className="w-[72px] h-[72px] rounded-full bg-ios-green text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
							>
								<PhoneIcon aria-hidden="true" size={30} />
							</button>
							<button
								onClick={backspace}
								aria-label="Delete digit"
								className="w-11 h-8 rounded-lg bg-ios-gray5 dark:bg-ios-dark-gray5 active:brightness-90 transition-all flex items-center justify-center"
							>
								<Delete aria-hidden="true" size={18} className="text-gray-600 dark:text-gray-300" />
							</button>
						</div>
					</div>
				</>
			)}

			{tab === 'recents' && (
				<>
					{/* Recents header */}
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Recents</h1>
					</div>

					{/* Recents list */}
					<div className="flex-1 overflow-y-auto pb-4">
						{recents.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
								<p className="text-lg font-semibold mb-1">No Recents</p>
								<p className="text-sm">Calls you make will appear here.</p>
							</div>
						) : (
							<div
								className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
									darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
								}`}
							>
								{recents.map((entry, i) => (
									<button
										key={entry.id}
										onClick={() => startCall(entry.number)}
										aria-label={`Call back ${entry.number}`}
										className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
											i < recents.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
										}`}
									>
										<span>
											<span className="block text-base font-normal">{entry.number}</span>
											<span className="block text-xs text-gray-400">
												{formatCallTime(entry.startedAt)} · {formatCallDuration(entry.durationSec)}
											</span>
										</span>
										<PhoneOutgoing aria-hidden="true" size={16} className="text-gray-400 shrink-0" />
									</button>
								))}
							</div>
						)}
					</div>
				</>
			)}

			{tab === 'contacts' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Contacts</h1>
					</div>
					<div className="px-4 pb-3 shrink-0">
						<div className="flex items-center rounded-xl px-3 py-2 border bg-black/5 dark:bg-white/10 border-black/5 dark:border-white/10">
							<input
								type="text"
								value={contactQuery}
								onChange={e => setContactQuery(e.target.value)}
								placeholder="Search"
								aria-label="Search contacts"
								className="flex-1 bg-transparent border-none outline-none text-sm placeholder-gray-400"
							/>
						</div>
					</div>
					<div className="flex-1 overflow-y-auto pb-4">
						{contacts.length === 0 ? (
							<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
								<p className="text-lg font-semibold mb-1">No Contacts</p>
								<p className="text-sm">Numbers you call or favorite will appear here.</p>
							</div>
						) : (
							<div
								className={`mx-4 rounded-xl overflow-hidden shadow-xs border ${
									darkMode ? 'bg-[#1c1c1e] border-white/10' : 'bg-white border-black/5'
								}`}
							>
								{contacts.map((c, i) => (
									<button
										key={c.number}
										onClick={() => startCall(c.number)}
										aria-label={`Call ${c.number}`}
										className={`w-full flex items-center justify-between px-4 py-3 text-left active:bg-black/5 dark:active:bg-white/10 transition-colors ${
											i < contacts.length - 1 ? 'border-b border-black/5 dark:border-white/10' : ''
										}`}
									>
										<span>
											<span className="block text-base font-normal">{c.number}</span>
											<span className="block text-xs text-gray-400">{c.sub}</span>
										</span>
										<PhoneIcon aria-hidden="true" size={16} className="text-ios-blue shrink-0" />
									</button>
								))}
							</div>
						)}
					</div>
				</>
			)}

			{tab === 'voicemail' && (
				<>
					<div className="pt-10 px-4 pb-2 shrink-0">
						<h1 className="text-ios-large-title">Voicemail</h1>
					</div>
					<div className="flex-1 overflow-y-auto pb-4">
						<div className="flex flex-col items-center justify-center h-full text-gray-400 px-8 text-center">
							<Voicemail aria-hidden="true" size={36} className="mb-3 opacity-40" />
							<p className="text-lg font-semibold mb-1">No Voicemails</p>
							<p className="text-sm">Nobody can leave you one in a simulator.</p>
						</div>
					</div>
				</>
			)}

			{/* Bottom tab bar: full-width like iOS, not a floating pill */}
			<div
				role="tablist"
				aria-label="Phone sections"
				className="shrink-0 border-t backdrop-blur-xl bg-white/80 dark:bg-black/80 border-black/5 dark:border-white/15 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
			>
				<div className="flex items-start justify-around">
					{(
						[
							{ id: 'favorites', label: 'Favorites', Icon: Star },
							{ id: 'recents', label: 'Recents', Icon: Clock },
							{ id: 'contacts', label: 'Contacts', Icon: User },
							{ id: 'keypad', label: 'Keypad', Icon: Grid3x3 },
							{ id: 'voicemail', label: 'Voicemail', Icon: Voicemail },
						] as const
					).map(({ id, label, Icon }) => (
						<button
							key={id}
							role="tab"
							aria-selected={tab === id}
							aria-label={label}
							onClick={() => {
								triggerHaptic('light');
								setTab(id);
							}}
							className={`relative flex-1 flex flex-col items-center justify-center py-1 transition-all duration-200 active:scale-90 after:absolute after:-inset-2 after:content-[''] ${
								tab === id ? 'text-ios-blue' : 'text-ios-gray'
							}`}
						>
							<Icon aria-hidden="true" size={24} className="mb-0.5" />
							<span className="text-[10px] font-medium tracking-tight">{label}</span>
						</button>
					))}
				</div>
			</div>

			{/* Active call overlay */}
			{activeCall && (
				<div className="absolute inset-0 z-50 bg-black/95 text-white flex flex-col items-center">
					<div
						ref={callRef}
						onKeyDown={e => {
							if (e.key === 'Escape') endCall();
						}}
						role="dialog"
						aria-label={`Calling ${activeCall.number}`}
						className="w-full h-full flex flex-col items-center pt-20 pb-[max(env(safe-area-inset-bottom),2rem)] outline-none"
					>
						<p className="text-xs text-gray-400 font-medium">iLmi Mobile</p>
						<p className="text-4xl font-light tracking-tight mt-2 tabular-nums">{activeCall.number}</p>
						<p className="text-sm text-gray-400 mt-2 tabular-nums" aria-live="polite">
							{formatCallDuration(elapsed)}
						</p>
						<div className="flex-1" />
						<div className="w-full flex justify-end px-8">
							<button
								onClick={endCall}
								autoFocus
								aria-label="End call"
								className="w-[72px] h-[72px] rounded-full bg-ios-red text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
							>
								<PhoneOff aria-hidden="true" size={30} />
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
