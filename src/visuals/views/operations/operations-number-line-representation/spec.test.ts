import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsNumberLineRepresentationViewSchema, spec} from './spec.ts';

describe('operations-number-line-representation view spec', () => {
    it('owns invariant visual articulation on a number line', () => {
        expect(spec.generalLabels).toEqual([Scope.Numberline, Ability.VisualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(OperationsNumberLineRepresentationViewSchema).toEqual({});
    });
});
