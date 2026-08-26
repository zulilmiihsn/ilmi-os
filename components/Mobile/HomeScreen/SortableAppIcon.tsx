'use client';

import React, { memo, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AppIcon from '../AppIcon';
import type { AppMetadata } from '../../../types';

interface SortableAppIconProps {
    app: AppMetadata;
    id: string;
    onClick: (appId: string) => void;
    disabled?: boolean;
    isEmpty?: boolean;
    isDock?: boolean;
    className?: string;
}

function SortableAppIcon({ app, id, onClick, disabled, isEmpty, isDock, className }: SortableAppIconProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const handleClick = useCallback(() => {
        if (!isDragging) onClick(app.id);
    }, [isDragging, onClick, app.id]);

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms ease', // Faster transition
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 0 : 'auto',
        touchAction: 'none',
        willChange: transform ? 'transform' : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(isEmpty ? {} : listeners)}
            className={`relative ${isEmpty ? '' : 'cursor-grab'} ${className || 'w-full h-full'}`}
        >
            {!isEmpty && (
                <AppIcon
                    app={app}
                    isDock={isDock}
                    onClick={handleClick}
                />
            )}
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
        prevProps.disabled === nextProps.disabled
    );
});
