/**
 * Application-wide constants
 */

export const WINDOW = {
	MIN_WIDTH: 400,
	MIN_HEIGHT: 300,
	DEFAULT_WIDTH: 800,
	DEFAULT_HEIGHT: 600,
	DEFAULT_X: 100,
	DEFAULT_Y: 30,
	Z_INDEX_START: 1000,
} as const;

export const RESIZE = {
	DEBOUNCE_DELAY: 150,
	MIN_SWIPE_DISTANCE: 50,
} as const;

export const DOCK = {
	IOS_APPS_COUNT: 4, // Number of apps in iOS dock (last N apps)
} as const;

export const ANIMATION = {
	DURATION: {
		FAST: 100,
		NORMAL: 200,
		SLOW: 300,
		VERY_SLOW: 1000,
	},
} as const;

export const DRAG = {
	LONG_PRESS_DURATION: 400, // iOS-like long press duration (ms)
	LONG_PRESS_CANCEL_DISTANCE: 10, // Cancel long press if moved more than this (px)
	SWAP_ANIMATION_DURATION: 200, // Duration for swap animation (ms)
	SCALE_ON_DRAG: 1.15, // Scale factor when dragging
	OPACITY_ON_DRAG: 0.8, // Opacity of dragged icon
	OPACITY_ORIGINAL: 0.4, // Opacity of original icon position
} as const;

export const HOME_SCREEN = {
	SWIPE_THRESHOLD_PERCENT: 0.15,
	SWIPE_VELOCITY_THRESHOLD: 0.3,
	SWIPE_DETECTION_THRESHOLD: 5,
	GRID_GAP: 20,
	SIDE_PADDING: 16,
	ICON_HEIGHT: 84, // 64 + 20
	MAX_SLOTS: 40, // 20 per page, 2 pages total
	MIN_FLICK_DISTANCE: 20,
} as const;

/**
 * Shared iOS icon-position encoding. Positions below DOCK_BASE live on pages
 * (page 0: 0..PAGE0_SIZE, page 1: PAGE1_BASE..); positions at/above DOCK_BASE
 * live in the dock. HomeScreen, the drag handlers, and the apps store must
 * all agree on this encoding.
 */
export const IOS_LAYOUT = {
	PAGE0_SIZE: 24,
	PAGE1_SIZE: 28,
	PAGE1_BASE: 24,
	DOCK_BASE: 100,
} as const;

export const TIMING = {
	// Camera
	FLASH_DURATION: 100,
	COUNTDOWN_STEP: 1000,

	// Window animations
	WINDOW_OPEN_DELAY: 10,
	WINDOW_CLOSE_DURATION: 300,
	WINDOW_MINIMIZE_DURATION: 300,

	// App animations
	APP_OPEN_DURATION: 450,
	APP_CLOSE_DURATION: 400,
	SWIPE_ANIMATION_DURATION: 300,

	// Long press
	LONG_PRESS_FILES: 500,
	ALARM_DELETE_DURATION: 300,
	LONG_PRESS_DELETE_SHOW: 600,

	// Scroll/layout
	SCROLL_TO_TODAY_DELAY: 100,

	// Intervals
	CLOCK_UPDATE_INTERVAL: 1000,
	STOPWATCH_INTERVAL: 10,
	TIMER_INTERVAL: 100,
	BATTERY_UPDATE_INTERVAL: 300000, // 5 minutes
	NETWORK_UPDATE_INTERVAL: 30000, // 30 seconds
	MENUBAR_NETWORK_INTERVAL: 5000,
	MOBILE_CLOCK_INTERVAL: 60000, // 1 minute
} as const;

export const LAYOUT = {
	// iOS
	BOTTOM_BAR_HEIGHT: 80,
	STATUS_BAR_HEIGHT: 44,
	SWIPE_CLOSE_THRESHOLD: 0.25, // 25% of screen height

	// Touch detection
	SWIPE_FROM_TOP_THRESHOLD: 100,
} as const;
