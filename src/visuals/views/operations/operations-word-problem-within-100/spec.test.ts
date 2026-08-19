import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsWordProblemWithin100ViewSchema} from './spec.ts';

describe('OperationsWordProblemWithin100ViewSchema', () => {
    it('owns ProcedureInversion as the one-step scenario unknown', () => {
        const {config, consumedLabels} = extractConfig(
            OperationsWordProblemWithin100ViewSchema,
            [Ability.ProcedureInversion]
        );

        expect(config.invertProcedure).toBe(true);
        expect(consumedLabels).toContain(Ability.ProcedureInversion);
    });

    it('keeps ordinary execution in direct-answer mode', () => {
        expect(extractConfig(
            OperationsWordProblemWithin100ViewSchema,
            []
        ).config.invertProcedure).toBe(false);
    });
});
