import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('ShapeSquareArrayViewSchema', () => {
    it('owns invariant square-array procedure execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
