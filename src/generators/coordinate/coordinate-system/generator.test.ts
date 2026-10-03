import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CoordinateSystemProblem} from '../../../types/problems.ts';
import {CoordinateSystemGenerator} from './generator.ts';

const expectExactAxis = (
    axis: CoordinateSystemProblem['axes']['horizontal'] | CoordinateSystemProblem['axes']['vertical']
): void => {
    expect([1, 2]).toContain(axis.tickStep);
    expect(axis.tickValues.length).toBeGreaterThanOrEqual(5);
    expect(axis.tickValues.length).toBeLessThanOrEqual(9);
    expect(axis.tickValues).toEqual(Array.from({length: axis.tickValues.length},
        (_, index) => index * axis.tickStep));
    expect(axis.tickValues[0]).toBe(0);
    expect(axis.tickValues.at(-1)).toBeLessThanOrEqual(16);
    expect(axis.tickValues.every(value => Number.isSafeInteger(value) && value >= 0)).toBe(true);
};

describe('CoordinateSystemGenerator', () => {
    const generator = new CoordinateSystemGenerator();

    it('samples exact perpendicular axes, common zero, and distinct component travels', () => {
        const stepPairs = new Set<string>();
        const intervalPairs = new Set<string>();
        const travelPairs = new Set<string>();
        let xTravelIsLarger = false;
        let yTravelIsLarger = false;
        for (let seed = 0; seed < 240; seed++) {
            setSeed(`coordinate-system-${seed}`);
            const data = generator.generate({}).data;
            expect(data.kind).toBe('coordinate-system-foundations');
            expect(data.origin).toEqual({x: 0, y: 0});
            expect(data.rightAngleDegrees).toBe(90);
            const x = data.axes.horizontal;
            const y = data.axes.vertical;
            expect(x.axisName).toBe('x');
            expect(x.coordinateName).toBe('x');
            expect(x.positiveUnitVector).toEqual({x: 1, y: 0});
            expect(y.axisName).toBe('y');
            expect(y.coordinateName).toBe('y');
            expect(y.positiveUnitVector).toEqual({x: 0, y: 1});
            expect(x.positiveUnitVector.x * y.positiveUnitVector.x
                + x.positiveUnitVector.y * y.positiveUnitVector.y).toBe(0);
            expectExactAxis(x);
            expectExactAxis(y);
            expect(x.tickValues.slice(1, -1)).toContain(data.travel.xUnits);
            expect(y.tickValues.slice(1, -1)).toContain(data.travel.yUnits);
            expect(data.travel.xUnits).toBeGreaterThan(0);
            expect(data.travel.yUnits).toBeGreaterThan(0);
            expect(data.travel.xUnits).not.toBe(data.travel.yUnits);
            expect(Number.isSafeInteger(data.travel.xUnits)).toBe(true);
            expect(Number.isSafeInteger(data.travel.yUnits)).toBe(true);

            stepPairs.add(`${x.tickStep}-${y.tickStep}`);
            intervalPairs.add(`${x.tickValues.length}-${y.tickValues.length}`);
            travelPairs.add(`${data.travel.xUnits}-${data.travel.yUnits}`);
            xTravelIsLarger ||= data.travel.xUnits > data.travel.yUnits;
            yTravelIsLarger ||= data.travel.yUnits > data.travel.xUnits;

            setSeed(`coordinate-system-${seed}`);
            expect(generator.generate({}).data).toEqual(data);
        }
        expect(stepPairs).toEqual(new Set(['1-1', '1-2', '2-1', '2-2']));
        expect(intervalPairs.size).toBeGreaterThanOrEqual(12);
        expect(travelPairs.size).toBeGreaterThanOrEqual(30);
        expect(xTravelIsLarger).toBe(true);
        expect(yTravelIsLarger).toBe(true);
    });

    it('requires a configuration object even for the invariant schema', () => {
        expect(() => generator.generate({})).not.toThrow();
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
        expect(() => generator.generate(undefined as never)).toThrow('Configuration object is missing or null.');
    });
});
