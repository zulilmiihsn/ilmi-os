'use client';

import React, { memo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppIcon from '../AppIcon';
import FolderIcon from './FolderIcon';
import type { AppMetadata } from '../../../types';
import type { AppFolder } from '../../../stores/apps';

interface SortableAppIconProps {
	app: AppMetadata;
	id: string;
	onClick: (appId: string) => void;
	disabled?: boolean;
	isEmpty?: boolean;
	isDock?: boolean;
	className?: string;
	/** iOS-style edit mode: icon jiggles to signal it can be rearranged. */
	isEditing?: boolean;
	/** When set, renders a folder instead of an app icon. */
	folder?: AppFolder;
	onOpenFolder?: (folderId: string) => void;
}

/** Cheap stable hash so jiggle phase varies per icon without extra props. */
function hashId(id: string): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

function SortableAppIcon({
	app,
	id,
	onClick,
	disabled,
	isEmpty,
	isDock,
	className,
	isEditing,
	folder,
	onOpenFolder,
}: SortableAppIconProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
		disabled,
	});

	const handleClick = useCallback(() => {
		if (!isDragging) onClick(app.id);
	}, [isDragging, onClick, app.id]);

	const jiggling = isEditing && !isEmpty && !isDragging;
	const style: React.CSSProperties = {
		transform: CSS.Transform.toString(transform),
		// Springy settle when icons swap places around the dragged item.
		transition: transition || 'transform 260ms cubic-bezier(0.34, 1.35, 0.64, 1)',
		opacity: isDragging ? 0 : 1,
		zIndex: isDragging ? 0 : 'auto',
		touchAction: 'none',
		willChange: transform ? 'transform' : 'auto',
		animationDelay: jiggling ? `${hashId(id) % 200}ms` : undefined,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			{...attributes}
			{...(isEmpty ? {} : listeners)}
			className={`relative ${isEmpty ? '' : 'cursor-grab'} ${jiggling ? (hashId(id) % 2 === 0 ? 'ios-jiggle' : 'ios-jiggle-reverse') : ''} ${className || 'w-full h-full'}`}
		>
			{!isEmpty &&
				(folder && onOpenFolder ? (
					<FolderIcon folder={folder} onOpen={onOpenFolder} />
				) : (
					<AppIcon app={app} isDock={isDock} onClick={handleClick} />
				))}
		</div>
	);
}

// Custom comparison - only re-render if important props change
export default memo(SortableAppIcon, (prevProps, nextProps) => {
	// For empty slots, only check id
	if (prevProps.isEmpty && nextProps.isEmpty) {
		return prevProps.id === nextProps.id;
	}

	// For app icons, check id, app.id, isEmpty, isDock
	return (
		prevProps.id === nextProps.id &&
		prevProps.app.id === nextProps.app.id &&
		prevProps.isEmpty === nextProps.isEmpty &&
		prevProps.isDock === nextProps.isDock &&
		prevProps.disabled === nextProps.disabled &&
		prevProps.isEditing === nextProps.isEditing &&
		prevProps.folder === nextProps.folder
	);
});
