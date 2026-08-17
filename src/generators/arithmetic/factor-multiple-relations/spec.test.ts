import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('FactorMultipleRelationsGenerator spec integration', () => {
    const generator = new FactorMultipleRelationsGenerator();

    it('declares the invariant positive integers below 100', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero,
            Scope.NumbersSmaller100
        ]));
    });

    it.each([
        [
            [Area.FactorsAndMultiples, Area.Factorization, Ability.ProcedureExecution],
            'factor-pairs'
        ],
        [
            [Area.FactorsAndMultiples, Area.PerfectDivisibility, Ability.ProcedureExecution],
            'one-digit-multiple-test'
        ],
        [
            [Area.PrimeNumbers, Area.Factorization, Ability.ConceptClassification],
            'prime-classification'
        ],
        [
            [Area.CompositeNumbers, Area.Factorization, Ability.ConceptClassification],
            'composite-classification'
        ]
    ] as const)('resolves the authored labels into %s', (labels, kind) => {
        setSeed(41);
        const stub = generateWithLabels(generator, [...labels, Scope.NumbersSmaller100]);

        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe(kind);
        for (const label of labels.filter(label => label.startsWith('http://edugraph.io/edu/'))) {
            expect(stub!.tags).toContain(label);
        }
    });
});
