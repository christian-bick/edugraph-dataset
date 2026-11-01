import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {MultiplicativeComparisonGenerator} from './generator.ts';
import {spec, MultiplicativeComparisonGeneratorSchema as schema} from './spec.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {spec as wordViewSpec} from '../../../visuals/views/operations/operations-multiplicative-comparison-word-problem/spec.ts';

describe('MultiplicativeComparisonGenerator spec integration', () => {
    const generator = new MultiplicativeComparisonGenerator();

    it('requires the actual multiplicative-comparison competency for every word-problem band', () => {
        const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
        const view = {viewId: wordViewSpec.viewId, generalLabels: wordViewSpec.generalLabels, schema: {}, spec: wordViewSpec};
        for (const operation of [Area.Multiplication, Area.Division]) {
            for (const upper of [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100]) {
                const labels = [operation, upper, ...wordViewSpec.generalLabels];
                expect(planModelCompatibility({id: 'generic-word-problem', labels}, model, view).supported).toBe(false);
                expect(planModelCompatibility({id: 'comparison-word-problem', labels: [...labels, Area.ProportionalScaling]}, model, view).supported).toBe(true);
            }
        }
    });

    it('resolves all 11 correlated profiles through both configuration paths', () => {
        for (const labels of schema.profile[2]) {
            const direct = extractConfig(schema, [...labels]);
            const planned = resolveSchemaChoices(schema, labels, {profile: labels});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
        }
    });

    it('declares the invariant multiplicative-comparison mathematics', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([
            Area.ProportionalScaling,
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]));
    });

    it.each([Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand])(
        'honors the matching-capable division width %s', width => {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generateWithLabels(generator, [Area.Division, width]);
                expect(stub).not.toBeNull();
                expect(stub!.labels).toContain(width);
                expect(stub!.data.operation).toBe('division');
                expect(stub!.data.comparedQuantity < 10).toBe(width === Scope.SingleDigitLargestOperand);
            }
        }
    );

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.Division, 'division']
    ] as const)('resolves %s into the required operation', (label, operation) => {
        setSeed(7);
        const stub = generateWithLabels(generator, [
            label,
            Area.ProportionalScaling,
            Scope.SingleStep,
            Scope.TwoOperands,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersWithoutZero
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.labels).toContain(label);
    });
});
