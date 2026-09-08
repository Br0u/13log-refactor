// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(() => true),
  useScroll: () => ({scrollY: 0}),
  useMotionValue: (initial) => {
    const value = React.useRef(initial);
    return React.useMemo(() => ({get: () => value.current, set: (next) => { value.current = next; }}), []);
  },
  useSpring: (value) => value,
  useTransform: vi.fn(() => undefined),
  motion: {
    div: ({children, ...props}) => <div {...props}>{children}</div>,
    g: ({children, ...props}) => <g {...props}>{children}</g>,
    path: (props) => <path {...props} />,
  },
}));
import {useReducedMotion, useTransform} from 'framer-motion';
import AboutScroll from '../../components/about/AboutScroll';
beforeEach(() => {
  useReducedMotion.mockReturnValue(true);
  useTransform.mockClear();
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('About scroll accessibility', () => {
  it('shows the full note without animated mode when reduced motion is enabled', () => {
    render(<AboutScroll><p>卷中小记</p></AboutScroll>);
    expect(screen.getByText('卷中小记')).toBeTruthy();
    expect(document.querySelector('[data-scroll-animated]')).toBeNull();
    expect(document.querySelector('[data-scroll-static]')).not.toBeNull();
  });
  it('enhances the decorative opening after mounting', () => {
    useReducedMotion.mockReturnValue(false);
    render(<AboutScroll><p>卷中小记</p></AboutScroll>);
    expect(screen.getByText('卷中小记')).toBeTruthy();
    expect(document.querySelector('[data-scroll-animated]')).not.toBeNull();
  });
  it('starts rolled at the document top and finishes when the track meets the viewport bottom', () => {
    vi.stubGlobal('innerHeight', 900);
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({top: 404, bottom: 1256});
    render(<AboutScroll><p>卷中小记</p></AboutScroll>);
    const [[, end], normalize] = useTransform.mock.calls[0];
    expect(end.get()).toBe(356);
    expect(normalize([0, end.get()])).toBe(0);
    expect(normalize([356, end.get()])).toBe(1);
    expect(normalize([900, end.get()])).toBe(1);
  });
});
