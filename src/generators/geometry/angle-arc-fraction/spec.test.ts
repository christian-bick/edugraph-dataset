import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {AngleArcFractionGenerator} from './generator.ts';

const generator = new AngleArcFractionGenerator();
const alternatives = [
    [Scope.HalfFractions, 2], [Scope.ThirdFractions, 3],
    [Scope.QuarterFractions, 4], [Scope.SixthFractions, 6]
] as const;

describe('AngleArcFractionGenerator schema', () => {
    it.each(alternatives)('resolves and labels denominator %s', (label, denominator) => {
        const result = generateWithLabels(generator, [label])!;
        expect(result.data.arcFraction.denominator).toBe(denominator);
        expect(result.labels).toEqual([label]);
    });

    it('labels its chosen denominator even when the target leaves it open', () => {
        setSeed(7);
        const first = generateWithLabels(generator, [])!;
        const expected = alternatives.find(([, denominator]) => denominator === first.data.arcFraction.denominator)!;
        expect(first.labels).toEqual([expected[0]]);
        setSeed(7);
        expect(generateWithLabels(generator, [])).toEqual(first);
    });

    it('rejects competing denominators', () => {
        expect(() => generateWithLabels(generator, [Scope.HalfFractions, Scope.ThirdFractions])).toThrow();
    });
});
