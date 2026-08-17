import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ShapePatternsGenerator} from './generator.ts';
import {spec} from './spec.ts';

const generator = new ShapePatternsGenerator();

describe('ShapePatternsGenerator spec integration', () => {
    it('keeps invariant pattern and geometry labels in general capabilities', () => {
        expect(spec.generalLabels).toEqual([
            Area.PatternRecognition,
            Scope.VisualGeometry
        ]);
    });

    it.each([
        [[Ability.VisualArticulation], 'generate'],
        [[Ability.ConceptClassification], 'identify'],
        [[Ability.ProcedureUnderstanding, Ability.TextualArticulation], 'explain']
    ] as const)('resolves %j to the %s task', (abilities, task) => {
        const stub = generateWithLabels(generator, [
            Area.PatternRecognition,
            Scope.VisualGeometry,
            ...abilities
        ])!;

        expect(stub).not.toBeNull();
        expect(stub.data.task).toBe(task);
        expect(stub.tags).toEqual(expect.arrayContaining([...abilities]));
    });

    it('does not accept textual articulation without procedure understanding', () => {
        expect(generateWithLabels(generator, [
            Area.PatternRecognition,
            Scope.VisualGeometry,
            Ability.TextualArticulation
        ])).toBeNull();
    });
});
