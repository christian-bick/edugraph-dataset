import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalAdditionSubtractionGenerator} from './generator.ts';
import {spec} from './spec.ts';

const commonLabels = [
    Area.PlaceValue,
    Scope.HundredthDecimals,
    Scope.Base10,
    Scope.NumbersWithoutNegatives,
    Scope.TwoOperands,
    Scope.ArabicNumerals,
    Scope.VisualNumbers,
    Ability.ProcedureExecution,
    Ability.ProcedureUnderstanding,
    Ability.TextualArticulation
] as const;

describe('DecimalAdditionSubtractionGenerator spec integration', () => {
    const generator = new DecimalAdditionSubtractionGenerator();

    it('declares only invariant producer claims and an operation choice', () => {
        expect(spec.generatorId).toBe('decimal-addition-subtraction');
        expect(spec.generalLabels).toEqual([
            Area.PlaceValue,
            Scope.HundredthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoOperands
        ]);
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
    });

    it.each([
        ['addition', Area.Addition],
        ['subtraction', Area.Subtraction]
    ] as const)('resolves the %s target from selected labels', (operation, area) => {
        const labels = [...commonLabels, area];
        setSeed(`decimal-add-subtract-labels-${operation}`);
        const stub = generateWithLabels(generator, labels);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.labels).toEqual([area]);
        expect(stub!.labels).not.toContain(Ability.ProcedureExecution);

        setSeed(`decimal-add-subtract-labels-${operation}`);
        expect(generator.generate({operation})?.data).toEqual(stub!.data);
    });
});
