import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {ArithmeticPatternsGenerator} from './generator.ts';

describe('ArithmeticPatternsGenerator', () => {
    const generator = new ArithmeticPatternsGenerator();
    const config = (operation: typeof Area.Addition | typeof Area.Multiplication) => ({
        operation,
        useCommutativeLaw: false,
        useAssociativeLaw: false,
        useDistributiveLaw: false
    });

    it('strictly validates configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
    });

    it('generates one canonical rule, term, feature, and table model', () => {
        for (const operation of [Area.Addition, Area.Multiplication] as const) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const data = generator.generate(config(operation))!.data;

                expect(data.table).toHaveLength(7);
                expect(data.sequence).toEqual(data.table[data.focusRow]);
                expect(data.patternStep).toBe(operation === Area.Addition ? 1 : data.focusRow);
                expect(data.ruleText).toBeTruthy();
                expect(data.inferredFeature).toBeTruthy();
                expect(data.featureEvidence).toBeTruthy();
                expect(data.explanation).toBeTruthy();
                expect(data).not.toHaveProperty('task');
                expect(data).not.toHaveProperty('prompt');
                expect(data).not.toHaveProperty('response');
                expect(data).not.toHaveProperty('missingTermIndex');
                expect(data).not.toHaveProperty('featureOptions');

                data.table.forEach((row, rowIndex) => row.forEach((value, columnIndex) => {
                    expect(value).toBe(operation === Area.Addition
                        ? rowIndex + columnIndex
                        : rowIndex * columnIndex);
                }));
                data.terms.slice(1).forEach((term, index) => {
                    const previous = data.terms[index];
                    expect(term).toBe(data.ruleOperation === 'add'
                        ? previous + data.ruleValue
                        : previous * data.ruleValue);
                });
            }
        }
    });

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative'],
        [Area.Multiplication, 'distributive']
    ] as const)('preserves a structured %s %s witness', (operation, propertyLaw) => {
        setSeed(27);
        const data = generator.generate({
            ...config(operation),
            useCommutativeLaw: propertyLaw === 'commutative',
            useAssociativeLaw: propertyLaw === 'associative',
            useDistributiveLaw: propertyLaw === 'distributive'
        })!.data;

        expect(data.propertyLaw).toBe(propertyLaw);
        expect(data.leftExpression).toBeTruthy();
        expect(data.rightExpression).toBeTruthy();
        expect(data.propertyResult).toBeTypeOf('number');
        expect(data.highlightedCells!.length).toBeGreaterThan(0);
        expect(data.explanation).toContain(
            propertyLaw === 'commutative'
                ? 'commutative'
                : propertyLaw === 'associative'
                    ? 'associative'
                    : 'distributive'
        );
    });

    it('rejects unsupported and contradictory mathematical configurations', () => {
        expect(generator.generate({...config(Area.Addition), operation: 'unsupported'})).toBeNull();
        expect(generator.generate({
            ...config(Area.Multiplication),
            useCommutativeLaw: true,
            useAssociativeLaw: true
        })).toBeNull();
        expect(generator.generate({
            ...config(Area.Addition),
            useDistributiveLaw: true
        })).toBeNull();
    });
});
