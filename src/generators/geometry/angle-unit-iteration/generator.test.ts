import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleUnitIterationGenerator} from './generator.ts';

const generator = new AngleUnitIterationGenerator();

describe('AngleUnitIterationGenerator', () => {
    it('calculates an accumulated angle from its count of equal units', () => {
        const counts = new Set<number>();
        for (let seed = 0; seed < 40; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            counts.add(data.count);
            expect(data).toEqual({
                kind: 'angle-iteration', fullTurnDegrees: 360,
                unitDegrees: 1, count: data.count, angleDegrees: data.count * data.unitDegrees
            });
        }
        expect([...counts].sort((a, b) => a - b)).toEqual([5, 8, 10, 12, 15]);
    });

    it('replays the same seed', () => {
        setSeed(18);
        const first = generator.generate({});
        setSeed(18);
        expect(generator.generate({})).toEqual(first);
    });

    it.each([null, undefined])('rejects a missing config %j', config => {
        expect(() => generator.generate(config as never)).toThrow(GeneratorValidationError);
    });
});
