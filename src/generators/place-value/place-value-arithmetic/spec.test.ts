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

    it.each([
        [Area.AdditionPlaceValuePartitioning, 'addition'],
        [Area.SubtractionPlaceValuePartitioning, 'subtraction']
    ] as const)('resolves the specific %s strategy', (strategy, operation) => {
        const stub = generateWithLabels(new PlaceValueArithmeticGenerator(), [
            strategy,
            Area.IntegerRegrouping,
            Scope.PhysicalNumbers,
            Scope.TwoOperands,
            Scope.NumbersSmaller1000,
            Ability.ProcedureUnderstanding
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.tags).toContain(strategy);
    });
});
