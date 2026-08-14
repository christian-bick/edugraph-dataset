import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {NumberArrayGenerator} from './generator.ts';

describe('NumberArrayGenerator spec integration', () => {
    const generator = new NumberArrayGenerator();

    it('resolves a basic number-array target', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Scope.NumberArray,
            Ability.ProcedureExecution
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.rows).toBeGreaterThanOrEqual(2);
    });

    it('resolves iterated-operation targets into at least three equal addends', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Area.IteratedOperation,
            Scope.NumberArray,
            Ability.Formalization
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.addends.length).toBeGreaterThanOrEqual(3);
        expect(new Set(stub!.data.addends).size).toBe(1);
        expect(stub!.tags).toContain(Area.IteratedOperation);
    });

    it.each([
        [Area.Multiplication, 'multiplication'],
        [Area.PartitiveDivision, 'partitive-division'],
        [Area.QuotativeDivision, 'quotative-division']
    ] as const)('resolves %s equal-group interpretation targets', (area, operation) => {
        const stub = generateWithLabels(generator, [
            area,
            Scope.EqualShares,
            Scope.NumberArray,
            Scope.NumbersSmaller100,
            Ability.Interpretation
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.operation).toBe(operation);
        expect(stub!.tags).toContain(area);
    });
});
