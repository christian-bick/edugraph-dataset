import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('OperationsKnownFactDerivationViewSpec', () => {
    it('owns invariant procedure understanding', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureUnderstanding]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
