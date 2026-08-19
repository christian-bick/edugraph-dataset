import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapePatternsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapePatternsGenerator();

describe('ShapePatternsGenerator spec integration', () => {
    it('keeps invariant pattern and geometry labels in general capabilities', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualGeometry
        ]);
    });

    it.each([
        [[Area.PatternGeneration, Ability.VisualArticulation], 'generate'],
        [[Area.EmergentFeatureRecognition, Ability.ConceptClassification], 'identify'],
        [[
            Area.PatternGeneration,
            Area.EmergentFeatureRecognition,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ], 'explain']
    ] as const)('resolves %j to the %s task', (labels, task) => {
        const stub = generateWithLabels(generator, [
            Scope.VisualGeometry,
            ...labels
        ])!;

        expect(stub).not.toBeNull();
        expect(stub.data.task).toBe(task);
        expect(stub.tags).toEqual(expect.arrayContaining(
            labels.filter(label => label === Area.PatternGeneration
                || label === Area.EmergentFeatureRecognition)
        ));
        expect(stub.tags).not.toContain(Ability.VisualArticulation);
        expect(stub.tags).not.toContain(Ability.ConceptClassification);
        expect(stub.tags).not.toContain(Ability.ProcedureUnderstanding);
        expect(stub.tags).not.toContain(Ability.TextualArticulation);
    });

    it('requires an Area-defined task even when an ability is supplied', () => {
        expect(generateWithLabels(generator, [
            Scope.VisualGeometry,
            Ability.TextualArticulation
        ])).toBeNull();
    });
});
