import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {planCompatibility} from '../../../lib/compatibility.ts';
import {generatePlannedDraw} from '../../../lib/planned-generation.ts';
import {normalizeSchemaChoices} from '../../../lib/schema-choices.ts';
import {capabilitySatisfies} from '../../../lib/ontology.ts';
import {spec as activeTargets} from '../../../spec/ccss/grade-06.ts';
import {spec as rectilinearView, AreaRectilinearDecompositionViewSchema} from '../../../visuals/views/shape/area-rectilinear-decomposition/spec.ts';
import {AreaDecompositionGenerator} from './generator.ts';
import {AreaDecompositionGeneratorSchema, spec} from './spec.ts';

describe('AreaDecompositionGenerator spec integration', () => {
    it('declares the shared additive area-decomposition structure', () => {
        expect(spec.generalLabels).toEqual([
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Addition
        ]);
    });

    it('generates from the reviewed target labels', () => {
        const stub = generateWithLabels(new AreaDecompositionGenerator(), [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Multiplication,
            Area.Addition,
            Area.DistributiveLaw,
            Scope.ThreeOperands,
            Ability.ProcedureUnderstanding
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.totalArea).toBe(stub!.data.leftArea + stub!.data.rightArea);
    });

    it('generates the reviewed rectilinear decomposition target', () => {
        const stub = generateWithLabels(new AreaDecompositionGenerator(), [
            Area.AreaCalculation,
            Area.Rectangle,
            Area.ShapeDecomposition,
            Area.Addition,
            Ability.VisualDecomposition,
            Ability.ProcedureExecution
        ]);

        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('rectilinear');
        expect(stub!.data.totalArea).toBe(stub!.data.leftArea + stub!.data.rightArea);
        expect(stub!.labels).not.toContain(Ability.VisualDecomposition);
    });

    it('satisfies inclusive trapezoid involvement through its measured rectangular components', () => {
        const target = activeTargets.find(candidate => candidate.id.startsWith('6.G.A.1-polygon-area-dissection~')
            && candidate.labels.includes(Area.Trapezoid)
            && !candidate.labels.includes(Ability.TextualReception))!;
        expect(target).toBeDefined();
        const result = planCompatibility({
            identity: {targetId: target.id, generatorId: spec.generatorId, viewId: rectilinearView.viewId},
            targetLabels: target.labels, generatorLabels: spec.generalLabels, viewLabels: rectilinearView.generalLabels,
            generatorRules: spec.compatibility, viewRules: rectilinearView.compatibility,
            fields: normalizeSchemaChoices(AreaDecompositionGeneratorSchema, target.labels, 'generator')
        });
        expect(result.supported).toBe(true);
        if (!result.supported) throw new Error(result.reason);
        const draw = generatePlannedDraw({generator: new AreaDecompositionGenerator(), viewSchema: AreaRectilinearDecompositionViewSchema,
            plan: result.plan, sampleKey: `${target.id}#${spec.generatorId}#${rectilinearView.viewId}#train#question#inst:0`, seed: 991, attempt: 1});
        const data = draw.stub!.data;
        expect(data.kind).toBe('rectilinear');
        if (data.kind !== 'rectilinear') throw new Error('Expected a rectilinear source with rectangular components.');
        // The L-shaped whole is not a trapezoid. Its two explicit rectangular
        // components supply the inherited involvement claim and additive areas.
        expect(data.leftArea).toBe(data.leftWidth * data.totalHeight);
        expect(data.rightArea).toBe(data.rightWidth * data.bottomHeight);
        expect(data.totalArea).toBe(data.leftArea + data.rightArea);
        expect(data.bottomHeight).toBeLessThan(data.totalHeight);
        expect(draw.labels).toContain(Area.Rectangle);
        expect(draw.labels).not.toContain(Area.Trapezoid);
        expect(capabilitySatisfies(Area.Rectangle, Area.Trapezoid)).toBe(true);
    });
});
