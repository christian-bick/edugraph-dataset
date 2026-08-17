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
                    task: 'generate',
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

    it('preserves the legacy Grade 3 table-identification payload', () => {
        setSeed(12);
        const problem = generator.generate({
            task: 'legacy-identify',
            operation: Area.Multiplication,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        })!.data;

        expect(problem.task).toBeUndefined();
        expect(problem.sequence).toEqual(problem.table[problem.focusRow]);
        expect(problem.patternAnswer).toBe(`Increase by ${problem.patternStep}`);
        expect(problem.patternOptions).toContain(problem.patternAnswer);
    });

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative'],
        [Area.Multiplication, 'distributive']
    ] as const)('generates a valid %s %s explanation', (operation, propertyLaw) => {
        const stub = generator.generate({
            task: 'explain-feature',
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

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative'],
        [Area.Multiplication, 'distributive']
    ] as const)('preserves the legacy Grade 3 %s %s property table', (operation, propertyLaw) => {
        for (let seed = 0; seed < 50; seed++) {
            setSeed(seed);
            const problem = generator.generate({
                task: 'legacy-explain',
                operation,
                useCommutativeLaw: propertyLaw === 'commutative',
                useAssociativeLaw: propertyLaw === 'associative',
                useDistributiveLaw: propertyLaw === 'distributive'
            })!.data;

            expect(problem.task).toBeUndefined();
            expect(problem.propertyLaw).toBe(propertyLaw);
            expect(problem.leftExpression).toBeTruthy();
            expect(problem.rightExpression).toBeTruthy();
            expect(problem.explanation).toBeTruthy();
        }
    });

    it('rejects unsupported or conflicting configurations', () => {
        expect(generator.generate({
            task: 'generate',
            operation: 'unsupported',
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            task: 'explain-feature',
            operation: Area.Addition,
            useCommutativeLaw: true,
            useAssociativeLaw: true,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            task: 'explain-feature',
            operation: Area.Addition,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: true
        })).toBeNull();
    });

    it.each([Area.Addition, Area.Multiplication] as const)(
        'generates a complete %s rule sequence with one generator-authored response',
        operation => {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const problem = generator.generate({
                    task: 'generate',
                    operation,
                    useCommutativeLaw: false,
                    useAssociativeLaw: false,
                    useDistributiveLaw: false
                })!.data;

                expect(problem.task).toBe('generate');
                if (problem.task !== 'generate') throw new Error('Unexpected task');
                expect(problem.startValue).toBe(problem.terms[0]);
                expect(problem.response).toBe(problem.terms[problem.missingTermIndex]);
                expect(problem.missingTermIndex).toBeGreaterThan(1);
                for (let index = 1; index < problem.terms.length; index++) {
                    const expected = problem.ruleOperation === 'add'
                        ? problem.terms[index - 1] + problem.ruleValue
                        : problem.terms[index - 1] * problem.ruleValue;
                    expect(problem.terms[index]).toBe(expected);
                }
            }
        }
    );

    it.each([Area.Addition, Area.Multiplication] as const)(
        'identifies a non-explicit %s pattern feature from visible terms',
        operation => {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const problem = generator.generate({
                    task: 'identify-feature',
                    operation,
                    useCommutativeLaw: false,
                    useAssociativeLaw: false,
                    useDistributiveLaw: false
                })!.data;

                expect(problem.task).toBe('identify-feature');
                if (problem.task !== 'identify-feature') throw new Error('Unexpected task');
                expect(problem.ruleText).not.toContain(problem.inferredFeature);
                expect(problem.featureOptions).toContain(problem.inferredFeature);
                expect(problem.patternAnswer).toBe(problem.inferredFeature);
                expect(problem.response).toBe(problem.inferredFeature);
                expect(problem.featureEvidence.length).toBeGreaterThan(0);

                if (operation === Area.Addition) {
                    for (let index = 1; index < problem.terms.length; index++) {
                        expect(problem.terms[index] % 2).not.toBe(problem.terms[index - 1] % 2);
                    }
                } else {
                    expect(problem.terms.slice(1).every(term => term % 2 === 0)).toBe(true);
                }
            }
        }
    );

    it.each([
        [Area.Addition, 'commutative'],
        [Area.Addition, 'associative'],
        [Area.Multiplication, 'commutative'],
        [Area.Multiplication, 'associative'],
        [Area.Multiplication, 'distributive']
    ] as const)('causally explains the non-explicit %s %s feature', (operation, propertyLaw) => {
        for (let seed = 0; seed < 30; seed++) {
            setSeed(seed);
            const problem = generator.generate({
                task: 'explain-feature',
                operation,
                useCommutativeLaw: propertyLaw === 'commutative',
                useAssociativeLaw: propertyLaw === 'associative',
                useDistributiveLaw: propertyLaw === 'distributive'
            })!.data;

            expect(problem.task).toBe('explain-feature');
            if (problem.task !== 'explain-feature') throw new Error('Unexpected task');
            expect(problem.propertyLaw).toBe(propertyLaw);
            expect(problem.response).toBe(problem.explanation);
            expect(problem.ruleText).not.toContain(problem.inferredFeature);
            expect(problem.explanation).toContain(problem.featureEvidence);
            expect(problem.explanation.toLowerCase()).toContain(propertyLaw);
            expect(problem.explanation).toMatch(/always|every/);
            expect(problem.highlightedCells.length).toBeGreaterThan(0);

            if (propertyLaw === 'commutative') {
                expect(problem.propertyResult).toBe(problem.terms[1]);
            } else if (propertyLaw === 'associative') {
                expect(problem.propertyResult).toBe(problem.terms[2]);
                for (let index = 2; index < problem.terms.length; index++) {
                    if (operation === Area.Addition) {
                        expect(problem.terms[index] - problem.terms[index - 2])
                            .toBe(2 * problem.ruleValue);
                    } else {
                        expect(problem.terms[index] / problem.terms[index - 2])
                            .toBe(problem.ruleValue ** 2);
                    }
                }
            } else {
                expect(problem.ruleOperation).toBe('multiply-position');
                problem.terms.forEach((term, index) => {
                    expect(term).toBe(index * problem.ruleValue);
                });
                for (let index = 1; index < problem.terms.length; index++) {
                    expect(problem.terms[index] - problem.terms[index - 1])
                        .toBe(problem.ruleValue);
                }
            }
        }
    });

    it('rejects task/property mismatches', () => {
        expect(generator.generate({
            task: 'generate',
            operation: Area.Addition,
            useCommutativeLaw: true,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            task: 'explain-feature',
            operation: Area.Addition,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        })).toBeNull();
        expect(generator.generate({
            task: 'unsupported',
            operation: Area.Addition,
            useCommutativeLaw: false,
            useAssociativeLaw: false,
            useDistributiveLaw: false
        } as never)).toBeNull();
    });

    it('is deterministic for all Grade 4 task variants', () => {
        const configs = [
            {
                task: 'generate',
                operation: Area.Addition,
                useCommutativeLaw: false,
                useAssociativeLaw: false,
                useDistributiveLaw: false
            },
            {
                task: 'identify-feature',
                operation: Area.Multiplication,
                useCommutativeLaw: false,
                useAssociativeLaw: false,
                useDistributiveLaw: false
            },
            {
                task: 'explain-feature',
                operation: Area.Multiplication,
                useCommutativeLaw: false,
                useAssociativeLaw: false,
                useDistributiveLaw: true
            }
        ] as const;

        for (const config of configs) {
            setSeed(`arithmetic-pattern-${config.task}`);
            const first = generator.generate(config);
            setSeed(`arithmetic-pattern-${config.task}`);
            const second = generator.generate(config);
            expect(second).toEqual(first);
        }
    });
});
