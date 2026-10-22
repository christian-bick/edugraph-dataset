import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {CoordinateAxisDistanceGenerator} from './generator.ts';
import {CoordinateAxisDistanceGeneratorSchema, spec} from './spec.ts';

describe('coordinate-distance ownership and real numeric schema', () => {
    it('owns exactly distance, absolute magnitude and rational data with meaningful range choices', () => {
        expect(spec.generalLabels).toEqual([Area.CoordinateDistance, Area.AbsoluteNumberMagnitude, Scope.RationalNumbers]);
        expect(Object.keys(CoordinateAxisDistanceGeneratorSchema)).toEqual(['range']);
        expect(findSchemaFallbackContractIssues(CoordinateAxisDistanceGeneratorSchema)).toEqual([]);
        for (const [labels, max] of [[[Scope.NumbersSmaller20], 20], [[Scope.NumbersSmaller100], 100], [[], Number.MAX_SAFE_INTEGER]] as const) {
            expect(extractConfig(CoordinateAxisDistanceGeneratorSchema, [...labels]).config).toEqual({range: {min: 0, max}});
            expect(generateWithLabels(new CoordinateAxisDistanceGenerator(), [...labels])!.data.kind).toBe('coordinate-axis-distance');
        }
    });

    it('plans both exact authored distance targets and publishes every claim with no extras', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.NS.C.8-axis-aligned-coordinate-distance~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const story = target.labels.includes(Ability.TextualReception);
            const viewId = story ? 'coordinate-axis-distance-story' : 'coordinate-axis-distance';
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId}, targetLabels: target.labels,
                generatorLabels: spec.generalLabels, viewLabels: [Scope.CartesianCoordinateSystem, Ability.ProcedureExecution, ...(story ? [Ability.TextualReception] : [])],
                fields: normalizeSchemaChoices(CoordinateAxisDistanceGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 10; seed++) {
                const draw = generatePlannedDraw({generator: new CoordinateAxisDistanceGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#coordinate-axis-distance#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.separation.distance.numerator).toBeGreaterThanOrEqual(0);
            }
        }
    });

    it('keeps the mathematical draw independent of learner Ability and rejects empty config', () => {
        setSeed(59); const first = generateWithLabels(new CoordinateAxisDistanceGenerator(), [Scope.NumbersSmaller20, Ability.ProcedureExecution]);
        setSeed(59); expect(generateWithLabels(new CoordinateAxisDistanceGenerator(), [Scope.NumbersSmaller20, Ability.Interpretation])).toEqual(first);
        expect(() => new CoordinateAxisDistanceGenerator().generate({})).toThrow();
    });
});
