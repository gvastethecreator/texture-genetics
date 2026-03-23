import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToastManager } from '../../../core/state/useToastManager';

describe('useToastManager', () => {
  it('starts with empty toasts', () => {
    const { result } = renderHook(() => useToastManager());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast', () => {
    const { result } = renderHook(() => useToastManager());
    act(() => {
      result.current.addToast('success', 'Test message');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Test message');
  });

  it('removes a toast by id', () => {
    const { result } = renderHook(() => useToastManager());
    act(() => {
      result.current.addToast('info', 'First');
      result.current.addToast('error', 'Second');
    });
    expect(result.current.toasts).toHaveLength(2);

    const idToRemove = result.current.toasts[0].id;
    act(() => {
      result.current.removeToast(idToRemove);
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Second');
  });

  it('generates unique ids for toasts', () => {
    const { result } = renderHook(() => useToastManager());
    act(() => {
      result.current.addToast('success', 'A');
      result.current.addToast('success', 'B');
      result.current.addToast('success', 'C');
    });
    const ids = result.current.toasts.map(t => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
});
