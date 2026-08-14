import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {EqualGroupsCollectionGenerator} from './generator.ts';

describe('EqualGroupsCollectionGenerator spec integration', () => {
    const generator = new EqualGroupsCollectionGenerator();

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.PartitiveDivision, 'partitive-division'],
        [Area.QuotativeDivision, 'quotative-division']
    ] as const)('resolves %s interpretation targets', (area, operation) => {
        const stub = generateWithLabels(generator, [
            area,
            Scope.EqualShares,
            Scope.PhysicalNumbers,
            Scope.NumbersSmaller100,
            Ability.Interpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.tags).toContain(area);
    });
});
