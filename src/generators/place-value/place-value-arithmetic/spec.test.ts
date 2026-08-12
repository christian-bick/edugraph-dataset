import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueArithmeticGenerator} from './generator.ts';

describe('PlaceValueArithmeticGenerator spec integration', () => {
    it.each([Area.Addition, Area.Subtraction] as const)('resolves %s regrouping targets', operation => {
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [
            Area.PlaceValue,
            Area.IntegerRegrouping,
            operation,
            Scope.PhysicalNumbers,
            Scope.TwoOperands,
            Scope.NumbersSmaller1000,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation === Area.Addition ? 'addition' : 'subtraction');
        expect(stub!.tags).toContain(operation);
    });
});
