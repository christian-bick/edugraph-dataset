import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionTenthsEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('fraction-tenths-equivalence schema', () => {
    it('always emits its declared family, including for a broad target', () => {
        const generator = new FractionTenthsEquivalenceGenerator();
        for (const labels of [[], [...spec.generalLabels]]) {
            expect(generateWithLabels(generator, labels)!.data.task).toBe('tenths-to-hundredths');
        }
    });
});
