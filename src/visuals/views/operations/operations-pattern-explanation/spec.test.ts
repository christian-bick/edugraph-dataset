import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsPatternExplanationViewSchema} from './spec.ts';

describe('OperationsPatternExplanationViewSchema', () => {
    it('enables explanation presentation only for understanding targets', () => {
        expect(extractConfig(OperationsPatternExplanationViewSchema, [
            Scope.ArabicNumerals,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]).config.explanationMode).toBe(true);
        expect(extractConfig(OperationsPatternExplanationViewSchema, [
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]).config.explanationMode).toBe(false);
    });
});
