import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-bar-graph-arithmetic view spec', () => {
    it('owns invariant arithmetic from a bar graph', () => {
        expect(spec.generalLabels).toEqual([Scope.BarGraph, Ability.ProcedureExecution]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
