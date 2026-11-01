import {Ability, Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import * as rng from '../../../lib/random.ts';
import {IntegerAddSubtractStrategiesGenerator} from './generator.ts';
import {IntegerAddSubtractStrategiesGeneratorSchema as schema, spec} from './spec.ts';
import {spec as viewSpec} from '../../../visuals/views/operations/operations-add-subtract-strategy-understanding/spec.ts';

afterEach(() => vi.restoreAllMocks());
const generator = new IntegerAddSubtractStrategiesGenerator();
const model = {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema, spec};
const view = {viewId: viewSpec.viewId, generalLabels: viewSpec.generalLabels, schema: {}, spec: viewSpec};

describe('flexible strategy matching-capable canonical profiles', () => {
    it('keeps mathematical invariants and replaces redundant near-double inference with schema claims', () => {
        expect(spec.generalLabels).toEqual([Scope.TwoOperands, Scope.IntegerNumbers, Scope.Base10,
            Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(spec.inferredLabels).toBeUndefined();
        expect(spec.generalLabels).not.toContain(Ability.ProcedureUnderstanding);
        expect(findSchemaFallbackContractIssues(schema)).toEqual([]);
    });

    it('resolves all38 feasible strategy/range choices identically through both configuration paths', () => {
        let checked = 0;
        for (const strategy of schema.strategy[2]) for (const range of schema.range[2]) {
            const labels = [...strategy, ...range, ...viewSpec.generalLabels];
            const compatibility = planModelCompatibility({id: 'flexible-profile', labels}, model, view);
            if (!compatibility.supported) {
                expect(() => extractConfig(schema, labels)).toThrow();
                continue;
            }
            const direct = extractConfig(schema, labels);
            const planned = resolveSchemaChoices(schema, labels, {strategy, range});
            expect(planned.config).toEqual(direct.config);
            expect(new Set(planned.resolvedLabels)).toEqual(new Set(direct.resolvedLabels));
            expect(generator.generate(direct.config)).not.toBeNull();
            checked++;
        }
        expect(checked).toBe(38);
    });

    it.each([Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20])(
        'supplies the existing bounded near-double width as a matching capability for %s', upper => {
            const labels = [Area.AdditionNearDoubles, Scope.SingleDigitSmallestOperand, upper, ...viewSpec.generalLabels];
            expect(planModelCompatibility({id: 'bounded-near-double', labels}, model, view).supported).toBe(true);
            const stub = generateWithLabels(generator, labels)!;
            expect(stub.labels.filter(label => label === Scope.SingleDigitSmallestOperand)).toHaveLength(1);
            expect(Math.min(stub.data.leftOperand, stub.data.rightOperand)).toBeLessThan(10);
        }
    );

    it('preserves the9+10 boundary and broad multi-digit near-double support', () => {
        vi.spyOn(rng, 'random').mockReturnValue(0.999999);
        const low = generateWithLabels(generator, [Area.AdditionNearDoubles, Scope.NumbersSmaller20])!;
        expect([low.data.leftOperand, low.data.rightOperand].sort((a, b) => a - b)).toEqual([9, 10]);
        expect(low.labels).toContain(Scope.SingleDigitSmallestOperand);
        const high = generateWithLabels(generator, [Area.AdditionNearDoubles, Scope.NumbersSmaller1000])!;
        expect(Math.min(high.data.leftOperand, high.data.rightOperand)).toBeGreaterThanOrEqual(10);
        expect(high.labels).toContain(Scope.MultipleDigitSmallestOperand);
        expect(high.labels).not.toContain(Scope.SingleDigitSmallestOperand);
        const falseWidth = [Area.AdditionNearDoubles, Scope.SingleDigitSmallestOperand, Scope.NumbersSmaller1000, ...viewSpec.generalLabels];
        expect(planModelCompatibility({id: 'false-near-width', labels: falseWidth}, model, view).supported).toBe(false);
        expect(() => extractConfig(schema, falseWidth)).toThrow();
    });

    it('keeps broad direct fallbacks feasible after either smaller-operand width is selected', () => {
        for (let seed = 0; seed < 20; seed++) {
            rng.setSeed(seed);
            const resolved = extractConfig(schema, [Area.AdditionNearDoubles]);
            const data = generator.generate(resolved.config).data;
            const single = resolved.resolvedLabels.includes(Scope.SingleDigitSmallestOperand);
            expect(Math.min(data.leftOperand, data.rightOperand) < 10).toBe(single);
            expect(resolved.resolvedLabels.includes(Scope.MultipleDigitSmallestOperand)).toBe(!single);
        }
    });

    it('preserves both compensation widths at their truthful ceilings and rejects the obsolete single/U1000 choice', () => {
        for (const area of [Area.AdditionCompensation, Area.SubtractionCompensation]) {
            for (const [width, upper] of [[Scope.SingleDigitLargestOperand, Scope.NumbersSmaller20],
                [Scope.MultipleDigitLargestOperand, Scope.NumbersSmaller1000]] as const) {
                const stub = generateWithLabels(generator, [area, width, upper])!;
                expect(stub.labels).toContain(width);
                expect(Math.max(stub.data.leftOperand, stub.data.rightOperand) < 10).toBe(width === Scope.SingleDigitLargestOperand);
            }
            expect(() => extractConfig(schema, [area, Scope.SingleDigitLargestOperand, Scope.NumbersSmaller1000])).toThrow();
        }
    });
});
