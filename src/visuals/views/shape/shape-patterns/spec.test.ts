import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {ShapePatternsViewSchema} from './spec.ts';

describe('ShapePatternsViewSchema', () => {
    it.each([
        [[Ability.VisualArticulation], 'generate'],
        [[Ability.ConceptClassification], 'identify'],
        [[Ability.ProcedureUnderstanding, Ability.TextualArticulation], 'explain']
    ] as const)('resolves %j to view task %s', (labels, task) => {
        expect(extractConfig(ShapePatternsViewSchema, [...labels]).config.taskMode).toBe(task);
    });
});
