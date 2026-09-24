import {spec as primeSpec} from '../numbers-prime-classification/spec.ts';
import {spec as compositeSpec} from '../numbers-composite-classification/spec.ts';
import {NumbersPrimeClassificationGenerator} from '../numbers-prime-classification/generator.ts';
import {NumbersCompositeClassificationGenerator} from '../numbers-composite-classification/generator.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {FactorMultipleRelationsProblem} from '../../../types/problems.ts';
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
        const selected = kind === 'prime-classification' ? new NumbersPrimeClassificationGenerator()
            : kind === 'composite-classification' ? new NumbersCompositeClassificationGenerator() : generator;
        const selectedSpec = kind === 'prime-classification' ? primeSpec : kind === 'composite-classification' ? compositeSpec : spec;
        const stub = generateWithLabels<FactorMultipleRelationsProblem>(selected, [...labels, Scope.NumbersSmaller100]);

        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe(kind);
        expect([...selectedSpec.generalLabels, ...stub!.labels]).toContain(labels[0]);
        expect(stub!.labels).not.toContain(Area.Factorization);
        expect(stub!.labels).not.toContain(Ability.ProcedureExecution);
        expect(stub!.labels).not.toContain(Ability.ConceptClassification);
    });

});
