import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, findSchemaFallbackContractIssues, generateWithLabels} from '../../../lib/utils.ts';
import {PlaceValueHundredsBundlesGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('place-value-hundreds-bundles spec', () => {
    it('declares its fixed mathematical family as an invariant', () => {
        expect(spec.generalLabels).toEqual(expect.arrayContaining([Scope.MultiplesOf100]));
        expect(new PlaceValueHundredsBundlesGenerator().schema).not.toHaveProperty('useHundreds');
    });

    it('binds regrouping as an existing mathematical Area rather than inferring a model from its bound', () => {
        const generator = new PlaceValueHundredsBundlesGenerator();
        const labels = [Scope.NumbersSmaller100];
        expect(extractConfig(generator.schema, labels).config.requireRegrouping).toBe(false);
        expect(generateWithLabels(generator, labels)!.data.tens).toBe(0);
        const exchanged = generateWithLabels(generator, [...labels, Area.IntegerRegrouping])!;
        expect(exchanged.data.tens).toBe(10);
        expect(exchanged.labels).toContain(Area.IntegerRegrouping);
        expect(spec.generalLabels).not.toContain(Area.IntegerRegrouping);
        expect(spec).not.toHaveProperty('inferredLabels');
        expect(findSchemaFallbackContractIssues(generator.schema)).toEqual([]);
    });

    it('keeps the required one-hundred witness and rejects positive floors for regrouping', () => {
        const generator = new PlaceValueHundredsBundlesGenerator();
        const exchanged = generateWithLabels(generator, [Area.IntegerRegrouping, Scope.NumbersSmaller100])!;
        expect(exchanged.data.hundreds).toBe(1);
        expect(() => extractConfig(generator.schema, [Area.IntegerRegrouping,
            Scope.NumbersSmaller1000, Scope.NumbersLarger5])).toThrow();
    });

    it('keeps the same payload family even when the target omits its family labels', () => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const data = generateWithLabels(new PlaceValueHundredsBundlesGenerator(), [])!.data;
            expect(data.ones).toBe(0);
        }
    });
});
