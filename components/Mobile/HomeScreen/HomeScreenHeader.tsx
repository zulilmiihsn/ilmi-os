'use client';

import Image from 'next/image';
import StatusBar from '../StatusBar';

interface HomeScreenHeaderProps {
	wallpaper: string;
	isAppOpen: boolean;
	isEditing: boolean;
	onExitEditing: () => void;
	onOpenNotificationCenter: () => void;
	onOpenControlCenter: () => void;
}

export default function HomeScreenHeader({
	wallpaper,
	isAppOpen,
	isEditing,
	onExitEditing,
	onOpenNotificationCenter,
	onOpenControlCenter,
}: HomeScreenHeaderProps) {
	return (
		<>
			{/* Wallpaper */}
			<div key={wallpaper} className="wallpaper absolute inset-0 -z-10">
				{wallpaper.startsWith('/') || wallpaper.startsWith('http') ? (
					<Image
						src={wallpaper}
						alt="Wallpaper"
						fill
						className="object-cover"
						priority
						unoptimized
					/>
				) : (
					<div className="w-full h-full" style={{ background: wallpaper }}></div>
				)}
			</div>

			{!isAppOpen && (
				<StatusBar
					backgroundColor="transparent"
					textColor="white"
					onOpenNotificationCenter={onOpenNotificationCenter}
					onOpenControlCenter={onOpenControlCenter}
				/>
			)}

			{isEditing && !isAppOpen && (
				<button
					type="button"
					onClick={onExitEditing}
					aria-label="Done editing home screen"
					className="absolute top-12 right-4 z-40 px-4 py-1.5 rounded-full bg-white/25 text-white text-sm font-semibold backdrop-blur-md active:scale-95 transition-transform focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80 animate-in fade-in zoom-in-95 duration-200"
				>
					Done
				</button>
			)}
		</>
	);
}
