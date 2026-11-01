import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';
import {spec, type ArithmeticOpsPairsGeneratorConfig} from './spec.ts';

const generator = new ArithmeticOpsPairsGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'canonical-pair', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'canonical-test', generalLabels: [], schema: {}, spec: {viewId: 'canonical-test', generalLabels: []}});

describe('canonical pair declarations', () => {
    it('retains binary integer and single-step invariant claims', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.TwoOperands, Scope.IntegerNumbers, Scope.SingleStep]));
    });
    it.each([Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division])('resolves direct and planned %s configurations before generation', operation => {
        const labels = [operation, Scope.NumbersSmaller100, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero];
        const result = plan(labels);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const direct = extractConfig(generator.schema, labels);
            const data = generator.generate(direct.config)!.data;
            expect(hasCanonicalRangeWitness([data.num1, data.num2, data.answer], direct.config.range!)).toBe(true);
            const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                sampleKey: 'canonical-pair#arithmetic-ops-pairs#canonical-test#train#question#inst:0', seed, attempt: 1});
            const config = resolved.generatorConfig as ArithmeticOpsPairsGeneratorConfig;
            const planned = generator.generate(config)!.data;
            expect(hasCanonicalRangeWitness([planned.num1, planned.num2, planned.answer], config.range!)).toBe(true);
        }
    });
    it('rejects empty two-digit source cells during matching', () => {
        expect(plan([Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersLarger10, Scope.NumbersSmaller1000,
            Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives]).supported).toBe(false);
        expect(plan([Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersLarger20, Scope.NumbersSmaller1000,
            Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives]).supported).toBe(true);
        expect(plan([Area.Multiplication, Scope.NumbersWithZero, Scope.NumbersLarger5, Scope.NumbersSmaller100]).supported).toBe(false);
    });
    it('keeps equality and parity constraints pre-generation', () => {
        const labels = [Area.Addition, Area.IteratedOperation, Scope.EvenNumbers, Scope.NumbersSmaller5,
            Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives];
        expect(plan(labels).supported).toBe(true);
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const stub = generateWithLabels(generator, labels)!;
            expect(stub.data.num1).toBe(stub.data.num2);
            expect(stub.data.answer % 2).toBe(0);
        }
    });
    it('completes a strongest lower before width for equal-addend and explicit-width upper-only requests', () => {
        for (const labels of [
            [Area.Addition, Area.IteratedOperation, Scope.EvenNumbers, Scope.NumbersSmaller20,
                Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
            [Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersSmaller1000,
                Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
        ]) for (let seed = 0; seed < 12; seed++) {
            setSeed(seed);
            const resolved = extractConfig(generator.schema, labels);
            expect(resolved.config.range!.min).toBeGreaterThan(0);
            const data = generator.generate(resolved.config)!.data;
            expect(hasCanonicalRangeWitness([data.num1, data.num2, data.answer], resolved.config.range!)).toBe(true);
        }
    });
    it('uses finite range profiles for targets without explicit bounds', () => {
        const result = plan([Area.Addition, Scope.NumbersWithoutNegatives]);
        expect(result.supported).toBe(true);
        if (!result.supported) return;
        for (let seed = 0; seed < 15; seed++) {
            const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                sampleKey: 'canonical-pair#arithmetic-ops-pairs#canonical-test#train#question#inst:0', seed, attempt: 1});
            const config = resolved.generatorConfig as ArithmeticOpsPairsGeneratorConfig;
            expect(config.range!.max).toBeLessThanOrEqual(1000000);
            expect(generator.generate(config)).not.toBeNull();
        }
    });
});
