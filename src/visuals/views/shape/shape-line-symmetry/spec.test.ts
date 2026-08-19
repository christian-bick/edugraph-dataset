import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {ShapeLineSymmetryViewSchema} from './spec.ts';

describe('ShapeLineSymmetry view spec', () => {
    it.each([
        [[Ability.ConceptClassification, Ability.VisualRecognition], 'identify'],
        [[Ability.VisualArticulation], 'draw']
    ] as const)('resolves %j to the %s presentation', (labels, taskMode) => {
        const resolved = extractConfig(ShapeLineSymmetryViewSchema, [...labels]);

        expect(resolved.config.taskMode).toBe(taskMode);
        expect(resolved.consumedLabels).toEqual(expect.arrayContaining([...labels]));
    });
});
