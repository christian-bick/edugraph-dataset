import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels, labelSetHash} from '../../../lib/utils.ts';
import {DecimalComparisonGenerator} from './generator.ts';
import {spec} from './spec.ts';

const commonLabels = [
    Area.NumerationWithDecimals,
    Area.DecimalNotation,
    Area.DecimalPrecission,
    Scope.DecimalNumbers,
    Scope.SingleFrameOfReference,
    Scope.VisualNumbers,
    Ability.ConceptDerivation
] as const;

const targets = [
    ['greater', [Area.NumericInequality, ...commonLabels, Scope.Greater], 'c2112515'],
    ['equal', [Area.NumericEquality, ...commonLabels, Scope.Equal], 'f55ef65a'],
    ['less', [Area.NumericInequality, ...commonLabels, Scope.Less], 'f7ddf8a8']
] as const;

describe('DecimalComparisonGenerator spec integration', () => {
    const generator = new DecimalComparisonGenerator();

    it('declares invariant math separately from the configured relation family', () => {
        expect(spec).toEqual({
            generatorId: 'decimal-comparison',
            generalLabels: [
                Area.NumerationWithDecimals,
                Area.DecimalNotation,
                Area.DecimalPrecission,
                Scope.DecimalNumbers,
                Ability.ConceptDerivation
            ]
        });
    });

    it.each(targets)('resolves the corrected %s target and hash', (
        relation,
        labels,
        expectedHash
    ) => {
        expect(labelSetHash([...labels])).toBe(expectedHash);
        setSeed(expectedHash);
        const stub = generateWithLabels(generator, [...labels]);
        expect(stub).not.toBeNull();
        expect(stub!.data.relation).toBe(relation);
        expect(stub!.tags).toEqual(relation === 'equal'
            ? [Area.NumericEquality, Scope.Equal]
            : [Area.NumericInequality, relation === 'greater' ? Scope.Greater : Scope.Less]);
    });

    it('keeps direct and label-driven generation on the same RNG path', () => {
        const labels = [...targets[0][1]];
        setSeed('decimal-comparison-label-path');
        const resolved = generateWithLabels(generator, labels);
        setSeed('decimal-comparison-label-path');
        const direct = generator.generate({
            comparisonKind: Area.NumericInequality,
            relation: Scope.Greater
        });
        expect(resolved!.data).toEqual(direct.data);
    });
});
