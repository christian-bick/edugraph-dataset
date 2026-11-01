import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {UnitDimensionRelationsGenerator} from './generator.ts';
import {UnitDimensionRelationsGeneratorSchema as schema, spec} from './spec.ts';
import {dimensionRelationCaseCount, dimensionRelationRangeProfiles} from './numeric-domain.ts';
import {spec as viewSpec} from '../../../visuals/views/measure/measure-unit-composition/spec.ts';

describe('unit-dimension-relations capabilities', () => {
    it('keeps dimensional composition and rational mathematics in the generator and positive claims in the view', () => {
        expect(spec.generalLabels).toEqual([Area.UnitDimensionality, Scope.RationalNumbers]);
        expect(viewSpec.generalLabels).toEqual(expect.arrayContaining([Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]));
    });

    it('resolves every relation-aware finite profile in direct and planned paths', () => {
        const evaluator = createLabelDependencyEvaluator();
        let cells = 0;
        for (const [label, operation] of [[Area.Multiplication, 'multiplication'], [Area.Division, 'division']] as const) {
            let count = 0;
            for (const profile of dimensionRelationRangeProfiles) {
                const cases = dimensionRelationCaseCount(operation, profile.range);
                count += cases;
                if (!cases) continue;
                cells++;
                const labels = [label, ...profile.labels];
                expect(extractConfig(schema, labels).config).toEqual({operation, range: profile.range});
                expect(resolveSchemaChoices(schema, labels, {operation: [label], range: profile.labels}).config)
                    .toEqual({operation, range: profile.range});
                const result = evaluator.evaluate([...spec.generalLabels!, ...viewSpec.generalLabels!, ...labels]);
                expect(result.errors).toEqual([]);
                expect(result.conflicts).toEqual([]);
                expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
            }
            expect(count).toBe(operation === 'multiplication' ? 9216 : 13824);
        }
        expect(cells).toBe(15);
        expect(generateWithLabels(new UnitDimensionRelationsGenerator(), [Area.UnitDimensionality])).not.toBeNull();
    });

    it('rejects competing operations and unsupported positive-floor division', () => {
        for (const labels of [[Area.Multiplication, Area.Division],
            [Area.Division, Scope.NumbersSmaller100, Scope.NumbersLarger5]]) {
            expect(() => generateWithLabels(new UnitDimensionRelationsGenerator(), labels)).toThrow();
        }
    });

    it('keeps explanation and execution requests out of the canonical relation', () => {
        const labels = [Area.UnitDimensionality, Scope.RationalNumbers, Area.Division];
        setSeed(17);
        const execution = generateWithLabels(new UnitDimensionRelationsGenerator(), [...labels, Ability.ProcedureExecution]);
        setSeed(17);
        expect(generateWithLabels(new UnitDimensionRelationsGenerator(), [...labels, Ability.ProcedureUnderstanding])).toEqual(execution);
    });
});
