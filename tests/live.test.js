import { describe, expect, it } from 'vitest';

import { estimateBody } from '../src/calculations/body.js';
import {
  calculateLiveBodyCounters,
  calculateLiveElapsed,
  secondsIntoLocalDay,
} from '../src/calculations/live.js';

describe('live date-based models', () => {
  it('measures the current local time of day in seconds', () => {
    const now = new Date(2026, 7, 14, 12, 30, 15, 500);
    expect(secondsIntoLocalDay(now)).toBe(45_015.5);
  });

  it('adds the current day clock to completed-day elapsed units', () => {
    const now = new Date(2026, 7, 14, 12, 0, 0);
    expect(calculateLiveElapsed(1, now)).toMatchObject({
      seconds: 129_600,
      minutes: 2_160,
      hours: 36,
      currentDaySeconds: 43_200,
      approximateSubDayUnits: true,
    });
  });

  it('advances biological counters using their model rates', () => {
    const body = estimateBody(1, {
      heartRateBpm: 60,
      cardiacOutputLitresPerMinute: 5,
      breathsPerMinute: 12,
      blinksPerAwakeMinute: 15,
      sleepHoursPerDay: 8,
    });
    const elapsed = calculateLiveElapsed(1, new Date(2026, 7, 14, 1, 0, 0));
    const live = calculateLiveBodyCounters(body, elapsed);
    expect(live.heartbeats - body.heartbeats).toBe(3_600);
    expect(live.bloodPumpedLitres - body.bloodPumpedLitres).toBe(300);
    expect(live.breaths - body.breaths).toBe(720);
    expect(live.blinks - body.blinks).toBeCloseTo(600, 8);
    expect(live.awakeFraction).toBeCloseTo(2 / 3, 8);
  });

  it('uses the infant sleep band for a birth date entered today', () => {
    const body = estimateBody(0);
    const elapsed = calculateLiveElapsed(0, new Date(2026, 7, 14, 12, 0, 0));
    const live = calculateLiveBodyCounters(body, elapsed);

    expect(live.awakeFraction).toBeCloseTo(8.5 / 24, 10);
    expect(live.marginalAwakeMinutes).toBe(8.5 * 60);
    expect(live.blinks).toBeCloseTo(3_825, 8);
  });

  it('keeps repeated clock times monotonic through a DST fall-back', () => {
    withTimeZone('America/New_York', () => {
      const firstOneThirty = new Date('2026-11-01T05:30:00.000Z');
      const secondOneThirty = new Date('2026-11-01T06:30:00.000Z');

      expect(firstOneThirty.getHours()).toBe(1);
      expect(secondOneThirty.getHours()).toBe(1);
      expect(secondsIntoLocalDay(secondOneThirty) - secondsIntoLocalDay(firstOneThirty)).toBe(3_600);

      const firstElapsed = calculateLiveElapsed(100, firstOneThirty);
      const secondElapsed = calculateLiveElapsed(100, secondOneThirty);
      expect(secondElapsed.seconds - firstElapsed.seconds).toBe(3_600);

      const body = estimateBody(100, { heartRateBpm: 60 });
      const firstBody = calculateLiveBodyCounters(body, firstElapsed);
      const secondBody = calculateLiveBodyCounters(body, secondElapsed);
      expect(secondBody.heartbeats - firstBody.heartbeats).toBe(3_600);
    });
  });

  it('advances by one real second through a DST spring-forward', () => {
    withTimeZone('America/New_York', () => {
      const beforeJump = new Date('2026-03-08T06:59:59.000Z');
      const afterJump = new Date('2026-03-08T07:00:00.000Z');

      expect(beforeJump.getHours()).toBe(1);
      expect(afterJump.getHours()).toBe(3);
      expect(secondsIntoLocalDay(afterJump) - secondsIntoLocalDay(beforeJump)).toBe(1);
      const beforeElapsed = calculateLiveElapsed(100, beforeJump);
      const afterElapsed = calculateLiveElapsed(100, afterJump);
      expect(afterElapsed.currentDayDurationSeconds).toBe(82_800);
      expect(afterElapsed.seconds - beforeElapsed.seconds).toBe(1);
    });
  });

  it('converges to the next piecewise body model without a blink jump at midnight', () => {
    const ageDays = 5_506;
    const before = new Date(2026, 7, 14, 23, 59, 59, 999);
    const midnight = new Date(2026, 7, 15, 0, 0, 0, 0);
    const beforeLive = calculateLiveBodyCounters(
      estimateBody(ageDays),
      calculateLiveElapsed(ageDays, before),
    );
    const midnightBody = estimateBody(ageDays + 1);
    const midnightLive = calculateLiveBodyCounters(
      midnightBody,
      calculateLiveElapsed(ageDays + 1, midnight),
    );

    expect(midnightLive.blinks).toBeCloseTo(midnightBody.blinks, 8);
    expect(midnightLive.blinks - beforeLive.blinks).toBeGreaterThan(0);
    expect(midnightLive.blinks - beforeLive.blinks).toBeLessThan(0.01);
  });

  it('keeps elapsed time and blinks continuous after a 25-hour local day', () => {
    withTimeZone('America/New_York', () => {
      const ageDays = 5_506;
      const before = new Date('2026-11-02T04:59:59.999Z');
      const midnight = new Date('2026-11-02T05:00:00.000Z');
      const beforeElapsed = calculateLiveElapsed(ageDays, before);
      const midnightElapsed = calculateLiveElapsed(ageDays + 1, midnight);
      const beforeLive = calculateLiveBodyCounters(estimateBody(ageDays), beforeElapsed);
      const midnightLive = calculateLiveBodyCounters(estimateBody(ageDays + 1), midnightElapsed);

      expect(beforeElapsed.currentDayDurationSeconds).toBe(90_000);
      expect(midnightElapsed.seconds - beforeElapsed.seconds).toBeCloseTo(0.001, 6);
      expect(midnightLive.heartbeats - beforeLive.heartbeats).toBeCloseTo(78 / 60_000, 6);
      expect(midnightLive.blinks - beforeLive.blinks).toBeGreaterThan(0);
      expect(midnightLive.blinks - beforeLive.blinks).toBeLessThan(0.01);
    });
  });
});

function withTimeZone(timeZone, assertion) {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = timeZone;
  try {
    assertion();
  } finally {
    if (previousTimeZone == null) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
}
