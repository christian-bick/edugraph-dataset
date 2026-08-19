import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsWordProblemViewSchema} from './spec.ts';

describe('OperationsWordProblemViewSchema', () => {
    it('owns ProcedureInversion as the scenario unknown', () => {
        const {config, consumedLabels} = extractConfig(
            OperationsWordProblemViewSchema,
            [Ability.ProcedureInversion]
        );

        expect(config.invertProcedure).toBe(true);
        expect(consumedLabels).toContain(Ability.ProcedureInversion);
    });

    it('keeps ordinary execution in direct-answer mode', () => {
        expect(extractConfig(OperationsWordProblemViewSchema, []).config.invertProcedure)
            .toBe(false);
    });
});
