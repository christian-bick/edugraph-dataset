import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {ContextualCoordinateProblem} from '../../../types/problems.ts';
import {CoordinateContextGenerator} from './generator.ts';

const LOCATION_IDS = ['pond', 'garden', 'playground'] as const;

const assertContext = (data: ContextualCoordinateProblem): void => {
    expect(data.kind).toBe('contextual-coordinate-locations');
    expect(data.situation).toEqual({
        kind: 'park-map',
        originLandmark: 'park-gate',
        horizontalQuantity: {
            kind: 'eastward-distance',
            positiveDirection: 'east',
            unitId: 'block'
        },
        verticalQuantity: {
            kind: 'northward-distance',
            positiveDirection: 'north',
            unitId: 'block'
        }
    });
    expect(data.locations.map(location => location.id)).toEqual(LOCATION_IDS);
    expect(LOCATION_IDS).toContain(data.referenceLocationId);
    expect(new Set(data.locations.map(location => `${location.xValue},${location.yValue}`)).size).toBe(3);
    for (const location of data.locations) {
        expect(Number.isSafeInteger(location.xValue)).toBe(true);
        expect(Number.isSafeInteger(location.yValue)).toBe(true);
        expect(location.xValue).toBeGreaterThanOrEqual(1);
        expect(location.xValue).toBeLessThanOrEqual(8);
        expect(location.yValue).toBeGreaterThanOrEqual(1);
        expect(location.yValue).toBeLessThanOrEqual(8);
    }
    const reference = data.locations.find(location => location.id === data.referenceLocationId)!;
    expect(reference.xValue).not.toBe(reference.yValue);
};

describe('CoordinateContextGenerator', () => {
    const generator = new CoordinateContextGenerator();

    it('produces three distinct first-quadrant landmarks and exact east/north quantities', () => {
        const references = new Set<string>();
        const coordinatePairs = new Set<string>();
        const components = new Set<number>();
        for (let seed = 0; seed < 240; seed++) {
            setSeed(`coordinate-context-${seed}`);
            const data = generator.generate({}).data;
            assertContext(data);
            references.add(data.referenceLocationId);
            for (const location of data.locations) {
                coordinatePairs.add(`${location.xValue},${location.yValue}`);
                components.add(location.xValue);
                components.add(location.yValue);
            }

            setSeed(`coordinate-context-${seed}`);
            expect(generator.generate({}).data).toEqual(data);
        }
        expect(references).toEqual(new Set(LOCATION_IDS));
        expect(components).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8]));
        expect(coordinatePairs.size).toBeGreaterThanOrEqual(50);
    });

    it('requires a configuration object for the invariant schema', () => {
        expect(() => generator.generate({})).not.toThrow();
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
        expect(() => generator.generate(undefined as never)).toThrow('Configuration object is missing or null.');
    });
});
