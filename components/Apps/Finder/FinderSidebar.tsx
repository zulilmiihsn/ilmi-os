'use client';

import React from 'react';
import { SidebarSection } from './types';

interface FinderSidebarProps {
	sidebarSections: SidebarSection[];
	currentFolderId: string | null;
	navigateTo: (folderId: string | null) => void;
	totalItemsCount: number;
}

export const FinderSidebar: React.FC<FinderSidebarProps> = ({
	sidebarSections,
	currentFolderId,
	navigateTo,
	totalItemsCount,
}) => {
	return (
		<div className="sidebar w-48 bg-[#F0F0F0]/80 dark:bg-[#252525]/80 backdrop-blur-md border-r border-gray-300/50 dark:border-black/50 p-2 overflow-y-auto shrink-0 flex flex-col justify-between">
			<div>
				{sidebarSections.map(section => (
					<div key={section.title} className="mb-4">
						<div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase px-2 mb-1 tracking-wider">
							{section.title}
						</div>
						<div className="space-y-0.5">
							{section.items.map(item => {
								const isActive = currentFolderId === item.folderId;
								return (
									<button
										key={item.id}
										onClick={() => navigateTo(item.folderId)}
										className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
											isActive
												? 'bg-blue-500 text-white'
												: 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
										}`}
									>
										<span className={isActive ? 'text-white' : 'text-blue-500'}>
											{item.icon === 'desktop' && (
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
													<line x1="8" y1="21" x2="16" y2="21" />
													<line x1="12" y1="17" x2="12" y2="21" />
												</svg>
											)}
											{item.icon === 'file-text' && (
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
													<polyline points="14 2 14 8 20 8" />
													<line x1="16" y1="13" x2="8" y2="13" />
													<line x1="16" y1="17" x2="8" y2="17" />
												</svg>
											)}
											{item.icon === 'download' && (
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
													<polyline points="7 10 12 15 17 10" />
													<line x1="12" y1="15" x2="12" y2="3" />
												</svg>
											)}
											{item.icon === 'image' && (
												<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
													<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
													<circle cx="8.5" cy="8.5" r="1.5" />
													<polyline points="21 15 16 10 5 21" />
												</svg>
											)}
										</span>
										<span className="truncate">{item.name}</span>
									</button>
								);
							})}
						</div>
					</div>
				))}
			</div>

			{/* Storage status footer */}
			<div className="px-2 py-1 text-[11px] text-gray-400 border-t border-gray-300/40 dark:border-white/5">
				{totalItemsCount} items total
			</div>
		</div>
	);
};
