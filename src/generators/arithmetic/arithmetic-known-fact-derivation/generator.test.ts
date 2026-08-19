import {Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {ArithmeticKnownFactDerivationGenerator} from './generator.ts';
import {ArithmeticKnownFactDerivationGeneratorConfig} from './spec.ts';

const baseConfig: ArithmeticKnownFactDerivationGeneratorConfig = {
    operation: 'multiplication',
    arity: Scope.TwoOperands,
    useCommutativeLaw: false,
    useAssociativeLaw: false,
    usePlaceValueScaling: false,
    range: {min: 0, max: 100}
};

const generate = (
    overrides: Partial<ArithmeticKnownFactDerivationGeneratorConfig> = {},
    seed = 'known-fact'
): KnownFactDerivationProblem | null => {
    setSeed(seed);
    return new ArithmeticKnownFactDerivationGenerator().generate({
        ...baseConfig,
        ...overrides
    })?.data ?? null;
};

describe('ArithmeticKnownFactDerivationGenerator', () => {
    it('strictly validates every required configuration field', () => {
        const generator = new ArithmeticKnownFactDerivationGenerator();
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({operation: 'multiplication'} as never)).toThrow();
    });

    it('derives a swapped multiplication fact with the commutative property', () => {
        const problem = generate({useCommutativeLaw: true, range: {min: 0, max: 20}})!;
        const [first, second] = problem.derivedOperands;

        expect(problem.strategy).toBe('commutative');
        expect(problem.operation).toBe('multiplication');
        expect(problem.derivedOperands).toHaveLength(2);
        expect(first).toBe(problem.knownFact.secondFactor);
        expect(second).toBe(problem.knownFact.firstFactor);
        expect(problem.answer).toBe(problem.knownFact.product);
        expect(problem.answer).toBeLessThan(20);
        expect(problem.questionEquation).toContain('?');
        expect(problem.solutionEquation).toContain(String(problem.answer));
    });

    it('regroups three factors around the supplied known fact with the associative property', () => {
        const problem = generate({
            arity: Scope.ThreeOperands,
            useAssociativeLaw: true,
            range: {min: 0, max: 20}
        })!;
        const [first, second, third] = problem.derivedOperands as readonly [number, number, number];

        expect(problem.strategy).toBe('associative');
        expect(problem.derivedOperands).toHaveLength(3);
        expect(problem.knownFact.firstFactor).toBe(second);
        expect(problem.knownFact.secondFactor).toBe(third);
        expect(problem.answer).toBe(first * second * third);
        expect(problem.answer).toBeLessThan(20);
        expect(problem.relationEquation).toContain(') ×');
        expect(problem.relationEquation).toContain('× (');
    });

    it('uses a multiplication fact as the missing-factor evidence for division', () => {
        const problem = generate({
            operation: 'division'
        })!;
        const [dividend, divisor] = problem.derivedOperands;

        expect(problem.strategy).toBe('inverse-division');
        expect(problem.operation).toBe('division');
        expect(dividend).toBe(problem.knownFact.product);
        expect(divisor).toBe(problem.knownFact.firstFactor);
        expect(dividend / divisor).toBe(problem.answer);
        expect(problem.answer).toBe(problem.knownFact.secondFactor);
        expect(problem.relationEquation).toBe(`${divisor} × ? = ${dividend}`);
    });

    it('uses commutative and inverse derivations as visible manifestations of broad known-fact fluency', () => {
        expect(generate()?.strategy).toBe('commutative');
        expect(generate({operation: 'division'})?.strategy).toBe('inverse-division');
    });

    it('scales a one-digit known fact to a one-digit times multiple-of-ten product', () => {
        const problem = generate({
            usePlaceValueScaling: true,
            range: {min: 0, max: 1000}
        })!;
        const [oneDigitFactor, multipleOfTen] = problem.derivedOperands;

        expect(problem.strategy).toBe('place-value-scaling');
        expect(oneDigitFactor).toBeGreaterThanOrEqual(2);
        expect(oneDigitFactor).toBeLessThanOrEqual(9);
        expect(multipleOfTen).toBeGreaterThanOrEqual(20);
        expect(multipleOfTen).toBeLessThanOrEqual(90);
        expect(multipleOfTen % 10).toBe(0);
        expect(problem.answer).toBe(oneDigitFactor * multipleOfTen);
        expect(problem.answer).toBe(problem.knownFact.product * 10);
        expect(problem.answer).toBeLessThan(1000);
    });

    it('rejects incompatible strategy, operation, and arity combinations', () => {
        expect(generate({operation: 'division', useCommutativeLaw: true})).toBeNull();
        expect(generate({arity: Scope.ThreeOperands})).toBeNull();
        expect(generate({useCommutativeLaw: true, usePlaceValueScaling: true})).toBeNull();
        expect(generate({operation: 'division', usePlaceValueScaling: true})).toBeNull();
    });

    it('returns null when the requested range cannot contain a valid positive known fact', () => {
        expect(generate({range: {min: 0, max: 4}})).toBeNull();
        expect(generate({
            usePlaceValueScaling: true,
            range: {min: 0, max: 40}
        })).toBeNull();
    });

    it('rejects unsupported operation and arity values', () => {
        const generator = new ArithmeticKnownFactDerivationGenerator();
        expect(() => generator.generate({...baseConfig, operation: 'addition'} as never)).toThrow();
        expect(() => generator.generate({...baseConfig, arity: 'four-operands'} as never)).toThrow();
    });

    it('is deterministic for the project RNG seed', () => {
        const first = generate({usePlaceValueScaling: true}, 'repeatable');
        const second = generate({usePlaceValueScaling: true}, 'repeatable');
        expect(second).toEqual(first);
    });
});
