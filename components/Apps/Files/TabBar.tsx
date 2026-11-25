'use client';

import { Clock, Folder, Users } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptic';

type FilesTabId = 'recents' | 'shared' | 'browse';

interface TabBarProps {
	activeTab: FilesTabId;
	onTabChange: (tab: FilesTabId) => void;
	darkMode: boolean;
}

const TABS: { id: FilesTabId; label: string }[] = [
	{ id: 'recents', label: 'Recents' },
	{ id: 'shared', label: 'Shared' },
	{ id: 'browse', label: 'Browse' },
];

function renderTabIcon(id: FilesTabId, isActive: boolean) {
	const className = `w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.7]'}`;
	switch (id) {
		case 'recents':
			return <Clock aria-hidden="true" className={className} />;
		case 'shared':
			return <Users aria-hidden="true" className={className} />;
		case 'browse':
			return <Folder aria-hidden="true" className={className} />;
	}
}

export default function TabBar({ activeTab, onTabChange, darkMode }: TabBarProps) {
	return (
		<div className="pb-safe absolute bottom-3 left-4 right-4 z-20 flex justify-center pointer-events-none select-none">
			<div
				role="tablist"
				aria-label="Files navigation"
				className={`w-full max-w-[340px] px-3 py-2 rounded-full backdrop-blur-2xl flex items-center justify-around border shadow-[0_8px_20px_-4px_rgba(0,0,0,0.08)] pointer-events-auto transition-colors ${
					darkMode ? 'bg-[#1c1c1e]/85 border-white/15' : 'bg-white/85 border-black/5'
				}`}
			>
				{TABS.map(tab => {
					const isActive = activeTab === tab.id;
					return (
						<button
							key={tab.id}
							type="button"
							role="tab"
							aria-selected={isActive}
							onClick={() => {
								triggerHaptic('light');
								onTabChange(tab.id);
							}}
							className={`relative flex flex-col items-center justify-center py-1.5 px-4 rounded-full transition-all duration-200 active:scale-90 ${
								isActive
									? 'text-ios-blue bg-ios-blue/10'
									: 'text-ios-gray hover:text-gray-900 dark:hover:text-white'
							}`}
						>
							{renderTabIcon(tab.id, isActive)}
							<span className="text-[11px] font-medium tracking-tight">{tab.label}</span>
						</button>
					);
				})}
			</div>
		</div>
	);
}
