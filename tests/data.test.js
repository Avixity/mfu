import { describe, expect, it } from 'vitest';

import timeline from '../src/data/math-timeline.json';
import worldData from '../src/data/world-data.json';
import { purchasingPowerEquivalent } from '../src/calculations/world.js';

describe('offline research data', () => {
  it('contains one complete, sourced mathematics story for every year from 2011 to 2026', () => {
    expect(timeline.map(({ year }) => year)).toEqual(
      Array.from({ length: 16 }, (_, index) => 2011 + index),
    );
    for (const story of timeline) {
      expect(story.title.length).toBeGreaterThan(5);
      expect(story.explanation.length).toBeGreaterThan(80);
      expect(story.whyItMatters.length).toBeGreaterThan(30);
      expect(story.sourceUrl).toMatch(/^https:\/\//);
    }
    expect(timeline.at(-1).label).toBe('Mathematics in 2026 so far');
  });

  it('records source and coverage metadata for every world series', () => {
    expect(worldData.dateAccessed).toBe('2026-08-14');
    for (const series of Object.values(worldData.series)) {
      expect(series.source.url).toMatch(/^https:\/\//);
      expect(series.source.dateAccessed).toBe('2026-08-14');
      expect(series.values.length).toBeGreaterThan(1);
      expect(series.values.every(({ value }) => Number.isFinite(value))).toBe(true);
      const numericYears = series.values.map(({ year }) => Number.parseInt(year, 10));
      expect(numericYears).toEqual([...numericYears].sort((a, b) => a - b));
      expect(Number.parseInt(series.latestYear, 10)).toBe(numericYears.at(-1));
    }
  });

  it('keeps the exhibition demo comparisons reproducible', () => {
    const indiaPopulation = worldData.series.indiaPopulation.values;
    expect(indiaPopulation.find(({ year }) => year === 2011)?.value).toBe(1_261_224_954);
    expect(indiaPopulation.at(-1)).toEqual({ year: 2025, value: 1_463_865_525 });

    const cpi = worldData.series.indiaConsumerPriceIndex.values;
    const birth = cpi.find(({ year }) => year === 2011).value;
    const latest = cpi.at(-1).value;
    expect(purchasingPowerEquivalent(100, birth, latest)).toBeCloseTo(213.99, 2);
  });

  it('preserves the no-interpolation policy for irregular literacy observations', () => {
    expect(worldData.series.indiaAdultLiteracy.interpolation.allowed).toBe(false);
    expect(worldData.series.indiaAdultLiteracy.displayPolicy).toBeTruthy();
  });
});
