import { closestCenter, pointerWithin, type CollisionDetection } from '@dnd-kit/core';
import { IOS_LAYOUT } from '../../../constants';

// Helper to generate empty slot IDs
export const getEmptySlotId = (page: number, index: number) => `empty-${page}-${index}`;

// Helper to generate page items (pure function, no hooks).
export const computePageItems = (
	pageIndex: number,
	positions: Record<string, number>,
	appsList: { id: string }[]
) => {
	const items: string[] = [];
	const PAGE_SIZE = pageIndex === 0 ? IOS_LAYOUT.PAGE0_SIZE : IOS_LAYOUT.PAGE1_SIZE;
	const offset =
		pageIndex === 0 ? 0 : IOS_LAYOUT.PAGE1_BASE + (pageIndex - 1) * IOS_LAYOUT.PAGE1_SIZE;

	for (let i = 0; i < PAGE_SIZE; i++) {
		const absoluteIndex = offset + i;
		const app = appsList.find(a => positions[a.id] === absoluteIndex);
		if (app) {
			items.push(app.id);
			continue;
		}
		items.push(getEmptySlotId(pageIndex, i));
	}
	return items;
};

// Helper to compute dock items
export const computeDockItems = (positions: Record<string, number>) => {
	const dock: { id: string; pos: number }[] = [];
	for (const [id, pos] of Object.entries(positions)) {
		if (pos >= IOS_LAYOUT.DOCK_BASE) dock.push({ id, pos });
	}
	dock.sort((a, b) => a.pos - b.pos);
	return dock.map(d => d.id);
};

export const getStatusBarColors = (appId: string | null, darkMode: boolean) => {
	if (!appId) return { backgroundColor: 'transparent', textColor: 'white' };
	if (appId === 'terminal' || appId === 'camera') {
		return { backgroundColor: '#000000', textColor: '#ffffff' };
	}
	return {
		backgroundColor: darkMode ? '#000000' : '#ffffff',
		textColor: darkMode ? '#ffffff' : '#000000',
	};
};

export const createPageAwareCollisionDetection = (
	validPageIds: string[],
	dockItemIds: string[]
): CollisionDetection => {
	const allValidIds = [...validPageIds, ...dockItemIds];
	return args => {
		const { droppableContainers, ...rest } = args;
		const filteredContainers = droppableContainers.filter(container =>
			allValidIds.includes(container.id as string)
		);
		// Edit mode moves the grid down while the drag is active. Prefer
		// the pointer's slot, not the dragged rect with that layout offset.
		const pointerCollisions = pointerWithin({
			...rest,
			droppableContainers: filteredContainers,
		});
		if (pointerCollisions.length) return pointerCollisions;

		return closestCenter({
			...rest,
			droppableContainers: filteredContainers,
		});
	};
};
