import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';
import {FactorMultipleRelationsGeneratorSchema, spec} from './spec.ts';

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
        expect(JSON.stringify(spec)).not.toContain('Ability.');
    });

    it.each([
        [
            [Area.FactorsAndMultiples, Ability.ProcedureExecution],
            'factor-pairs'
        ],
        [
            [Area.FactorsAndMultiples, Area.PerfectDivisibility, Ability.ProcedureExecution],
            'one-digit-multiple-test'
        ],
        [
            [Area.PrimeNumbers, Ability.ConceptClassification],
            'prime-classification'
        ],
        [
            [Area.CompositeNumbers, Ability.ConceptClassification],
            'composite-classification'
        ]
    ] as const)('resolves the authored labels into %s', (labels, kind) => {
        setSeed(41);
        const stub = generateWithLabels(generator, [...labels, Scope.NumbersSmaller100]);

        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe(kind);
        expect(stub!.labels).toContain(labels[0]);
        expect(stub!.labels).not.toContain(Area.Factorization);
        expect(stub!.labels).not.toContain(Ability.ProcedureExecution);
        expect(stub!.labels).not.toContain(Ability.ConceptClassification);
    });

    it('rejects contradictory classifications instead of choosing a task', () => {
        expect(() => extractConfig(FactorMultipleRelationsGeneratorSchema, [
            Area.PrimeNumbers, Area.CompositeNumbers
        ])).toThrow();
    });
});
