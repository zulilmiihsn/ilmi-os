'use client';

import { memo } from 'react';
import AppIcon from '../AppIcon';
import type { AppFolder } from '../../../stores/apps';
import { useAppsStore } from '../../../stores/apps';
import { useRestoreFocus } from '../../../utils/hooks/useRestoreFocus';
import { useFocusTrap } from '../../../utils/hooks/useFocusTrap';
import { useRef } from 'react';

interface FolderViewProps {
	folder: AppFolder;
	onClose: () => void;
	onLaunchApp: (appId: string) => void;
	onRemoveApp: (appId: string) => void;
}

/** Opened folder: member apps can be launched or moved back to the home grid. */
function FolderView({ folder, onClose, onLaunchApp, onRemoveApp }: FolderViewProps) {
	const apps = useAppsStore(state => state.apps);
	const rootRef = useRef<HTMLDivElement>(null);
	useRestoreFocus(true, rootRef);
	useFocusTrap(true, rootRef);
	const members = folder.appIds
		.map(id => apps.find(app => app.id === id))
		.filter((app): app is NonNullable<typeof app> => Boolean(app));

	return (
		<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xs">
			<div
				ref={rootRef}
				role="dialog"
				aria-modal="true"
				aria-label={`${folder.name} folder`}
				onKeyDown={e => {
					if (e.key === 'Escape') onClose();
				}}
				className="w-72 rounded-3xl bg-white/25 backdrop-blur-2xl border border-white/20 p-5 shadow-2xl"
			>
				<div className="flex items-center justify-between mb-4">
					<span className="text-white font-semibold">{folder.name}</span>
					<button
						type="button"
						onClick={onClose}
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
