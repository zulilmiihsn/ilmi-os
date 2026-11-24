'use client';

import type { HTMLAttributes } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { AppMetadata } from '../../../types';
import { DRAG } from '../../../constants';
import AppIcon from '../AppIcon';
import Widget from '../Widget';
import SortableAppIcon from './SortableAppIcon';

function HomeScreenGrid({
	isEditing,
	...props
}: HTMLAttributes<HTMLDivElement> & { isEditing: boolean }) {
	const { measureDroppableContainers } = useDndContext();
	return (
		<div
			{...props}
			className={`absolute inset-0 pb-32 overflow-hidden transition-[padding-top] duration-300 ease-out ${isEditing ? 'pt-24' : 'pt-12'}`}
			onTransitionEnd={event => {
				// Padding and page sliding move slots without resizing them, so
				// dnd-kit's per-icon ResizeObserver cannot refresh these rects.
				if (
					(event.target === event.currentTarget && event.propertyName === 'padding-top') ||
					(event.target === event.currentTarget.firstElementChild &&
						event.propertyName === 'transform')
				) {
					measureDroppableContainers([]);
				}
			}}
		/>
	);
}

interface HomeScreenPagesProps {
	isEditing: boolean;
	currentPage: number;
	page0Items: string[];
	page1Items: string[];
	appsMap: Map<string, AppMetadata>;
	onAppClick: (appId: string) => void;
	onEmptyPressStart: (e: React.PointerEvent) => void;
	onEmptyPressMove: (e: React.PointerEvent) => void;
	onEmptyPressEnd: () => void;
}

export default function HomeScreenPages({
	isEditing,
	currentPage,
	page0Items,
	page1Items,
	appsMap,
	onAppClick,
	onEmptyPressStart,
	onEmptyPressMove,
	onEmptyPressEnd,
}: HomeScreenPagesProps) {
	const renderGridItem = (id: string) => {
		const isApp = !id.startsWith('empty-');
		if (isApp) {
			const app = appsMap.get(id);
			if (!app) return null;
			return (
				<SortableAppIcon
					key={id}
					id={id}
					app={app}
					onClick={onAppClick}
					isEditing={isEditing}
				/>
			);
		}
		// ENABLE empty slots as drop targets (remove disabled=true).
		// They are not draggable because we don't attach listeners in SortableAppIcon if isEmpty=true.
		return (
			<SortableAppIcon
				key={id}
				id={id}
				app={{ id, name: '', icon: '', platform: 'ios', component: 'placeholder' }}
				onClick={() => {}}
				isEmpty={true}
			/>
		);
	};

	return (
		<HomeScreenGrid
			isEditing={isEditing}
			onPointerDown={onEmptyPressStart}
			onPointerMove={onEmptyPressMove}
			onPointerUp={onEmptyPressEnd}
			onPointerCancel={onEmptyPressEnd}
		>
			<div
				className="flex h-full w-[200vw]"
				style={{
					transform: `translateX(-${currentPage * 100}vw)`,
					transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
				}}
			>
				{/* Page 0 */}
				<div className="ios-app-grid-page w-screen h-full px-4">
					<SortableContext items={page0Items} strategy={rectSortingStrategy}>
						<div className="grid grid-cols-4 gap-5">
							<div className="col-span-2 row-span-2 pointer-events-none">
								<Widget type="battery" />
							</div>
							{page0Items.map(id => (
								<div key={id} className="w-full aspect-square">
									{renderGridItem(id)}
								</div>
							))}
						</div>
					</SortableContext>
				</div>

				{/* Page 1 */}
				<div className="ios-app-grid-page w-screen h-full px-4">
					<SortableContext items={page1Items} strategy={rectSortingStrategy}>
						<div className="grid grid-cols-4 gap-5">
							{page1Items.map(id => (
								<div key={id} className="w-full aspect-square">
									{renderGridItem(id)}
								</div>
							))}
						</div>
					</SortableContext>
				</div>
			</div>
		</HomeScreenGrid>
	);
}

export function DragOverlayAppIcon({ app }: { app: AppMetadata }) {
	return (
		<div
			className="w-16 h-16 pointer-events-none"
			style={{
				transform: `scale(${DRAG.SCALE_ON_DRAG})`,
				filter: 'drop-shadow(0 12px 16px rgba(0, 0, 0, 0.35))',
			}}
		>
			{/* Pass isDragging=false to AppIcon so it renders fully opaque without the 'ios-dragging' styles that might reduce opacity.
			    The opacity/ghosting of the *original* item is handled by SortableAppIcon.
				The *dragged* copy (overlay) should be clear and solid. */}
			<AppIcon app={app} isDragging={false} />
		</div>
	);
}
