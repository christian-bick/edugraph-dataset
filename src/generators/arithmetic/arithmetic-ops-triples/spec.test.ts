import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {ArithmeticOpsTriplesGenerator} from './generator.ts';

describe('ArithmeticOpsTriplesGenerator Spec Integration', () => {
    const generator = new ArithmeticOpsTriplesGenerator();

    it('resolves Sum into a three-addend addition payload', () => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            Area.Sum,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.num1 + stub!.data.num2 + stub!.data.num3).toBe(stub!.data.answer);
        expect(stub!.tags).toContain(Area.Addition);
    });

    it.each([
        [Area.CommutativeLaw, 'commutative'],
        [Area.AssociativeLaw, 'associative']
    ] as const)('resolves %s into its triple property payload', (law, propertyLaw) => {
        const stub = generateWithLabels(generator, [
            Area.Addition,
            law,
            Scope.NumbersWithoutNegatives,
            Scope.NumbersSmaller20
        ]);
        expect(stub).not.toBeNull();
        expect(stub!.data.propertyLaw).toBe(propertyLaw);
        expect(stub!.tags).toContain(law);
    });

    it('does not expose negative or procedure-inversion configuration', () => {
        expect(generator.schema).not.toHaveProperty('requireNegative');
        expect(generator.schema).not.toHaveProperty('invertProcedure');
        expect(generator.schema).not.toHaveProperty('useThreeAddends');
    });
});
