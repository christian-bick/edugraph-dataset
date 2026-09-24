import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('ShapeSquareArrayViewSchema', () => {
    it('owns invariant square-array procedure execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Scope.TileScale]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
