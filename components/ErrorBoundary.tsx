'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="w-screen h-screen flex items-center justify-center bg-gray-900 text-white">
					<div className="text-center p-8">
						<h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
						<p className="text-gray-400 mb-6">
							{this.state.error?.message || 'An unexpected error occurred'}
						</p>
						<button
							onClick={this.handleReset}
							className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
						>
							Try again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
