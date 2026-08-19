import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {FractionArithmeticGeneratorConfig} from '../../../generators/fraction/fraction-arithmetic/spec.ts';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {
    FractionArithmeticViewSchema,
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
        [[Ability.Interpretation], 'interpret-operation'],
        [[Ability.ProcedureExecution], 'fraction-operation']
    ] as const)('resolves binary arithmetic for %j', (abilities, task) => {
        const neutral = generate({
            task: 'fraction-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        const presented = presentFractionArithmeticProblem(neutral, abilities);

        expect(neutral.task).toBe('fraction-operation');
        expect(presented?.task).toBe(task);
        expect(isValidFractionArithmeticProblem(presented!)).toBe(true);
    });

    it.each([
        [[Ability.ProcedureUnderstanding], 'whole-number-fraction-product'],
        [[Ability.ProcedureExecution], 'fraction-multiplication-problem']
    ] as const)('resolves fraction products for %j', (abilities, task) => {
        const neutral = generate({
            task: 'whole-number-fraction-product-improper',
            usesCommonDenominator: false,
            operation: 'multiplication'
        });
        const presented = presentFractionArithmeticProblem(neutral, abilities);

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
            [Ability.ProcedureUnderstanding, Ability.Formalization]
        ],
        [
            {
                task: 'mixed-operation',
                usesCommonDenominator: true,
                operation: 'subtraction'
            },
            [Ability.ProcedureExecution]
        ],
        [
            {
                task: 'unit-fraction-multiple',
                usesCommonDenominator: false,
                operation: 'multiplication'
            },
            [Ability.Interpretation]
        ],
        [
            {
                task: 'tenths-hundredths-addition',
                usesCommonDenominator: true,
                operation: 'addition'
            },
            [Ability.ProcedureExecution]
        ]
    ] as const)('accepts the ability contract for task $0.task', (config, abilities) => {
        const neutral = generate(config);
        expect(presentFractionArithmeticProblem(neutral, abilities)).toBe(neutral);
    });

    it('rejects abilities that do not apply to the generated mathematical route', () => {
        const mixed = generate({
            task: 'mixed-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });

        expect(presentFractionArithmeticProblem(mixed, [Ability.Interpretation])).toBeNull();
    });

    it('resolves and consumes abilities only in the view schema', () => {
        const labels = [Ability.ProcedureUnderstanding, Ability.Formalization];
        const resolved = extractConfig(FractionArithmeticViewSchema, labels);

        expect(resolved.config.abilities).toEqual(labels);
        expect(resolved.consumedLabels).toEqual(expect.arrayContaining(labels));
    });
});
