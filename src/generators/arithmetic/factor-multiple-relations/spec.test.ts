import {spec as primeSpec} from '../numbers-prime-classification/spec.ts';
import {spec as compositeSpec} from '../numbers-composite-classification/spec.ts';
import {NumbersPrimeClassificationGenerator} from '../numbers-prime-classification/generator.ts';
import {NumbersCompositeClassificationGenerator} from '../numbers-composite-classification/generator.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {FactorMultipleRelationsProblem} from '../../../types/problems.ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {FactorMultipleRelationsGenerator} from './generator.ts';
import {FactorMultipleRelationsGeneratorSchema as schema, spec} from './spec.ts';

describe('FactorMultipleRelationsGenerator spec integration', () => {
    const generator = new FactorMultipleRelationsGenerator();

    it('declares invariant positive integers with ranges selected before generation', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Scope.IntegerNumbers,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
        expect(spec.generalLabels).not.toContain(Scope.NumbersSmaller100);
        expect(JSON.stringify(spec)).not.toContain('Ability.');
    });

    it('resolves all nine task/range choices through both paths without a spurious factor-proof floor', () => {
        for (const upper of [5, 10, 20, 100]) {
            const label = [Scope.NumbersSmaller5, Scope.NumbersSmaller10,
                Scope.NumbersSmaller20, Scope.NumbersSmaller100][[5, 10, 20, 100].indexOf(upper)]!;
            for (const task of ['factor-pairs', 'one-digit-multiple-test']) {
                const taskLabels = task === 'factor-pairs' ? [] : [Area.PerfectDivisibility];
                expect(extractConfig(schema, [...taskLabels, label]).config)
                    .toEqual({task, range: createCanonicalNumericRange(upper)});
                expect(resolveSchemaChoices(schema, [...taskLabels, label], {task: taskLabels, range: [label]}).config)
                    .toEqual({task, range: createCanonicalNumericRange(upper)});
            }
        }
        const labels = [Area.PerfectDivisibility, Scope.NumbersSmaller100, Scope.NumbersLarger5];
        const expected = {task: 'one-digit-multiple-test', range: createCanonicalNumericRange(100, 5)};
        expect(extractConfig(schema, labels).config).toEqual(expected);
        expect(resolveSchemaChoices(schema, labels,
            {task: [Area.PerfectDivisibility], range: [Scope.NumbersSmaller100, Scope.NumbersLarger5]}).config).toEqual(expected);
        expect(() => extractConfig(schema, [Scope.NumbersSmaller100, Scope.NumbersLarger5])).toThrow();
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
