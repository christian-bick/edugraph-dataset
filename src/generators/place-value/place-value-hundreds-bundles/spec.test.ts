import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueHundredsBundlesGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('place-value-hundreds-bundles spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.MultiplesOf100]));
        expect(new PlaceValueHundredsBundlesGenerator().schema).not.toHaveProperty('useHundreds');
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new PlaceValueHundredsBundlesGenerator(), [])!.data;
            expect(data.ones).toBe(0);
        }
    });
});
