import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('ShapeSquareArrayViewSchema', () => {
    it('owns invariant square-array procedure execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.requiredLabels).toEqual([Scope.TileScale]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
