import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsNumericalExpressionWriteViewSchema, spec} from './spec.ts';

describe('operations-numerical-expression-write view spec', () => {
    it('requires the written source description that the view always supplies', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Ability.TextualReception]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsNumericalExpressionWriteViewSchema).toEqual({});
    });
});
