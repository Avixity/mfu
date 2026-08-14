import { describe, expect, it } from 'vitest';

import timeline1900To1949 from '../src/data/math-timeline-1900-1949.json';
import timeline1950To1999 from '../src/data/math-timeline-1950-1999.json';
import timeline2000To2026 from '../src/data/math-timeline-2000-2026.json';
import { selectTimelineEntries } from '../src/components/timeline.js';

const timeline = [...timeline1900To1949, ...timeline1950To1999, ...timeline2000To2026];

describe('mathematics timeline catalogue', () => {
  it('has one primary, sourced story for every supported birth year', () => {
    const expectedYears = Array.from({ length: 127 }, (_, index) => 1900 + index);
    const primary = timeline.filter((item) => item.birthYearDefault !== false);
    expect(primary.map(({ year }) => year).sort((a, b) => a - b)).toEqual(expectedYears);

    for (const story of timeline) {
      expect(story.title.length).toBeGreaterThan(5);
      expect(story.explanation.length).toBeGreaterThan(80);
      expect(story.whyItMatters.length).toBeGreaterThan(30);
      expect(story.people.length).toBeGreaterThan(1);
      expect(story.field.length).toBeGreaterThan(2);
      expect(story.sourceTitle.length).toBeGreaterThan(4);
      expect(story.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('contains at least ten distinct discoveries in every represented decade', () => {
    const normalisedTitles = timeline.map(({ title }) => title.trim().toLowerCase());
    expect(new Set(normalisedTitles).size).toBe(timeline.length);

    for (let decade = 1900; decade <= 2020; decade += 10) {
      const stories = timeline.filter(({ year }) => year >= decade && year <= decade + 9);
      expect(stories.length, `${decade}s story count`).toBeGreaterThanOrEqual(10);
      expect(stories.filter(({ decadeFeature }) => decadeFeature).length, `${decade}s feature count`).toBe(1);
    }
  });

  it('keeps 2026 current, primary and distinct from the 2020s feature', () => {
    const current = timeline.filter(({ year }) => year === 2026);
    expect(current).toHaveLength(1);
    expect(current[0]).toMatchObject({
      label: 'Mathematics in 2026 so far',
      birthYearDefault: true,
    });
    expect(current[0].decadeFeature).not.toBe(true);
  });

  it('retains lightweight teaching interactions for visual stories', () => {
    const interactiveStories = timeline.filter(({ demo }) => demo);
    expect(interactiveStories).toHaveLength(8);
    expect(new Set(interactiveStories.map(({ demo }) => demo.type)).size).toBeGreaterThanOrEqual(7);
  });
});

describe('timeline selection', () => {
  it('selects safely for every supported birth year', () => {
    for (let birthYear = 1900; birthYear <= 2026; birthYear += 1) {
      const selected = selectTimelineEntries(timeline, birthYear, 2026);
      expect(selected.some(({ year }) => year === birthYear), `birth story for ${birthYear}`).toBe(true);
      expect(selected.some(({ year }) => year === 2026), `present story for ${birthYear}`).toBe(true);
      expect(new Set(selected.map(({ year }) => year)).size, `unique years for ${birthYear}`).toBe(selected.length);
      expect(new Set(selected.map(({ title }) => title)).size, `unique stories for ${birthYear}`).toBe(selected.length);

      const expectedDecades = Array.from(
        { length: Math.floor((2026 - Math.floor(birthYear / 10) * 10) / 10) + 1 },
        (_, index) => Math.floor(birthYear / 10) * 10 + index * 10,
      ).filter((decade) => timeline.some(({ year }) => (
        year >= Math.max(birthYear, decade)
        && year <= Math.min(2026, decade + 9)
        && year !== birthYear
        && year !== 2026
      ))).length;
      expect(selected.filter(({ timelineRole }) => timelineRole === 'decade'), `decade stories for ${birthYear}`).toHaveLength(expectedDecades);
    }
  });

  it('shows birth, present and one different story for every lifetime decade', () => {
    const selected = selectTimelineEntries(timeline, 1900, 2026);
    expect(selected.filter(({ timelineRole }) => timelineRole === 'birth')).toHaveLength(1);
    expect(selected.filter(({ timelineRole }) => timelineRole === 'present')).toHaveLength(1);
    expect(selected.filter(({ timelineRole }) => timelineRole === 'decade')).toHaveLength(13);
    expect(selected).toHaveLength(15);
    expect(new Set(selected.map(({ title }) => title)).size).toBe(selected.length);
    expect(new Set(selected.map(({ year }) => year)).size).toBe(selected.length);
  });

  it('keeps a 2011 visitor concise', () => {
    const selected = selectTimelineEntries(timeline, 2011, 2026);
    expect(selected.map(({ year }) => year)).toContain(2011);
    expect(selected.map(({ year }) => year)).toContain(2026);
    expect(selected.filter(({ timelineRole }) => timelineRole === 'decade')).toHaveLength(2);
    expect(selected).toHaveLength(4);
  });

  it('does not duplicate the one available year for a visitor born in 2026', () => {
    const selected = selectTimelineEntries(timeline, 2026, 2026);
    expect(selected).toHaveLength(1);
    expect(selected[0]).toMatchObject({ year: 2026, timelineRole: 'birth-present' });
  });
});
