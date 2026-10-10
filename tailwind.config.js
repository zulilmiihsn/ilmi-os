/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class',
	content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
	theme: {
		extend: {
			colors: {
				// macOS colors
				'macos-blue': '#007AFF',
				'macos-gray': '#8E8E93',
				'macos-bg': 'rgba(255, 255, 255, 0.1)',
				'macos-bg-dark': 'rgba(0, 0, 0, 0.2)',
				// iOS colors
				'ios-blue': '#007AFF',
				'ios-green': '#34C759',
				'ios-red': '#FF3B30',
				'ios-yellow': '#FFCC00',
				'ios-orange': '#FF9500',
				'ios-indigo': '#5856D6',
				// Calculator specific
				'ios-calc-num': '#333333',
				'ios-calc-func': '#A5A5A5',
				'ios-gray': '#8E8E93',
				'ios-gray2': '#AEAEB2',
				'ios-gray3': '#C7C7CC',
				'ios-gray4': '#D1D1D6',
				'ios-gray5': '#E5E5EA',
				'ios-gray6': '#F2F2F7',
				'ios-separator': '#C6C6C8', // Light mode separator
				// Dark Mode Variants (Manual)
				'ios-dark-gray6': '#1C1C1E',
				'ios-dark-gray5': '#2C2C2E',
				'ios-dark-gray4': '#3A3A3C',
				'ios-dark-gray3': '#48484A',
				'ios-dark-gray2': '#636366',
				'ios-dark-separator': '#38383A',
				// Theme colors (mapped to CSS variables)
				'bg-primary': 'var(--bg-primary)',
				'bg-secondary': 'var(--bg-secondary)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
			},
			fontFamily: {
				sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont'],
			},
			fontSize: {
				'ios-large-title': ['34px', { lineHeight: '41px', letterSpacing: '0.37px', fontWeight: '700' }],
				'ios-title1': ['28px', { lineHeight: '34px', letterSpacing: '0.36px', fontWeight: '700' }],
				'ios-title2': ['22px', { lineHeight: '28px', letterSpacing: '0.35px', fontWeight: '700' }],
				'ios-title3': ['20px', { lineHeight: '25px', letterSpacing: '0.38px', fontWeight: '600' }],
				'ios-headline': ['17px', { lineHeight: '22px', letterSpacing: '-0.41px', fontWeight: '600' }],
				'ios-body': ['17px', { lineHeight: '22px', letterSpacing: '-0.41px', fontWeight: '400' }],
				'ios-callout': ['16px', { lineHeight: '21px', letterSpacing: '-0.32px', fontWeight: '400' }],
				'ios-subhead': ['15px', { lineHeight: '20px', letterSpacing: '-0.24px', fontWeight: '400' }],
				'ios-footnote': ['13px', { lineHeight: '18px', letterSpacing: '-0.08px', fontWeight: '400' }],
				'ios-caption1': ['12px', { lineHeight: '16px', letterSpacing: '0px', fontWeight: '400' }],
				'ios-caption2': ['11px', { lineHeight: '13px', letterSpacing: '0.07px', fontWeight: '400' }],
			},
			borderRadius: {
				'ios-icon': '22px',
				'ios-card': '14px',
				'macos-window': '10px',
			},
		},
	},
	plugins: [],
};
