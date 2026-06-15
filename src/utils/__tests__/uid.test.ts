import { uid } from '../uid';

describe('uid — same-millisecond collision safety', () => {
  it('generates no duplicates across a tight same-tick burst', () => {
    // Pin the clock so every id in the loop shares one millisecond timestamp —
    // the worst case the random suffix alone used to have to cover.
    const spy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    try {
      const ids = Array.from({ length: 50_000 }, () => uid());
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      spy.mockRestore();
    }
  });

  it('stays unique even when Math.random returns a degenerate short value', () => {
    // Math.random() === 0.5 used to yield a 1-char suffix; the monotonic
    // counter must keep ids distinct regardless.
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    const rnd = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    try {
      const ids = Array.from({ length: 1000 }, () => uid());
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      now.mockRestore();
      rnd.mockRestore();
    }
  });

  it('always emits a fixed-length 8-char random block', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // smallest possible value
    try {
      const block = uid().split('-')[2];
      expect(block).toHaveLength(8);
    } finally {
      (Math.random as jest.Mock).mockRestore();
    }
  });
});
