import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';

describe('ArithmeticPatternsGenerator', () => {
    const generator = new ArithmeticPatternsGenerator();

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates coherent addition and multiplication table patterns', () => {
        for (const operation of [Area.Addition, Area.Multiplication] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    operation,
                    useCommutativeLaw: false,
                    useAssociativeLaw: false,
                    useDistributiveLaw: false
                })!;
                const data = stub.data;
                expect(data.table).toHaveLength(7);
                expect(data.sequence).toEqual(data.table[data.focusRow]);
                expect(data.patternAnswer).toBe(`Increase by ${data.patternStep}`);
                expect(data.patternOptions).toContain(data.patternAnswer);
                data.table.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
                    expect(value).toBe(operation === Area.Addition
                        ? rowIndex + columnIndex
                        : rowIndex * columnIndex);
                }));
            }
        }
    });

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative'],
        [Area.Multiplication, 'distributive']
    ] as const)('generates a valid %s %s explanation', (operation, propertyLaw) => {
        const stub = generator.generate({
            operation,
            useCommutativeLaw: propertyLaw === 'commutative',
            useAssociativeLaw: propertyLaw === 'associative',
            useDistributiveLaw: propertyLaw === 'distributive'
        })!;
        expect(stub.data.propertyLaw).toBe(propertyLaw);
        expect(stub.data.leftExpression).toBeTruthy();
        expect(stub.data.rightExpression).toBeTruthy();
        expect(stub.data.explanation).toBeTruthy();
        expect(stub.data.highlightedCells!.length).toBeGreaterThan(0);
    });

    it('rejects unsupported or conflicting configurations', () => {
        expect(generator.generate({
            operation: 'unsupported',
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            operation: Area.Addition,
            useCommutativeLaw: true,
            useAssociativeLaw: true,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            operation: Area.Addition,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: true
        })).toBeNull();
    });
});
