import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberLineArithmeticViewSchema, spec} from './spec.ts';
import {planModelCompatibility} from '../../../../lib/model-compatibility.ts';
import {ArithmeticOpsPairsGeneratorSchema, spec as generatorSpec} from '../../../../generators/arithmetic/arithmetic-ops-pairs/spec.ts';

describe('operations-number-line-arithmetic view spec', () => {
    it('owns invariant execution and excludes unsupported operations', () => {
        expect(spec.generalLabels).toEqual([
            Scope.Numberline, Scope.ArabicNumerals, Ability.ProcedureExecution
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual(expect.arrayContaining([
            Area.Multiplication,
            Area.Division,
            Scope.NumbersWithoutZero
        ]));
        expect(OperationsNumberLineArithmeticViewSchema).toEqual({});
    });

    it('preserves requested number lines and rejects incompatible zero-free producer selections', () => {
        const plan = (labels: string[]) => planModelCompatibility({id: 'line-zero', labels},
            {generatorId: generatorSpec.generatorId, generalLabels: generatorSpec.generalLabels,
                schema: ArithmeticOpsPairsGeneratorSchema, spec: generatorSpec},
            {viewId: spec.viewId, generalLabels: spec.generalLabels,
                schema: OperationsNumberLineArithmeticViewSchema, spec});
        const labels = [Area.Addition, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller20];
        expect(plan([...labels, Scope.Numberline]).supported).toBe(true);
        expect(plan([...labels, Scope.Numberline, Scope.NumbersWithZero]).supported).toBe(true);
        expect(plan([...labels, Scope.Numberline, Scope.NumbersWithoutZero]).supported).toBe(false);
        // Broad future targets must not silently pair a completed zero-absence claim
        // with this view's zero reference origin.
        expect(plan(labels).supported).toBe(false);
    });
});
