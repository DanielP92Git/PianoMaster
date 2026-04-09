import { describe, it, expect } from 'vitest';

describe('VisualRecognitionGame', () => {
  it.todo('renders 4 icon cards when game starts');
  it.todo('shows "Which one is a [duration]?" prompt with correct duration name');
  it.todo('marks correct card green and auto-advances after 800ms');
  it.todo('marks wrong card red, highlights correct card, auto-advances after 1200ms');
  it.todo('shows VictoryScreen after 5 questions with correct score');
  it.todo('tracks progress dots (green=correct, red=wrong)');
  it.todo('integrates with trail via location.state (nodeId, exerciseIndex)');
});
