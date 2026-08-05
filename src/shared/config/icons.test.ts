import { describe, expect, it } from 'vitest';
import { DEFAULT_ICON, WARNING_ICON, iconPathFor } from './icons.js';

describe('iconPathFor', () => {
  it('default / warning は固定パス', () => {
    expect(iconPathFor({ kind: 'default' })).toBe(DEFAULT_ICON);
    expect(iconPathFor({ kind: 'warning' })).toBe(WARNING_ICON);
  });

  it('progress は 10% 刻みに丸める', () => {
    expect(iconPathFor({ kind: 'progress', percent: 33 })).toBe('/images/progress30.png');
    expect(iconPathFor({ kind: 'progress', percent: 35 })).toBe('/images/progress40.png');
  });

  it('progress は下限 10% / 上限 100% に切り詰める', () => {
    expect(iconPathFor({ kind: 'progress', percent: 0 })).toBe('/images/progress10.png');
    expect(iconPathFor({ kind: 'progress', percent: 150 })).toBe('/images/progress100.png');
  });
});
