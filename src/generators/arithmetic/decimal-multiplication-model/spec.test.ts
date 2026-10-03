import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalMultiplicationModelGenerator} from './generator.ts';
import {DecimalMultiplicationModelGeneratorSchema, spec} from './spec.ts';

describe('DecimalMultiplicationModelGenerator spec', () => {
    it('declares the reviewed mathematical capabilities without view Abilities', () => {
        expect(spec.generatorId).toBe('decimal-multiplication-model');
        expect(spec.generalLabels).toEqual([
            Area.Multiplication,
            Area.PlaceValue,
            Scope.HundredthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoOperands
        ]);
        expect(DecimalMultiplicationModelGeneratorSchema).toEqual({});
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
    });

    it('resolves the Grade 5 target to an exact area model', () => {
        const generator = new DecimalMultiplicationModelGenerator();
        setSeed('decimal-multiplication-target');
        const stub = generateWithLabels(generator, [
            Area.Multiplication,
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
        ])!;
        expect(stub).not.toBeNull();
        expect(stub.labels).toEqual([]);
        expect(stub.data.kind).toBe('decimal-multiplication-model');
        expect(stub.data.areaGrid.cellCount)
            .toBe(stub.data.first.valueInHundredths * stub.data.second.valueInHundredths);

        setSeed('decimal-multiplication-target');
        expect(generator.generate({})?.data).toEqual(stub.data);
    });
});
