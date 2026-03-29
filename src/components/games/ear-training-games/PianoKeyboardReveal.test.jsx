import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PianoKeyboardReveal } from './components/PianoKeyboardReveal';

describe('PianoKeyboardReveal', () => {
  it('renders 14 white key rect elements (2 octaves)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    const whiteKeys = Array.from(rects).filter(
      (r) => parseFloat(r.getAttribute('height')) === 120
    );
    expect(whiteKeys).toHaveLength(14);
  });

  it('renders 10 black key rect elements (2 octaves)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    const blackKeys = Array.from(rects).filter(
      (r) => parseFloat(r.getAttribute('height')) === 72
    );
    expect(blackKeys).toHaveLength(10);
  });

  it('note1 white key (C4) has fill="#60a5fa" (blue-400)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    const note1Key = Array.from(rects).find(
      (r) => r.getAttribute('data-note') === 'C4' && r.getAttribute('data-state') === 'note1'
    );
    expect(note1Key).toBeTruthy();
    expect(note1Key.getAttribute('fill')).toBe('#60a5fa');
  });

  it('note2 white key (E4) has fill="#fb923c" (orange-400)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    const note2Key = Array.from(rects).find(
      (r) => r.getAttribute('data-note') === 'E4' && r.getAttribute('data-state') === 'note2'
    );
    expect(note2Key).toBeTruthy();
    expect(note2Key.getAttribute('fill')).toBe('#fb923c');
  });

  it('in-between keys have dim fill when showInBetween=true', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" showInBetween={true} visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    // D4 should be between C4 and E4 (white key)
    const betweenKey = Array.from(rects).find(
      (r) => r.getAttribute('data-note') === 'D4' && r.getAttribute('data-state') === 'between'
    );
    expect(betweenKey).toBeTruthy();
    expect(betweenKey.getAttribute('fill')).toContain('rgba(255,255,255');
  });

  it('in-between keys do NOT have dim fill when showInBetween=false', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" showInBetween={false} visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    // D4 should be between C4 and E4 but default (white)
    const d4Key = Array.from(rects).find(
      (r) => r.getAttribute('data-note') === 'D4'
    );
    expect(d4Key).toBeTruthy();
    expect(d4Key.getAttribute('data-state')).toBe('default');
    expect(d4Key.getAttribute('fill')).toBe('#ffffff');
  });

  it('container has dir="ltr"', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const outerDiv = container.firstChild;
    expect(outerDiv.getAttribute('dir')).toBe('ltr');
  });

  it('SVG has aria-hidden="true"', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('when visible=true, container does NOT have translateY(100%) style', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    const outerDiv = container.firstChild;
    const transform = outerDiv.style.transform;
    expect(transform).not.toContain('translateY(100%)');
  });

  it('when visible=false, container has translateY(100%) style (slide hidden)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={false} />
    );
    const outerDiv = container.firstChild;
    const transform = outerDiv.style.transform;
    expect(transform).toContain('translateY(100%)');
  });

  it('renders intervalLabel text when prop provided', () => {
    render(
      <PianoKeyboardReveal
        note1="C4"
        note2="E4"
        intervalLabel="SKIP — C4 to E4"
        visible={true}
      />
    );
    expect(screen.getByText('SKIP — C4 to E4')).toBeTruthy();
  });

  it('renders subLabel text when prop provided', () => {
    render(
      <PianoKeyboardReveal
        note1="C4"
        note2="E4"
        intervalLabel="SKIP — C4 to E4"
        subLabel="Jumped over D4"
        visible={true}
      />
    );
    expect(screen.getByText('Jumped over D4')).toBeTruthy();
  });

  it('does NOT render intervalLabel or subLabel when props are null', () => {
    render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={true} />
    );
    expect(screen.queryByText('SKIP — C4 to E4')).toBeNull();
    expect(screen.queryByText('Jumped over D4')).toBeNull();
  });

  it('note1 black key (C#4) has fill="#3b82f6" (blue-500)', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C#4" note2="E4" visible={true} />
    );
    const svg = container.querySelector('svg');
    const rects = svg.querySelectorAll('rect');
    const note1Key = Array.from(rects).find(
      (r) => r.getAttribute('data-note') === 'C#4' && r.getAttribute('data-state') === 'note1'
    );
    expect(note1Key).toBeTruthy();
    expect(note1Key.getAttribute('fill')).toBe('#3b82f6');
  });

  it('uses reducedMotion to show opacity instead of transform', () => {
    const { container } = render(
      <PianoKeyboardReveal note1="C4" note2="E4" visible={false} reducedMotion={true} />
    );
    const outerDiv = container.firstChild;
    // Should not have transform, just opacity=0
    expect(outerDiv.style.transform).toBeFalsy();
    expect(outerDiv.style.opacity).toBe('0');
  });
});
