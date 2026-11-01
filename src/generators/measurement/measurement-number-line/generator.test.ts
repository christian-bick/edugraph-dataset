import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {isValidMeasurementNumberLineProblem, getMeasurementNumberLinePresentation} from '../../../visuals/views/measurement/measurement-number-line/helpers.ts';
import {MeasurementNumberLineGenerator} from './generator.ts';
import {measurementLineCaseCount, measurementLineFrameAt, measurementLineRangeProfiles} from './numeric-domain.ts';

const kinds = ['length', 'time', 'liquid-volume', 'weight', 'money'] as const;

describe('MeasurementNumberLineGenerator', () => {
    it('retains all80 lines and original within-profile probabilities over100 weighted source tickets', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const measurementKind of kinds) {
            for (const tickCount of [4, 8, 10]) for (let targetIndex = 2; targetIndex < tickCount; targetIndex++) {
                expected.set([measurementKind, tickCount === 10 ? 'decimal' : 'fraction', tickCount, targetIndex].join(':'),
                    tickCount === 4 ? 3 : 1);
            }
        }
        const generator = new MeasurementNumberLineGenerator(), draw = vi.spyOn(rng, 'random');
        let tickets = 0;
        try {
            for (const measurementKind of kinds) for (const numberKind of ['fraction', 'decimal'] as const) {
                for (const {range} of measurementLineRangeProfiles) {
                    const count = measurementLineCaseCount(numberKind, range);
                    for (let index = 0; index < count; index++) {
                        draw.mockClear().mockReturnValue((index + 0.5) / count);
                        const {data} = generator.generate({measurementKind, numberKind, range});
                        expect(isValidMeasurementNumberLineProblem(data)).toBe(true);
                        const tickCount = data.tickValues.length - 1;
                        const key = [measurementKind, numberKind, tickCount, data.targetIndex].join(':');
                        seen.set(key, (seen.get(key) ?? 0) + 1);
                        const values = data.tickValues.map(value => value.numerator / value.denominator);
                        expect(hasCanonicalRangeWitness([...values, data.targetIndex], range)).toBe(true);
                        const presentation = getMeasurementNumberLinePresentation(data);
                        expect(presentation.explanation).toContain(`count ${data.targetIndex} equal intervals`);
                        expect(Object.keys(data).sort()).toEqual(['measurementKind', 'numberKind', 'targetIndex', 'tickValues', 'unitId']);
                        expect(draw).toHaveBeenCalledTimes(1);
                        tickets++;
                    }
                }
            }
            expect(seen).toEqual(expected);
            expect(seen.size).toBe(80);
            expect(tickets).toBe(100);
            expect(measurementLineRangeProfiles.map(({range}) => measurementLineCaseCount('fraction', range))).toEqual([10, 2]);
            expect(measurementLineRangeProfiles.map(({range}) => measurementLineCaseCount('decimal', range))).toEqual([4, 4]);
        } finally { draw.mockRestore(); }
    });

    it('rejects malformed configurations, profiles and ticket indices before sampling', () => {
        const generator = new MeasurementNumberLineGenerator(), draw = vi.spyOn(rng, 'random');
        const range = measurementLineRangeProfiles[0]!.range;
        try {
            for (const config of [null, {}, {measurementKind: 'distance', numberKind: 'fraction'},
                {measurementKind: 'length', numberKind: 'integer'}, {measurementKind: 'length', numberKind: 'fraction'},
                {measurementKind: 'length', numberKind: 'fraction', range: {min: 0, max: 5}}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            for (const index of [-1, 0.5, measurementLineCaseCount('fraction', range)]) {
                expect(() => measurementLineFrameAt('fraction', range, index)).toThrow();
            }
            expect(measurementLineCaseCount('fraction', {...range, min: 5})).toBe(0);
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('replays the selected line and random continuation exactly', () => {
        const generator = new MeasurementNumberLineGenerator();
        const config = {measurementKind: 'money', numberKind: 'decimal', range: measurementLineRangeProfiles[1]!.range} as const;
        rng.setSeed('measurement-line');
        const first = generator.generate(config), continuation = rng.random();
        rng.setSeed('measurement-line');
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
    });
});
