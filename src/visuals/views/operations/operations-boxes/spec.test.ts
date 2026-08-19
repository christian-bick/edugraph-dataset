import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, extractSchemaLabels} from '../../../../lib/utils.ts';
import {OperationsBoxesViewSchema} from './spec.ts';

describe('OperationsBoxesViewSchema', () => {
    it('owns ProcedureInversion as visible blank placement', () => {
        const {config, consumedLabels} = extractConfig(
            OperationsBoxesViewSchema,
            [Ability.ProcedureInversion]
        );

        expect(config.invertProcedure).toBe(true);
        expect(consumedLabels).toContain(Ability.ProcedureInversion);
        expect(extractSchemaLabels(OperationsBoxesViewSchema))
            .toContain(Ability.ProcedureInversion);
    });

    it('keeps ordinary execution in direct-answer mode', () => {
        expect(extractConfig(OperationsBoxesViewSchema, []).config.invertProcedure)
            .toBe(false);
    });
});
