import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {PlaceValueArithmeticModelViewSchema, spec} from './spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {PlaceValueArithmeticGeneratorSchema, spec as generatorSpec} from '../../../../generators/place-value/place-value-arithmetic/spec.ts';

describe('place-value arithmetic model spec', () => {
    it('owns the model task without rejecting the inclusive arithmetic endpoint10', () => {
        expect(spec.generalLabels).toEqual([
            Scope.PhysicalNumbers,
            Ability.ProcedureUnderstanding,
            Scope.ArabicNumerals
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(PlaceValueArithmeticModelViewSchema).toEqual({});
    });

    it('admits real regrouping at10 while generator feasibility excludes an unsupported ten-bundle task', () => {
        const generator = {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
            schema: PlaceValueArithmeticGeneratorSchema, spec: generatorSpec};
        const view = {viewId: spec.viewId, generalLabels: spec.generalLabels, schema: PlaceValueArithmeticModelViewSchema, spec};
        for (const operation of [Area.AdditionPlaceValuePartitioning, Area.SubtractionPlaceValuePartitioning]) {
            expect(planModelCompatibility({id: 'endpoint10', labels: [...spec.generalLabels, operation,
                Area.IntegerRegrouping, Scope.TwoOperands, Scope.NumbersSmaller10]}, generator, view).supported).toBe(true);
        }
        expect(planModelCompatibility({id: 'ten-bundle', labels: [Area.PlaceValue, Scope.MultiplesOf10,
            Scope.PhysicalNumbers, Scope.NumbersWithoutZero, Scope.NumbersSmaller10,
            Ability.ProcedureUnderstanding]}, generator, view).supported).toBe(false);
    });
});
