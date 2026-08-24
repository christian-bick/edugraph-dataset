import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-equal-square-count view spec', () => {
    it('owns equal-square counting execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.requiredLabels).toBeUndefined();
    });
});
