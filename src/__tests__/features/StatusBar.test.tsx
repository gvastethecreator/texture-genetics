import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../features/status-bar/StatusBar';
import { mockAppState } from '../helpers';

describe('StatusBar', () => {
    it('renders resolution display', () => {
        const state = mockAppState({ resolution: 1024 });
        render(<StatusBar state={state} />);
        expect(screen.getByText('1024px')).toBeInTheDocument();
    });

    it('renders export format', () => {
        const state = mockAppState();
        render(<StatusBar state={state} />);
        expect(screen.getByText('png')).toBeInTheDocument();
    });

    it('shows LIVE when animating', () => {
        const state = mockAppState({ animate: true });
        render(<StatusBar state={state} />);
        expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    it('shows STOP when not animating', () => {
        const state = mockAppState({ animate: false });
        render(<StatusBar state={state} />);
        expect(screen.getByText('STOP')).toBeInTheDocument();
    });

    it('displays the current texture type', () => {
        const state = mockAppState();
        render(<StatusBar state={state} />);
        expect(screen.getByText(state.textureType)).toBeInTheDocument();
    });
});
