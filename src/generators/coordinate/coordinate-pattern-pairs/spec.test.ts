import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CoordinatePatternPairsGenerator} from './generator.ts';
import {CoordinatePatternPairsGeneratorSchema, spec} from './spec.ts';

describe('CoordinatePatternPairsGenerator spec', () => {
    it('claims only the invariant paired nonnegative integer domain', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PairedPatterns,
            Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives
        ]);
        expect(CoordinatePatternPairsGeneratorSchema).toEqual({});
    });

    it('produces the same mathematical payload independent of leaf task labels', () => {
        const generator = new CoordinatePatternPairsGenerator();
        const paired = generateWithLabels(generator, [Scope.PairedPatterns])!;
        const numeric = generateWithLabels(generator, [Scope.IntegerNumbers, Scope.NumbersWithoutNegatives])!;

        expect(paired.labels).toEqual([]);
        expect(numeric.labels).toEqual([]);
        expect(paired.data.kind).toBe('coordinate-pattern-pairs');
        expect(numeric.data.kind).toBe('coordinate-pattern-pairs');
    });
});
