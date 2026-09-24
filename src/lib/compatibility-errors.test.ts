import {describe, expect, it} from 'vitest';
import {CompatibilityContractError} from './compatibility-errors.ts';
import {CompatibilityContractError as ServerContractError, CompatibilityLimitError} from './compatibility.ts';
import {requireTargetLabels} from './target-policies.ts';

describe('shared compatibility errors', () => {
    it('preserves class identity and causes across the spec and server boundaries', () => {
        expect(ServerContractError).toBe(CompatibilityContractError);
        const cause = new Error('underlying defect');
        const error = new CompatibilityContractError('invalid contract', {cause});
        expect(error.name).toBe('CompatibilityContractError');
        expect(error.cause).toBe(cause);
        expect(new CompatibilityLimitError([], 1)).toBeInstanceOf(CompatibilityContractError);
        expect(() => requireTargetLabels('invalid', [''])).toThrow(ServerContractError);
    });
});
