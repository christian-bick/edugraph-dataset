import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsTriplesGenerator} from './generator.ts';
import {spec, type ArithmeticOpsTriplesGeneratorConfig} from './spec.ts';

const generator = new ArithmeticOpsTriplesGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'canonical-triple', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'test', generalLabels: [], schema: {}, spec: {viewId: 'test', generalLabels: []}});

describe('canonical triple declarations', () => {
    it('retains addition, sum, and property-law requests', () => {
        for (const labels of [[Area.Addition, Scope.NumbersSmaller20],
            [Area.Addition, Area.Sum, Scope.NumbersSmaller20],
            [Area.Addition, Area.CommutativeLaw, Scope.NumbersSmaller20],
            [Area.Addition, Area.AssociativeLaw, Scope.NumbersSmaller20],
            [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.NumbersSmaller100]]) {
            expect(plan(labels).supported).toBe(true);
            expect(generateWithLabels(generator, labels)).not.toBeNull();
        }
    });
    it('admits every reviewed two-digit triple cell and rejects the empty within20 cell', () => {
        for (const lower of [Scope.NumbersLarger10, Scope.NumbersLarger20])
            for (const upper of [Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000]) {
                const result = plan([Area.Addition, Scope.TwoDigitLargestOperand, lower, upper, Scope.NumbersWithoutZero]);
                expect(result.supported).toBe(true);
                if (!result.supported) continue;
                for (let seed = 0; seed < 10; seed++) {
                    const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                        sampleKey: 'canonical-triple#arithmetic-ops-triples#test#train#question#inst:0', seed, attempt: 1});
                    const data = generator.generate(resolved.generatorConfig as ArithmeticOpsTriplesGeneratorConfig)!.data;
                    expect([data.num1, data.num2, data.num3].every(value => value >= 10 && value <= 99)).toBe(true);
                }
            }
        expect(plan([Area.Addition, Scope.TwoDigitLargestOperand, Scope.NumbersLarger10, Scope.NumbersSmaller20]).supported).toBe(false);
    });
    it('completes feasible strongest lowers in partial direct requests', () => {
        for (const refinement of [Scope.TwoDigitLargestOperand, Scope.MultiplesOf10]) {
            const labels = [Area.Addition, refinement, Scope.NumbersSmaller100, Scope.NumbersWithoutZero];
            expect(plan(labels).supported).toBe(true);
            const data = generateWithLabels(generator, labels)!.data;
            expect([data.num1, data.num2, data.num3].every(value => value >= 10)).toBe(true);
            if (refinement === Scope.TwoDigitLargestOperand) expect([data.num1, data.num2, data.num3].every(value => value <= 99)).toBe(true);
        }
    });
    it('declares the proved smallest-operand width for the reviewed smaller addition bands', () => {
        for (const upper of [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]) {
            const labels = [Area.Addition, upper, Scope.NumbersWithoutZero];
            const result = plan(labels);
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                sampleKey: 'canonical-triple#arithmetic-ops-triples#test#train#question#inst:0', seed: 5, attempt: 1});
            expect(resolved.generatorLabels).toContain(Scope.SingleDigitSmallestOperand);
            const data = generator.generate(resolved.generatorConfig as ArithmeticOpsTriplesGeneratorConfig)!.data;
            expect(Math.min(data.num1, data.num2, data.num3)).toBeLessThan(10);
        }
    });
});
