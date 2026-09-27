import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {setSeed} from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {CountingClassifySortGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('CountingClassifySortGenerator schema', () => {
    it.each([
        [Scope.Least, 'least'], [Scope.Most, 'most'],
        [Scope.AscendingOrder, 'ascending'], [Scope.DescendingOrder, 'descending']
    ])('resolves %s to its mathematical relation', (label, relation) => {
        const generator = new CountingClassifySortGenerator();
        let result = null;
        for (let seed = 1; seed <= 100 && !result; seed++) {
            setSeed(seed);
            result = generateWithLabels(generator, [Scope.NumbersSmaller10, label]);
        }
        expect(result).not.toBeNull();
        expect(result!.data.relation).toBe(relation);
        expect(result!.labels).toContain(label);
        expect(result!.data.numObjects).toBeLessThanOrEqual(10);
        expect(result!.data.ascendingGroups.flat()).toHaveLength(3);
        if (relation === 'least') expect(result!.data.minimumCategories).toHaveLength(1);
        if (relation === 'most') expect(result!.data.maximumCategories).toHaveLength(1);
    });

    it('leaves the complete-order claim to the view that elicits it', () => {
        expect(spec.generalLabels).not.toContain(Area.NumericOrder);
        expect(spec.generalLabels).not.toContain(Scope.ArabicNumerals);
        expect(spec.generalLabels).not.toContain(Scope.Base10);
    });

    it.each([Scope.Least, Scope.Most, Scope.AscendingOrder, Scope.DescendingOrder])(
        'satisfies the supported larger lower bound with %s', relation => {
            const generator = new CountingClassifySortGenerator();
            let result = null;
            for (let seed = 1; seed <= 100 && !result; seed++) {
                setSeed(seed);
                result = generateWithLabels(generator, [Scope.NumbersLarger5, Scope.NumbersSmaller20, relation]);
            }
            expect(result).not.toBeNull();
            expect(result!.labels).toContain(Scope.NumbersLarger5);
            for (const count of [...Object.values(result!.data.categories), result!.data.numObjects]) {
                expect(count).toBeGreaterThanOrEqual(5);
                expect(count).toBeLessThanOrEqual(20);
            }
        }
    );
});
