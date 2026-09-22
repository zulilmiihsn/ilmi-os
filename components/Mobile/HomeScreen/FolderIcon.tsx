'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { AppFolder } from '../../../stores/apps';
import { useAppsStore } from '../../../stores/apps';

interface FolderIconProps {
	folder: AppFolder;
	onOpen: (folderId: string) => void;
}

/** iOS-style folder: rounded container with a mini preview of its apps. */
function FolderIcon({ folder, onOpen }: FolderIconProps) {
	const apps = useAppsStore(state => state.apps);
	const members = folder.appIds
		.map(id => apps.find(app => app.id === id))
		.filter((app): app is NonNullable<typeof app> => Boolean(app))
		.slice(0, 9);

	return (
		<button
			type="button"
			onClick={() => onOpen(folder.id)}
			aria-label={`Open folder ${folder.name}, ${folder.appIds.length} apps`}
			className="w-full h-full flex flex-col items-center justify-center gap-1 group focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 rounded-2xl"
		>
			<span className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur-md grid grid-cols-3 content-center justify-items-center gap-[3px] p-2 shadow-lg group-active:scale-95 transition-transform">
				{members.map(member =>
					member.icon.startsWith('/') ? (
						<Image
							key={member.id}
							src={member.icon}
							alt=""
							width={20}
							height={20}
							className="w-4 h-4 object-contain"
							unoptimized
						/>
					) : (
						<i key={member.id} className={`fas ${member.icon} text-[10px] text-white`}></i>
					)
				)}
			</span>
			<span className="text-xs font-medium text-white drop-shadow-md text-center leading-tight w-full truncate px-1">
				{folder.name}
			</span>
		</button>
	);
}

export default memo(FolderIcon);
