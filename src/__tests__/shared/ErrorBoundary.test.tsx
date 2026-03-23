import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../shared/components/ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) throw new Error('Test error');
    return <div>No error</div>;
};

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Hello World</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('renders error UI when child throws', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText(/renderer crashed/i)).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it('renders custom fallback when provided', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});
