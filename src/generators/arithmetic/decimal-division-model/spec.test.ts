import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {DecimalDivisionModelGenerator} from './generator.ts';
import {DecimalDivisionModelGeneratorSchema, spec} from './spec.ts';

describe('DecimalDivisionModelGenerator spec', () => {
    it('declares the reviewed mathematical capabilities with no view Ability', () => {
        expect(spec.generatorId).toBe('decimal-division-model');
        expect(spec.generalLabels).toEqual([
            Area.Division,
            Area.PlaceValue,
            Scope.HundredthDecimals,
            Scope.Base10,
            Scope.NumbersWithoutNegatives,
            Scope.TwoOperands
        ]);
        expect(DecimalDivisionModelGeneratorSchema).toEqual({});
        expect(spec.generalLabels).not.toContain(Ability.ProcedureExecution);
    });

    it('resolves the Grade 5 decimal division target to an exact grouping', () => {
        const generator = new DecimalDivisionModelGenerator();
        const labels = [
            Area.Division,
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
        ];
        setSeed('decimal-division-target');
        const stub = generateWithLabels(generator, labels)!;
        expect(stub).not.toBeNull();
        expect(stub.labels).toEqual([]);
        expect(stub.data.kind).toBe('decimal-division-model');
        expect(stub.data.inverse.divisorTimesQuotientInMillionths)
            .toBe(stub.data.inverse.dividendInMillionths);

        setSeed('decimal-division-target');
        expect(generator.generate({}).data).toEqual(stub.data);
    });
});
