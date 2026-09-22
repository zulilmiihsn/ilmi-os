import { memo, useMemo } from 'react';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SortableAppIcon from './SortableAppIcon';
import type { AppMetadata } from '../../../types';

interface HomeScreenDockProps {
	apps: AppMetadata[];
	onAppClick: (appId: string) => void;
	isEditing?: boolean;
}

function HomeScreenDock({ apps, onAppClick, isEditing }: HomeScreenDockProps) {
	const itemIds = useMemo(() => apps.map(app => app.id), [apps]);

	return (
		<div className="ios-dock fixed bottom-2 left-2 right-2 h-[96px] flex items-center justify-around px-4 ios-safe-area z-20 bg-white/10 backdrop-blur-3xl border-[1.5px] border-white/50 rounded-[35px] shadow-[0_20px_40px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(255,255,255,0.2)]">
			<SortableContext items={itemIds} strategy={horizontalListSortingStrategy}>
				{apps.map(app => (
					<SortableAppIcon
						key={app.id}
						id={app.id}
						app={app}
						onClick={onAppClick}
						isDock={true}
						isEditing={isEditing}
						className="w-[60px] h-[60px]"
					/>
				))}
			</SortableContext>
		</div>
	);
}

export default memo(HomeScreenDock);
