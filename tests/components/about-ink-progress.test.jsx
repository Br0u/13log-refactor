// @vitest-environment jsdom
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { motionValue } from 'motion-dom';

const state = vi.hoisted(() => ({ progress: null, settled: null, reduced: true }));
vi.mock('framer-motion', () => ({
  useReducedMotion: () => state.reduced,
  useScroll: () => ({ scrollYProgress: state.progress }),
  useSpring: () => state.settled,
  useTransform: (value, input) => typeof input === 'function' ? input(value.get()) : 1,
  useMotionValueEvent: (value, event, handler) => React.useEffect(() => value.on(event, handler), [value, event, handler]),
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    g: ({ children, ...props }) => <g {...props}>{children}</g>,
  },
}));
import AboutInkProgress from '../../components/about/AboutInkProgress';

beforeEach(() => {
  state.progress = motionValue(.25);
  state.settled = motionValue(.75);
  state.reduced = true;
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('innerHeight', 800);
  vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(2800);
});
afterEach(() => {
  cleanup();
  document.querySelectorAll('[data-ink-node]').forEach(node => node.remove());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('omits an inert server indicator and follows actual progress without lag in reduced motion', () => {
  expect(renderToStaticMarkup(<AboutInkProgress />)).toBe('');
  const { container } = render(<AboutInkProgress />);
  expect(container.firstChild.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('g').style.clipPath).toBe('inset(0 0 75% 0)');
});

it('blooms once when reaching a content node, ignores jitter, and rearms after leaving', () => {
  state.reduced = false;
  state.settled.set(0);
  const chapter = document.createElement('section');
  chapter.dataset.inkNode = '壹';
  chapter.getBoundingClientRect = () => ({ top: 800 });
  document.body.append(chapter);
  const { container, rerender } = render(<AboutInkProgress />);
  const node = container.querySelector('div[class*="inkNode"]');
  expect(node.style.top).toBe('20%');
  expect(container.querySelector('i[class*="inkBloom"]')).toBeNull();
  act(() => state.settled.set(.21));
  const first = container.querySelector('i[class*="inkBloom"]');
  expect(first).not.toBeNull();
  act(() => state.settled.set(.198));
  act(() => state.settled.set(.21));
  expect(container.querySelector('i[class*="inkBloom"]')).toBe(first);
  act(() => state.settled.set(.15));
  act(() => state.settled.set(.21));
  expect(container.querySelector('i[class*="inkBloom"]')).not.toBe(first);
  state.reduced = true;
  rerender(<AboutInkProgress />);
  expect(container.querySelector('i[class*="inkBloom"]')).toBeNull();
});
