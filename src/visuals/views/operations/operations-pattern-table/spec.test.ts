import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../../lib/utils.ts';
import {OperationsPatternTableViewSchema} from './spec.ts';

describe('OperationsPatternTableViewSchema', () => {
    it('enables classification presentation only for classification targets', () => {
        expect(extractConfig(OperationsPatternTableViewSchema, [
            Scope.ArabicNumerals,
            Ability.ConceptClassification
        ]).config.classificationMode).toBe(true);
        expect(extractConfig(OperationsPatternTableViewSchema, [
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]).config.classificationMode).toBe(false);
    });
});
