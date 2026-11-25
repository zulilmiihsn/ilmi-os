'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { detectDevice } from '../utils/deviceDetection';
import { debounce } from '../utils/debounce';
import { RESIZE } from '../constants';
import type { DeviceInfo } from '../types';
import { useSettingsStore } from '../stores/settings';
import BootScreen from '../components/BootScreen';

const Desktop = dynamic(() => import('../components/Desktop/Desktop'), {
	ssr: false,
	loading: () => <BootScreen />,
});

const HomeScreen = dynamic(() => import('../components/Mobile/HomeScreen'), {
	ssr: false,
	loading: () => <BootScreen />,
});

export default function Home() {
	const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
	const { darkMode } = useSettingsStore();

	// Sync dark mode class with store
	useEffect(() => {
		if (typeof window !== 'undefined') {
			if (darkMode) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}, [darkMode]);

	// Debounced resize handler to prevent excessive re-renders
	const debouncedHandleResize = useMemo(
		() => debounce(() => setDeviceInfo(detectDevice()), RESIZE.DEBOUNCE_DELAY),
		[]
	);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			setDeviceInfo(detectDevice());

			window.addEventListener('resize', debouncedHandleResize);
			window.addEventListener('orientationchange', debouncedHandleResize);

			return () => {
				window.removeEventListener('resize', debouncedHandleResize);
				window.removeEventListener('orientationchange', debouncedHandleResize);
			};
		}
	}, [debouncedHandleResize]);

	if (!deviceInfo) {
		return <BootScreen />;
	}

	return deviceInfo.platform === 'macos' ? <Desktop /> : <HomeScreen />;
}
