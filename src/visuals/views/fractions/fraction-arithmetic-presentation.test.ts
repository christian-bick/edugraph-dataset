import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {FractionArithmeticGeneratorConfig} from '../../../generators/fraction/fraction-arithmetic/spec.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticPresentation,
    presentFractionArithmeticProblem
} from './fraction-arithmetic-presentation.ts';
import {isValidFractionArithmeticProblem} from './fraction-arithmetic-helpers.ts';

const generator = new FractionArithmeticGenerator();

const generate = (config: FractionArithmeticGeneratorConfig) => {
    setSeed(`presentation-${config.task}-${config.operation}`);
    return generator.generate(config).data;
};

describe('fraction arithmetic view presentation', () => {
    it.each([
        ['interpretation', 'interpret-operation'],
        ['execution-model', 'fraction-operation'],
        ['execution-word', 'fraction-operation']
    ] as const)('resolves binary arithmetic for %s', (presentation, task) => {
        const neutral = generate({
            task: 'fraction-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        const presented = presentFractionArithmeticProblem(neutral, presentation);

        expect(neutral.task).toBe('fraction-operation');
        expect(presented?.task).toBe(task);
        expect(isValidFractionArithmeticProblem(presented!)).toBe(true);
    });

    it.each([
        ['understanding', 'whole-number-fraction-product'],
        ['execution-model', 'whole-number-fraction-product'],
        ['execution-word', 'fraction-multiplication-problem']
    ] as const)('resolves fraction products for %s', (presentation, task) => {
        const neutral = generate({
            task: 'whole-number-fraction-product-improper',
            usesCommonDenominator: false,
            operation: 'multiplication'
        });
        const presented = presentFractionArithmeticProblem(neutral, presentation);

        expect(neutral.task).toBe('whole-number-fraction-product');
        expect(presented?.task).toBe(task);
        expect(isValidFractionArithmeticProblem(presented!)).toBe(true);
    });

    it.each([
        [
            {
                task: 'decompose-proper',
                usesCommonDenominator: true,
                operation: 'addition'
            },
            'understanding'
        ],
        [
            {
                task: 'mixed-operation',
                usesCommonDenominator: true,
                operation: 'subtraction'
            },
            'execution-model'
        ],
        [
            {
                task: 'unit-fraction-multiple',
                usesCommonDenominator: false,
                operation: 'multiplication'
            },
            'interpretation'
        ],
        [
            {
                task: 'tenths-hundredths-addition',
                usesCommonDenominator: true,
                operation: 'addition'
            },
            'execution-word'
        ]
    ] as const)('accepts the fixed presentation for task $0.task', (config, presentation) => {
        const neutral = generate(config);
        expect(presentFractionArithmeticProblem(neutral, presentation)).toBe(neutral);
    });

    it('rejects presentations that do not apply to the generated mathematical route', () => {
        const mixed = generate({
            task: 'mixed-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });

        expect(presentFractionArithmeticProblem(
            mixed,
            'interpretation' satisfies FractionArithmeticPresentation
        )).toBeNull();
    });
});
