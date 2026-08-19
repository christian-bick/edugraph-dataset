import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsVerticalViewSchema} from './spec.ts';

describe('OperationsVerticalViewSchema', () => {
    it('owns ProcedureInversion as visible blank placement', () => {
        const {config, consumedLabels} = extractConfig(
            OperationsVerticalViewSchema,
            [Ability.ProcedureInversion]
        );

        expect(config.invertProcedure).toBe(true);
        expect(consumedLabels).toContain(Ability.ProcedureInversion);
    });

    it('keeps ordinary execution in direct-answer mode', () => {
        expect(extractConfig(OperationsVerticalViewSchema, []).config.invertProcedure)
            .toBe(false);
    });
});
