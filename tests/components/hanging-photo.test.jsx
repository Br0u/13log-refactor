// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ reduced: false, handlers: {}, velocity: null, angle: null }));
vi.mock('next/image', () => ({ default: props => <img {...props} /> }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal();
  state.velocity = actual.motionValue(0);
  return {
  ...actual,
  useReducedMotion: () => state.reduced,
  useScroll: () => ({ scrollY: state.velocity }),
  useVelocity: () => state.velocity,
  // Inspect the spring's target here; browser checks cover its real damping.
  useSpring: value => value,
  motion: { a: ({ children, style, onPan, onPanEnd, ...props }) => {
    state.handlers = { onPan, onPanEnd };
    state.angle = style.rotate;
    return <a {...props}>{children}</a>;
  } },
}; });
import HangingPhoto from '../../components/about/HangingPhoto';
afterEach(() => { cleanup(); state.reduced = false; state.velocity.set(0); });
it('suppresses navigation after a swing gesture, but preserves new taps and keyboard activation', () => {
  render(<HangingPhoto photo={{caption: '林间', imageUrl: '/forest.jpg'}} index={0} />);
  const link = screen.getByRole('link', {name: '林间，查看相册'});
  expect(link.getAttribute('href')).toBe('/photos/random');
  link.setAttribute('href', '#album'); // jsdom has no navigation implementation.
  act(() => state.handlers.onPan({}, {offset: {x: 50, y: 0}}));
  act(() => state.handlers.onPanEnd());
  expect(fireEvent.click(link, {detail: 1})).toBe(false);
  expect(fireEvent.click(link, {detail: 0})).toBe(true);
  fireEvent.pointerDown(link);
  expect(fireEvent.click(link, {detail: 1})).toBe(true);
});
it('does not attach swing gestures when reduced motion is requested', () => {
  state.reduced = true;
  render(<HangingPhoto photo={{caption: '林间', imageUrl: '/forest.jpg'}} index={0} />);
  expect(state.handlers.onPan).toBeUndefined();
  expect(state.handlers.onPanEnd).toBeUndefined();
  act(() => state.velocity.set(5000));
  expect(state.angle).toBe(0);
});
it('reverses the scroll nudge, bounds fast scrolling, and returns to rest when scrolling stops', async () => {
  render(<HangingPhoto photo={{caption: '林间', imageUrl: '/forest.jpg'}} index={0} />);
  expect(state.angle.get()).toBe(-1.5);
  act(() => state.velocity.set(850));
  await waitFor(() => expect(state.angle.get()).toBeCloseTo(-2.5));
  act(() => state.velocity.set(-850));
  await waitFor(() => expect(state.angle.get()).toBeCloseTo(-.5));
  act(() => state.velocity.set(100000));
  await waitFor(() => expect(state.angle.get()).toBeCloseTo(-4.7));
  act(() => state.velocity.set(0));
  await waitFor(() => expect(state.angle.get()).toBeCloseTo(-1.5));
});
