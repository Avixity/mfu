import { describe, expect, it } from 'vitest';

import worldData from '../src/data/world-data.json';
import { comparisonWindow, purchasingPowerEquivalent } from '../src/calculations/world.js';

describe('offline research data', () => {
  it('records source and coverage metadata for every world series', () => {
    expect(worldData.dateAccessed).toBe('2026-08-14');
    for (const series of Object.values(worldData.series)) {
      expect(series.source.url).toMatch(/^https:\/\//);
      expect(series.source.dateAccessed).toBe('2026-08-14');
      expect(series.values.length).toBeGreaterThan(0);
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

  it('provides an honest calculable window for a visitor born in 1900', () => {
    for (const series of Object.values(worldData.series)) {
      const window = comparisonWindow(series, 1900, {
        interpolateMissing: Boolean(series.interpolation?.allowed),
      });
      expect(window.available).toBe(true);
      expect(['birth-year', 'series-start']).toContain(window.mode);
      expect(Number.isFinite(window.start.value)).toBe(true);
      expect(Number.isFinite(window.latest.value)).toBe(true);
      expect(window.start.year).toBeGreaterThanOrEqual(1900);
      expect(window.start.year).toBeLessThanOrEqual(window.latest.year);
    }
  });

  it('keeps historical benchmarks separate and labels their uncertainty', () => {
    const india = worldData.series.indiaPopulationHistorical;
    expect(india.values[0].year).toBe(1901);
    expect(india.historicalBenchmark).toBe(true);
    expect(india.notes.join(' ')).toMatch(/first census during their lifetime/i);

    const world = worldData.series.worldPopulationHistorical;
    const benchmark = world.values[0];
    expect(benchmark.year).toBe(1900);
    expect(benchmark.lowerBound).toBeLessThan(benchmark.value);
    expect(benchmark.upperBound).toBeGreaterThan(benchmark.value);
    expect(benchmark.estimateType).toMatch(/estimate/i);
    expect(world.interpolation.allowed).toBe(false);
  });
});
