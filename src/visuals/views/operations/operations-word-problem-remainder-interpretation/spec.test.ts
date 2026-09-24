import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem-remainder-interpretation view spec', () => {
    it('owns contextual result interpretation for imperfect division', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.ResultInterpretation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
    });
});
