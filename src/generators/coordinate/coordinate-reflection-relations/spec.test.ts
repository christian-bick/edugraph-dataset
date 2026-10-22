import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {CoordinateReflectionRelationsGenerator} from './generator.ts';
import {CoordinateReflectionRelationsGeneratorSchema, spec} from './spec.ts';

const mathematics = [Area.OrderedCoordinatePair, Area.Reflection, Area.SignNotation, Scope.RationalNumbers];
const target = [...mathematics, Scope.CartesianCoordinateSystem, Ability.Interpretation];

describe('coordinate reflection capability ownership and range resolution', () => {
    it('keeps exactly the reviewed invariant mathematics and ordinary numeric range resolver', () => {
        expect(spec.generalLabels).toEqual(mathematics);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithZero);
        expect(spec.generalLabels).not.toContain(Scope.NumbersWithNegatives);
        expect(CoordinateReflectionRelationsGeneratorSchema.range).toHaveLength(2);
        expect(findSchemaFallbackContractIssues(CoordinateReflectionRelationsGeneratorSchema)).toEqual([]);
    });

    it('admits the real target and optional numeric bounds through authoritative production planning', () => {
        for (const bounds of [[], [Scope.NumbersSmaller5], [Scope.NumbersSmaller10]]) {
            const labels = [...target, ...bounds];
            const result = planCompatibility({identity: {targetId: 'coordinate-reflection-production-regression', generatorId: spec.generatorId, viewId: 'coordinate-sign-reflection'},
                targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: [Scope.CartesianCoordinateSystem, Ability.Interpretation],
                fields: normalizeSchemaChoices(CoordinateReflectionRelationsGeneratorSchema, labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            const draw = generatePlannedDraw({generator: new CoordinateReflectionRelationsGenerator(), viewSchema: {}, plan: result.plan,
                sampleKey: 'coordinate-reflection-production-regression#coordinate-reflection-relations#coordinate-sign-reflection#train#question#inst:0', seed: 68, attempt: 1});
            expect(draw.stub!.data.kind).toBe('coordinate-reflection-relations');
            for (const bound of bounds) expect(draw.labels).toContain(bound);
        }
    });

    it('resolves the real Grade6 conjunction without inventing a required magnitude target', () => {
        expect(extractConfig(CoordinateReflectionRelationsGeneratorSchema, target)).toEqual({config: {range: {min: 0, max: Number.MAX_SAFE_INTEGER}}, resolvedLabels: []});
        const problem = generateWithLabels(new CoordinateReflectionRelationsGenerator(), target)!;
        expect(problem.labels).toEqual([]);
        expect(problem.data.kind).toBe('coordinate-reflection-relations');
    });

    it.each([[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10]] as const)('resolves the genuine absolute range %s', (label, maximum) => {
        expect(extractConfig(CoordinateReflectionRelationsGeneratorSchema, [...target, label])).toEqual({config: {range: {min: 0, max: maximum}}, resolvedLabels: [label]});
        for (let seed = 0; seed < 25; seed++) {
            setSeed(seed);
            const problem = generateWithLabels(new CoordinateReflectionRelationsGenerator(), [...target, label])!;
            expect(problem.labels).toEqual([label]);
            for (const axis of [problem.data.axes.x, problem.data.axes.y]) {
                expect(Math.abs(axis.minimum.numerator)).toBeLessThanOrEqual(maximum * axis.minimum.denominator);
                expect(axis.maximum.numerator).toBeLessThanOrEqual(maximum * axis.maximum.denominator);
            }
        }
    });

    it('does not choose reflections or source coordinates from the learner Ability', () => {
        setSeed(445);
        const first = generateWithLabels(new CoordinateReflectionRelationsGenerator(), target);
        setSeed(445);
        expect(generateWithLabels(new CoordinateReflectionRelationsGenerator(), [...mathematics, Ability.ProcedureExecution])).toEqual(first);
    });
});
