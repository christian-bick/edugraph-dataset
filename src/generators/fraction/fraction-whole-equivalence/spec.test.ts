import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionWholeEquivalenceGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('fraction-whole-equivalence schema', () => {
    it('always emits its declared family, including for a broad target', () => {
        const generator = new FractionWholeEquivalenceGenerator();
        for (const labels of [[], [...spec.generalLabels]]) {
            expect(generateWithLabels(generator, labels)!.data.task).toBe('represent-whole-as-fraction');
        }
    });
});
