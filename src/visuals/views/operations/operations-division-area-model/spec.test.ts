import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {MultiDigitDivisionGeneratorSchema, spec as generator} from '../../../../generators/arithmetic/multi-digit-division/spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {OperationsDivisionAreaModelViewSchema, spec} from './spec.ts';

const plan = (labels: string[]) => planModelCompatibility({id: 'partial-quotient-participation', labels},
    {generatorId: generator.generatorId, spec: generator, generalLabels: generator.generalLabels, schema: MultiDigitDivisionGeneratorSchema},
    {viewId: spec.viewId, spec, generalLabels: spec.generalLabels, schema: OperationsDivisionAreaModelViewSchema});

describe('mandatory partial-quotient method participation', () => {
    it('requires the assessed division method instead of matching only its intermediate multiplication or subtraction', () => {
        for (const area of [Area.Multiplication, Area.Subtraction]) {
            expect(plan([area, Scope.TwoOperands, Scope.NumbersSmaller20, Ability.ProcedureExecution]).supported).toBe(false);
        }
        expect(plan([Area.DivisionPartialQuotients, Scope.SingleDigitDivisor, Scope.TwoDigitDividend,
            Scope.NumbersWithoutZero, Ability.ProcedureExecution, Ability.ProcedureUnderstanding]).supported).toBe(true);
    });
});
