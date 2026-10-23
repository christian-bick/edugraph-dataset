import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw, resolvePlannedConfigurations} from '../../../lib/planned-generation.ts';
import {setSeed} from '../../../lib/random.ts';
import {normalizeSchemaChoices, resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {implementationTodos, spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as construction, SolidNetConstructionViewSchema} from '../../../visuals/views/shape/solid-net-construction/spec.ts';
import {spec as constructionStory, SolidNetConstructionStoryViewSchema} from '../../../visuals/views/shape/solid-net-construction-story/spec.ts';
import {spec as area, NetSurfaceAreaViewSchema} from '../../../visuals/views/shape/net-surface-area/spec.ts';
import {spec as areaStory, NetSurfaceAreaStoryViewSchema} from '../../../visuals/views/shape/net-surface-area-story/spec.ts';
import {isPolyhedralNetProblem} from '../polyhedral-net-helpers.ts';
import {PolyhedralNetsGenerator} from './generator.ts';
import {PolyhedralNetsGeneratorSchema, spec} from './spec.ts';

const leaves = [[construction, SolidNetConstructionViewSchema, false, false],
    [constructionStory, SolidNetConstructionStoryViewSchema, true, false],
    [area, NetSurfaceAreaViewSchema, false, true],
    [areaStory, NetSurfaceAreaStoryViewSchema, true, true]] as const;
const families = [[[Area.RectangularPrism], 'rectangular-prism'],
    [[Area.Prism, Area.Triangle], 'triangular-prism'], [[Area.Pyramid], 'pyramid']] as const;

function plan(labels: readonly string[], view: typeof construction, id = 'polyhedral-net') {
    return planCompatibility({identity: {targetId: id, generatorId: spec.generatorId, viewId: view.viewId},
        targetLabels: labels, generatorLabels: spec.generalLabels, viewLabels: view.generalLabels,
        generatorRules: spec.compatibility, viewRules: view.compatibility,
        fields: [...normalizeSchemaChoices(PolyhedralNetsGeneratorSchema, labels, 'generator'),
            ...normalizeSchemaChoices({}, labels, 'view')]});
}

describe('polyhedral-net capability ownership and exact production plans', () => {
    it('declares complete correlated solid choices and a genuine optional surface-additivity relation', () => {
        expect(spec.generalLabels).toEqual([Area.ShapeDecomposition]);
        expect(Object.keys(PolyhedralNetsGeneratorSchema)).toEqual(['solidFamily', 'mathematicalRelation']);
        expect(findSchemaFallbackContractIssues(PolyhedralNetsGeneratorSchema)).toEqual([]);
        expect(PolyhedralNetsGeneratorSchema.solidFamily[2]).toEqual(families.map(([labels]) => labels));
        expect(PolyhedralNetsGeneratorSchema.mathematicalRelation[2]).toEqual([[], [Area.SurfaceAreaCalculation]]);
        expect(leaves.map(([, schema]) => schema)).toEqual([{}, {}, {}, {}]);
    });

    it('executes all twelve actual reviewed target plans with exactly the intended leaf and whole emitted claim', () => {
        const targets = [...activeTargets, ...implementationTodos].filter(target =>
            target.id.startsWith('6.G.A.4-construct-solid-net~') || target.id.startsWith('6.G.A.4-net-surface-area~'));
        expect(targets).toHaveLength(12);
        for (const target of targets) for (const [view, schema, story, surface] of leaves) {
            const expected = target.labels.includes(Ability.TextualReception) === story
                && target.labels.includes(Area.SurfaceAreaCalculation) === surface;
            const result = plan(target.labels, view, target.id);
            expect(result.supported, `${target.id} / ${view.viewId}`).toBe(expected);
            if (!result.supported) continue;
            const input = {plan: result.plan, sampleKey: `${target.id}#${spec.generatorId}#${view.viewId}#train#question#inst:0`,
                seed: 417, attempt: 1};
            const resolved = resolvePlannedConfigurations({...input, generatorSchema: PolyhedralNetsGeneratorSchema, viewSchema: schema});
            const family = families.find(([labels]) => labels.every(label => target.labels.includes(label)))!;
            expect(resolved.generatorConfig.solidFamily).toBe(family[1]);
            expect(resolved.generatorConfig.mathematicalRelation).toBe(surface ? 'surface-additivity' : 'boundary-incidence');
            const draw = generatePlannedDraw({...input, generator: new PolyhedralNetsGenerator(), viewSchema: schema});
            expect(new Set(draw.labels)).toEqual(new Set([...target.labels, Area.ShapeDecomposition]));
            const data = draw.stub?.data;
            expect(isPolyhedralNetProblem(data)).toBe(true);
            if (!isPolyhedralNetProblem(data)) throw Error('The actual target draw omitted the complete net model.');
            expect(data.surfaceAdditivity.length).toBe(surface ? data.solid.faces.length : 0);
        }
    });

    it('keeps mathematical bindings and exact payload independent of learner Ability', () => {
        for (const [labels] of families) for (const surface of [false, true]) {
            const mathematical = [...labels, ...(surface ? [Area.SurfaceAreaCalculation] : [])];
            const binding = {solidFamily: [...labels], mathematicalRelation: surface ? [Area.SurfaceAreaCalculation] : []};
            const first = resolveSchemaChoices(PolyhedralNetsGeneratorSchema, [...mathematical, Ability.VisualArticulation], binding);
            const second = resolveSchemaChoices(PolyhedralNetsGeneratorSchema,
                [...mathematical, Ability.ProcedureExecution, Ability.TextualReception], binding);
            expect(second).toEqual(first);
            setSeed(991); const original = new PolyhedralNetsGenerator().generate(first.config);
            setSeed(991); expect(new PolyhedralNetsGenerator().generate(second.config)).toEqual(original);
        }
        setSeed(211); const problem = generateWithLabels(new PolyhedralNetsGenerator(),
            [Area.Pyramid, Area.SurfaceAreaCalculation, Ability.ProcedureExecution]);
        if (!isPolyhedralNetProblem(problem?.data)) throw Error('Explicit surface labels did not produce a complete net.');
        expect(problem.data.surfaceAdditivity.length).toBeGreaterThan(0);
    });

    it('does not admit unrelated decomposition tasks or silently choose a surface calculation for construction', () => {
        expect(plan([Area.RectangularPrism, Area.ShapeDecomposition, Ability.VisualArticulation], construction).supported).toBe(false);
        expect(plan([Area.RectangularPrism, Area.ShapeDecomposition, Area.SurfaceAreaCalculation,
            Scope.GeometricNet, Ability.VisualArticulation], construction).supported).toBe(false);
        expect(plan([Area.RectangularPrism, Scope.GeometricNet, Ability.ProcedureExecution], area).supported).toBe(false);
        expect(plan([Area.RectangularPrism, Scope.GeometricNet, Area.SurfaceAreaCalculation,
            Ability.ProcedureExecution], areaStory).supported).toBe(false);
    });
});
