import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberArrayTotalViewSchema, spec} from './spec.ts';

describe('operations-number-array-total view spec', () => {
    it('owns execution of the requested array quantity', () => {
        expect(spec.generalLabels).toEqual([
            Scope.NumberArray,
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]);
        expect(spec.requiredLabels).toBeUndefined();
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsNumberArrayTotalViewSchema).toEqual({});
    });
});
