import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planModelCompatibility} from '../../../lib/model-compatibility.ts';
import {resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {getRandomState, setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticPropertyRelationsGenerator} from './generator.ts';
import {spec, type ArithmeticPropertyRelationsGeneratorConfig} from './spec.ts';

const generator = new ArithmeticPropertyRelationsGenerator();
const plan = (labels: string[]) => planModelCompatibility({id: 'property-test', labels},
    {generatorId: spec.generatorId, generalLabels: spec.generalLabels, schema: generator.schema, spec},
    {viewId: 'property-math-test', generalLabels: [], schema: {}, spec: {viewId: 'property-math-test', generalLabels: []}});

describe('canonical arithmetic property declarations', () => {
    it('keeps property identity invariantly mathematical and no two-digit task branch', () => {
        expect(spec.generalLabels).toContain(Scope.ThreeOperands);
        expect(generator.schema).not.toHaveProperty('requireTwoDigitOperands');
        expect(generator.schema).not.toHaveProperty('blankPart');
    });
    it('preserves the reviewed direct and planned low-band source routes', () => {
        for (const law of [Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw])
            for (const upper of law === Area.DistributiveLaw
                ? [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100]
                : [Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20]) {
                const labels = [Area.Addition, law, upper, ...(law === Area.DistributiveLaw ? [Area.Multiplication] : [])];
                const result = plan(labels);
                expect(result.supported).toBe(true);
                expect(generateWithLabels(generator, labels)).not.toBeNull();
                if (!result.supported) continue;
                for (let seed = 0; seed < 12; seed++) {
                    const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                        sampleKey: 'property-test#arithmetic-property-relations#property-math-test#train#question#inst:0', seed, attempt: 1});
                    const data = generator.generate(resolved.generatorConfig as ArithmeticPropertyRelationsGeneratorConfig)!.data;
                    if (law === Area.CommutativeLaw) {expect(data.num1).not.toBe(data.num2); expect(data.num1).not.toBe(data.num3);}
                    if (law === Area.DistributiveLaw) expect(data).toHaveProperty('partialProducts');
                }
            }
    });
    it('rejects semantic contradictions and empty numeric profiles during matching without randomness', () => {
        for (const labels of [
            [Area.Addition, Scope.NumbersSmaller100],
            [Area.Multiplication, Area.CommutativeLaw, Area.AssociativeLaw, Scope.NumbersSmaller100],
            [Area.Addition, Area.Multiplication, Area.CommutativeLaw, Scope.NumbersSmaller100],
            [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.NumbersWithZero, Scope.NumbersSmaller100],
            [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.MultiplesOf10, Scope.NumbersSmaller100],
            [Area.Addition, Area.AssociativeLaw, Scope.NumbersWithZero, Scope.NumbersLarger5, Scope.NumbersSmaller100],
            [Area.Addition, Area.AssociativeLaw, Scope.MultiplesOf10, Scope.NumbersSmaller20],
            [Area.Multiplication, Area.AssociativeLaw, Scope.NumbersLarger5, Scope.NumbersSmaller100],
            [Area.Addition, Area.Multiplication, Area.DistributiveLaw, Scope.NumbersLarger10, Scope.NumbersSmaller1000]
        ]) {setSeed(7); expect(plan(labels).supported).toBe(false); expect(getRandomState()).toBe(7);}
    });
    it('admits unspecified operations only through valid property choices', () => {
        for (const law of [Area.CommutativeLaw, Area.AssociativeLaw, Area.DistributiveLaw]) {
            const result = plan([law, Scope.NumbersSmaller100]);
            expect(result.supported).toBe(true);
            if (!result.supported) continue;
            for (let seed = 0; seed < 12; seed++) {
                const resolved = resolvePlannedConfigurations({generatorSchema: generator.schema, viewSchema: {}, plan: result.plan,
                    sampleKey: 'property-test#arithmetic-property-relations#property-math-test#train#question#inst:0', seed, attempt: 1});
                expect(generator.generate(resolved.generatorConfig as ArithmeticPropertyRelationsGeneratorConfig)).not.toBeNull();
            }
        }
    });
});
