import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {FractionArithmeticGeneratorConfig} from '../../../generators/fraction/fraction-arithmetic/spec.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticPresentation,
    presentFractionArithmeticProblem
} from './fraction-arithmetic-presentation.ts';
import {isValidTenthsHundredthsAdditionProblem} from './tenths-hundredths-grid.tsx';

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
    ] as const)('projects binary arithmetic for %s without mutating the payload', (presentation, task) => {
        const neutral = generate({
            task: 'fraction-operation',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        const before = structuredClone(neutral);
        const presented = presentFractionArithmeticProblem(neutral, presentation);

        expect(neutral).toEqual(before);
        expect(presented?.task).toBe(task);
        expect(presented?.story.unknownRole).toBe(
            presentation === 'interpretation' ? 'operation' : 'result'
        );
        if (presented?.task !== task || !('questionModels' in presented)) return;
        expect(presented.first.notation).toBe(
            `${presented.first.numerator}/${presented.first.denominator}`
        );
        expect(presented.questionModels).toHaveLength(2);
        expect(presented.solutionModel.totalNumerator).toBe(presented.result.numerator);
    });

    it.each([
        ['understanding', 'whole-number-fraction-product'],
        ['execution-model', 'whole-number-fraction-product'],
        ['execution-word', 'fraction-multiplication-problem']
    ] as const)('projects whole-number fraction products for %s', (presentation, task) => {
        const neutral = generate({
            task: 'whole-number-fraction-product-improper',
            usesCommonDenominator: false,
            operation: 'multiplication'
        });
        const presented = presentFractionArithmeticProblem(neutral, presentation);

        expect(presented?.task).toBe(task);
        if (!presented || !('questionGroupModels' in presented)) return;
        expect(presented.questionGroupModels).toHaveLength(presented.wholeFactor);
        expect(presented.totalUnitParts).toBe(presented.product.numerator);
        expect(presented.solutionModel.groups).toHaveLength(presented.wholeFactor);
        expect(presented.story.question).toBe(presentation === 'execution-word'
            ? 'How many meters of ribbon do the craft kits use altogether?'
            : 'Use unit-fraction groups to determine the total ribbon used.');
    });

    it('derives visual models and equations from retained decomposition witnesses', () => {
        const neutral = generate({
            task: 'decompose-mixed',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        const presented = presentFractionArithmeticProblem(neutral, 'understanding');

        expect(neutral.task).toBe('decompose');
        expect(presented?.task).toBe('decompose');
        if (neutral.task !== 'decompose' || presented?.task !== 'decompose') return;
        expect(presented.sourceKind).toBe('mixed');
        expect(presented.decompositions.map(decomposition =>
            decomposition.terms.map(term => term.numerator)
        )).toEqual(neutral.decompositions.map(decomposition =>
            decomposition.terms.map(term => term.numerator)
        ));
        expect(presented.decompositions.every(decomposition =>
            decomposition.model.totalNumerator === presented.sourceFraction.numerator
        )).toBe(true);
        expect(presented.solutionEquations.every(equation =>
            equation.startsWith(`${presented.sourceDisplay} = `)
        )).toBe(true);
    });

    it('derives all mixed-number strategies from the canonical operands', () => {
        const strategies = new Set<string>();
        for (const operation of ['addition', 'subtraction'] as const) {
            for (let index = 0; index < 80; index += 1) {
                setSeed(`presentation-mixed-${operation}-${index}`);
                const neutral = generator.generate({
                    task: 'mixed-operation',
                    usesCommonDenominator: true,
                    operation
                }).data;
                const presented = presentFractionArithmeticProblem(neutral, 'execution-model');
                if (presented?.task !== 'mixed-operation') continue;
                strategies.add(presented.strategy);
                expect(presented.transformationSteps).toContain(
                    presented.improperOperationEquation
                );
                expect(presented.solutionModel.totalNumerator)
                    .toBe(presented.result.improperNumerator);
            }
        }
        expect(strategies).toEqual(new Set([
            'addition-with-carry',
            'addition-without-carry',
            'subtraction-with-borrow',
            'subtraction-without-borrow'
        ]));
    });

    it('derives a complete and internally valid tenths/hundredths presentation', () => {
        const neutral = generate({
            task: 'tenths-hundredths-addition',
            usesCommonDenominator: true,
            operation: 'addition'
        });
        const presented = presentFractionArithmeticProblem(neutral, 'execution-word');

        expect(presented?.task).toBe('tenths-hundredths-addition');
        if (presented?.task !== 'tenths-hundredths-addition') return;
        expect(isValidTenthsHundredthsAdditionProblem(presented)).toBe(true);
        expect(presented.solutionModels.result.shadedCount).toBe(presented.result.numerator);
    });

    it.each([
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
            'execution-model'
        ]
    ] as const)('accepts the fixed presentation for task $0.task', (config, presentation) => {
        expect(presentFractionArithmeticProblem(generate(config), presentation)).not.toBeNull();
    });

    it('rejects presentations that do not apply to the mathematical route', () => {
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
