'use client';

import { memo, useState, useEffect } from 'react';
import AppIcon from '../AppIcon';
import type { AppFolder } from '../../../stores/apps';
import { useAppsStore } from '../../../stores/apps';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRef } from 'react';

interface FolderViewProps {
	folder: AppFolder;
	/** Folder icon rect: the card zooms from it on open and back on close (iOS). */
	origin?: { x: number; y: number; width: number; height: number } | null;
	onClose: () => void;
	onLaunchApp: (appId: string) => void;
	onRemoveApp: (appId: string) => void;
}

/** Card width in px (w-72 = 18rem): the zoom scale denominator. */
const CARD_REM_WIDTH = 18;

/** Root rem in px, read once (the card width derives from it). */
function rootRem(): number {
	if (typeof window === 'undefined') return 16;
	const parsed = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 16;
}

/** Opened folder: member apps can be launched or moved back to the home grid. */
function FolderView({ folder, origin, onClose, onLaunchApp, onRemoveApp }: FolderViewProps) {
	const apps = useAppsStore(state => state.apps);
	const renameFolder = useAppsStore(state => state.renameFolder);
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(true, rootRef);
	useFocusTrap(true, rootRef);
	const [editingName, setEditingName] = useState(false);
	const [draftName, setDraftName] = useState(folder.name);
	// Zoom trip state: start collapsed at the icon, grow after paint;
	// collapse back before unmounting. No origin (e.g. deep link) = no trip.
	const [zoomedOut, setZoomedOut] = useState(() => origin != null);
	const [closing, setClosing] = useState(false);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const remRef = useRef<number | null>(null);

	useEffect(() => {
		return () => {
			if (closeTimer.current) clearTimeout(closeTimer.current);
		};
	}, []);

	useEffect(() => {
		if (origin == null) return;
		const raf = requestAnimationFrame(() => {
			requestAnimationFrame(() => setZoomedOut(false));
		});
		return () => cancelAnimationFrame(raf);
	}, [origin, folder.id]);

	const requestClose = () => {
		if (!origin) {
			onClose();
			return;
		}
		if (closeTimer.current) return;
		setClosing(true);
		closeTimer.current = setTimeout(onClose, 220);
	};
	const commitRename = () => {
		if (renameFolder(folder.id, draftName)) {
			setEditingName(false);
		} else {
			setDraftName(folder.name);
			setEditingName(false);
		}
	};
	const members = folder.appIds
		.map(id => apps.find(app => app.id === id))
		.filter((app): app is NonNullable<typeof app> => Boolean(app));

	// Zoom trip between the folder icon and the centered card (iOS): the card
	// is w-72, so scale the icon rect up from the shared center point.
	const collapsed = zoomedOut || closing;
	let cardTransform: string | undefined;
	if (origin && collapsed && typeof window !== 'undefined') {
		if (remRef.current == null) remRef.current = rootRem();
		const cardWidth = CARD_REM_WIDTH * (remRef.current ?? 16);
		const scale = origin.width / cardWidth;
		const dx = origin.x + origin.width / 2 - window.innerWidth / 2;
		const dy = origin.y + origin.height / 2 - window.innerHeight / 2;
		cardTransform = `translate(${dx}px, ${dy}px) scale(${scale})`;
	}

	return (
		<div
			className={`fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-opacity duration-200 ${collapsed ? 'opacity-0' : 'opacity-100'}`}
		>
			<div
				ref={rootRef}
				role="dialog"
				aria-modal="true"
				aria-label={`${folder.name} folder`}
				onKeyDown={e => {
					if (e.key === 'Escape') requestClose();
				}}
				className="w-72 rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/20 p-5 shadow-2xl"
				style={
					origin
						? {
								transform: cardTransform,
								transformOrigin: 'center',
								transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
							}
						: undefined
				}
			>
				<div className="flex items-center justify-between mb-4">
					{editingName ? (
						<input
							autoFocus
							value={draftName}
							maxLength={24}
							onChange={e => setDraftName(e.target.value)}
							onBlur={commitRename}
							onKeyDown={e => {
								if (e.key === 'Enter') commitRename();
							}}
							aria-label="Folder name"
							className="bg-white/20 text-white font-semibold rounded-lg px-2 py-0.5 outline-none w-32"
						/>
					) : (
						<button
							type="button"
							onClick={() => {
								setDraftName(folder.name);
								setEditingName(true);
							}}
							aria-label={`Rename folder ${folder.name}`}
							className="text-white font-semibold focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 rounded"
						>
							{folder.name}
						</button>
					)}
					<button
						type="button"
						onClick={requestClose}
						aria-label="Close folder"
						className="w-7 h-7 rounded-full bg-white/20 text-white flex items-center justify-center active:scale-90 transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
					>
						<i className="fas fa-times text-xs" aria-hidden="true"></i>
					</button>
				</div>
				<div className="grid grid-cols-3 gap-4">
					{members.map(member => (
						<div key={member.id} className="relative flex flex-col items-center">
							<AppIcon
								app={member}
								onClick={() => {
									onClose();
									onLaunchApp(member.id);
								}}
							/>
							<button
								type="button"
								onClick={() => onRemoveApp(member.id)}
								aria-label={`Remove ${member.name} from folder`}
								className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/30 text-white text-[10px] flex items-center justify-center active:scale-90 transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
							>
								<i className="fas fa-minus" aria-hidden="true"></i>
							</button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

export default memo(FolderView);
