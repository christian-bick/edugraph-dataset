import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {CoordinateProblemsGenerator} from './generator.ts';
import {CoordinateProblemsGeneratorSchema, spec} from './spec.ts';

describe('coordinate-route schema and complete authored claim trace', () => {
    it('owns only RationalNumbers and a real global range', () => {
        expect(spec.generalLabels).toEqual([Scope.RationalNumbers]);
        expect(Object.keys(CoordinateProblemsGeneratorSchema)).toEqual(['range']);
        expect(findSchemaFallbackContractIssues(CoordinateProblemsGeneratorSchema)).toEqual([]);
        for (const [labels, max] of [[[Scope.NumbersSmaller20], 20], [[Scope.NumbersSmaller100], 100], [[], Number.MAX_SAFE_INTEGER]] as const) {
            expect(extractConfig(CoordinateProblemsGeneratorSchema, [...labels]).config).toEqual({range: {min: 0, max}});
            expect(generateWithLabels(new CoordinateProblemsGenerator(), [...labels])!.data.kind).toBe('coordinate-problems');
        }
    });

    it('plans both exact authored route targets without hidden distance or other Area claims', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target => target.id.startsWith('6.NS.C.8-coordinate-plane-problems~'));
        expect(targets).toHaveLength(2);
        for (const target of targets) {
            const story = target.labels.includes(Ability.TextualReception);
            const viewId = story ? 'coordinate-problem-story' : 'coordinate-problem-plotting';
            const result = planCompatibility({identity: {targetId: target.id, generatorId: spec.generatorId, viewId}, targetLabels: target.labels,
                generatorLabels: spec.generalLabels, viewLabels: [Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation,
                    Ability.ProcedureExecution, ...(story ? [Ability.TextualReception] : [])],
                fields: normalizeSchemaChoices(CoordinateProblemsGeneratorSchema, target.labels, 'generator')});
            expect(result.supported).toBe(true);
            if (!result.supported) throw new Error(result.reason);
            for (let seed = 0; seed < 10; seed++) {
                const draw = generatePlannedDraw({generator: new CoordinateProblemsGenerator(), viewSchema: {}, plan: result.plan,
                    sampleKey: `${target.id}#coordinate-problems#${viewId}#train#question#inst:0`, seed, attempt: 1});
                expect(new Set(draw.labels)).toEqual(new Set(target.labels));
                expect(draw.stub!.data.totalLength.numerator).toBeGreaterThan(0);
            }
        }
    });

    it('is Ability neutral and rejects an unbound empty configuration', () => {
        setSeed(37); const first = generateWithLabels(new CoordinateProblemsGenerator(), [Scope.NumbersSmaller100, Ability.ProcedureExecution]);
        setSeed(37); expect(generateWithLabels(new CoordinateProblemsGenerator(), [Scope.NumbersSmaller100, Ability.Formalization])).toEqual(first);
        expect(() => new CoordinateProblemsGenerator().generate({})).toThrow();
    });
});
