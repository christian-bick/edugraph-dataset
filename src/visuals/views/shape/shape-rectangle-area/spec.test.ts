import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-rectangle-area view spec', () => {
    it('owns direct rectangle-area execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(spec.requiredLabels).toBeUndefined();
    });
});
