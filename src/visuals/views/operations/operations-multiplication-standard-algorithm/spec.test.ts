import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsMultiplicationStandardAlgorithmViewSchema, spec} from './spec.ts';

describe('operations-multiplication-standard-algorithm spec', () => {
    it('fixes the numeral procedure task without view-side mathematical options', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ProcedureExecution]);
        expect(OperationsMultiplicationStandardAlgorithmViewSchema).toEqual({});
    });
});
