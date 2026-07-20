import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    viewId: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[ErrorBoundary] Caught error in view "${this.props.viewId}":`, error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="text-red-500 font-bold p-5 border-2 border-red-500 rounded-lg bg-red-50 font-sans">
                    Invalid problem data: {this.state.error?.message}
                </div>
            );
        }

        return this.props.children;
    }
}
