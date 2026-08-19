import {Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    ArithmeticOperation,
    ArithmeticWordProblemTwoStep
} from '../../../types/problems.ts';
import {ArithmeticWordProblemsTwoStepGenerator} from './generator.ts';

const operationSequences = [
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction],
    [Area.Multiplication, Area.Multiplication],
    [Area.Division, Area.Division],
    [Area.Addition, Area.Subtraction],
    [Area.Multiplication, Area.Addition],
    [Area.Division, Area.Addition],
    [Area.Multiplication, Area.Subtraction],
    [Area.Division, Area.Subtraction],
    [Area.Multiplication, Area.Division]
] as const;

function apply(left: number, right: number, operation: ArithmeticOperation): number {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
}

function expectValidSteps(problem: ArithmeticWordProblemTwoStep): void {
    const intermediate = apply(problem.num1, problem.num2, problem.operations[0]);
    const answer = apply(intermediate, problem.num3, problem.operations[1]);

    expect(intermediate).toBe(problem.intermediate);
    expect(answer).toBe(problem.answer);
}

describe('ArithmeticWordProblemsTwoStepGenerator', () => {
    const generator = new ArithmeticWordProblemsTwoStepGenerator();

    it('strictly validates its configuration', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({
            task: 'two-step',
            operations: [Area.Addition, Area.Addition]
        } as never)).toThrow();
    });

    it('preserves connected, positive legacy two-step payloads', () => {
        for (const operations of operationSequences) {
            for (let seed = 0; seed < 40; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    task: 'two-step',
                    operations,
                    range: {min: 0, max: 100}
                });
                expect(stub).not.toBeNull();
                expect(stub!.data.kind).toBe('two-step');
                if (stub!.data.kind !== 'two-step') throw new Error('Expected legacy payload.');
                expectValidSteps(stub!.data);
                expect([
                    stub!.data.num1,
                    stub!.data.num2,
                    stub!.data.num3,
                    stub!.data.intermediate,
                    stub!.data.answer
                ].every(value => Number.isInteger(value) && value > 0 && value <= 100)).toBe(true);
            }
        }
    });

    it('keeps legacy values within the existing view capacity', () => {
        for (const operations of operationSequences) {
            setSeed(9);
            const stub = generator.generate({
                task: 'two-step',
                operations,
                range: {min: 0, max: 1_000_000}
            });
            expect(stub).not.toBeNull();
            if (stub!.data.kind !== 'two-step') throw new Error('Expected legacy payload.');
            expect(Math.max(
                stub!.data.num1,
                stub!.data.num2,
                stub!.data.num3,
                stub!.data.intermediate,
                stub!.data.answer
            )).toBeLessThanOrEqual(100);
        }
    });

    it('creates a canonical nonzero-remainder relation without choosing a context', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const stub = generator.generate({
                task: 'interpreted-remainder',
                operations: [Area.Division, Area.Division],
                range: {min: 0, max: 1_000}
            });
            expect(stub).not.toBeNull();
            expect(stub!.data.kind).toBe('interpreted-remainder');
            if (stub!.data.kind !== 'interpreted-remainder') throw new Error('Expected remainder payload.');

            const data = stub!.data;
            expect(data.dividend).toBe(data.divisor * data.quotient + data.remainder);
            expect(data.remainder).toBeGreaterThan(0);
            expect(data.remainder).toBeLessThan(data.divisor);
            expect(Object.keys(data).sort()).toEqual([
                'dividend',
                'divisor',
                'kind',
                'quotient',
                'remainder'
            ]);
        }
    });

    it('creates consistent letter equations for all ten authored operation groups', () => {
        for (const operations of operationSequences) {
            for (let seed = 0; seed < 20; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    task: 'letter-equation',
                    operations,
                    range: {min: 0, max: 1_000_000}
                });
                expect(stub).not.toBeNull();
                expect(stub!.data.kind).toBe('letter-equation');
                if (stub!.data.kind !== 'letter-equation') throw new Error('Expected equation payload.');

                const data = stub!.data;
                expect(data.intermediate).toBe(apply(data.operands[0], data.operands[1], data.operations[0]));
                expect(data.answer).toBe(apply(data.intermediate, data.operands[2], data.operations[1]));
                expect(data.answer).toBeLessThan(1_000_000);
            }
        }
    });

    it('supports a direct addition-then-division sequence through the abstract operation contract', () => {
        setSeed(12);
        const stub = generator.generate({
            task: 'letter-equation',
            operations: [Area.Addition, Area.Division],
            range: {min: 0, max: 1_000_000}
        });
        expect(stub).not.toBeNull();
        expect(stub!.data.kind).toBe('letter-equation');
        if (stub!.data.kind !== 'letter-equation') throw new Error('Expected equation payload.');
        expect(stub!.data.operations).toEqual(['addition', 'division']);
        expect(stub!.data.answer).toBe(
            (stub!.data.operands[0] + stub!.data.operands[1]) / stub!.data.operands[2]
        );
    });

    it('provides visible rounding checks for reasonable and unreasonable proposals', () => {
        const conclusions = new Set<boolean>();

        for (const operations of [
            [Area.Addition, Area.Addition],
            [Area.Subtraction, Area.Subtraction],
            [Area.Multiplication, Area.Multiplication],
            [Area.Division, Area.Division]
        ] as const) {
            for (let seed = 0; seed < 30; seed++) {
                setSeed(seed);
                const stub = generator.generate({
                    task: 'reasonableness',
                    operations,
                    range: {min: 0, max: 1_000_000}
                });
                expect(stub).not.toBeNull();
                expect(stub!.data.kind).toBe('reasonableness');
                if (stub!.data.kind !== 'reasonableness') throw new Error('Expected estimate payload.');

                const data = stub!.data;
                conclusions.add(data.isReasonable);
                expect(data.intermediate).toBe(apply(data.operands[0], data.operands[1], data.operations[0]));
                expect(data.exactAnswer).toBe(apply(data.intermediate, data.operands[2], data.operations[1]));
                expect(data.roundedExactAnswer).toBe(Math.round(data.exactAnswer / 10) * 10);
                expect(data.roundedProposedAnswer).toBe(Math.round(data.proposedAnswer / 10) * 10);
                expect(data.isReasonable).toBe(data.roundedExactAnswer === data.roundedProposedAnswer);
            }
        }

        expect(conclusions).toEqual(new Set([true, false]));
    });

    it('is deterministic for every Grade 4 task', () => {
        for (const task of ['interpreted-remainder', 'letter-equation', 'reasonableness'] as const) {
            const operations = task === 'interpreted-remainder'
                ? [Area.Division, Area.Division] as const
                : [Area.Multiplication, Area.Addition] as const;
            setSeed(`grade4-${task}`);
            const first = generator.generate({task, operations, range: {min: 0, max: 1_000_000}});
            setSeed(`grade4-${task}`);
            const second = generator.generate({task, operations, range: {min: 0, max: 1_000_000}});
            expect(second).toEqual(first);
        }
    });

    it('returns null for unsupported operations, incompatible tasks, and infeasible ranges', () => {
        expect(generator.generate({
            task: 'two-step',
            operations: 'unsupported',
            range: {min: 0, max: 100}
        })).toBeNull();
        expect(generator.generate({
            task: 'interpreted-remainder',
            operations: [Area.Addition, Area.Addition],
            range: {min: 0, max: 100}
        })).toBeNull();
        expect(generator.generate({
            task: 'interpreted-remainder',
            operations: [Area.Division, Area.Division],
            range: {min: 5, max: 5}
        })).toBeNull();
        expect(generator.generate({
            task: 'letter-equation',
            operations: [Area.Addition, Area.Addition],
            range: {min: 50, max: 51}
        })).toBeNull();
        for (const operations of operationSequences) {
            expect(generator.generate({
                task: 'two-step',
                operations,
                range: {min: 5, max: 5}
            })).toBeNull();
        }
    });
});
