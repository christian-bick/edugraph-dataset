import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {
    FractionArithmeticGeneratorConfig,
    FractionArithmeticTaskConfig
} from '../../../generators/fraction/fraction-arithmetic/spec.ts';
import {setSeed} from '../../../lib/random.ts';
import {FractionArithmeticProblem} from '../../../types/problems.ts';
import {isValidFractionArithmeticProblem} from './fraction-arithmetic-helpers.ts';
import {
    FractionArithmeticPresentation,
    presentFractionArithmeticProblem
} from './fraction-arithmetic-presentation.ts';

const generator = new FractionArithmeticGenerator();

const generate = (
    seed: string,
    task: FractionArithmeticTaskConfig,
    operation: NonNullable<FractionArithmeticGeneratorConfig['operation']>
): FractionArithmeticProblem => {
    setSeed(seed);
    return generator.generate({
        task,
        usesCommonDenominator: true,
        operation
    }).data;
};

const present = (
    data: FractionArithmeticProblem,
    presentation: FractionArithmeticPresentation
): FractionArithmeticProblem => presentFractionArithmeticProblem(data, presentation)!;

const fixtures = [
    present(generate('interpret-add', 'fraction-operation', 'addition'), 'interpretation'),
    present(generate('interpret-subtract', 'fraction-operation', 'subtraction'), 'interpretation'),
    present(generate('word-add', 'fraction-operation', 'addition'), 'execution-word'),
    present(generate('word-subtract', 'fraction-operation', 'subtraction'), 'execution-word'),
    generate('proper-decompose', 'decompose-proper', 'addition'),
    generate('mixed-decompose', 'decompose-mixed', 'addition'),
    ...Array.from({length: 24}, (_, index) => generate(
        `mixed-add-${index}`,
        'mixed-operation',
        'addition'
    )),
    ...Array.from({length: 24}, (_, index) => generate(
        `mixed-subtract-${index}`,
        'mixed-operation',
        'subtraction'
    )),
    generate('unit-multiple', 'unit-fraction-multiple', 'multiplication'),
    generate('proper-product', 'whole-number-fraction-product-proper', 'multiplication'),
    generate('improper-product', 'whole-number-fraction-product-improper', 'multiplication'),
    present(
        generate('proper-word-product', 'whole-number-fraction-product-proper', 'multiplication'),
        'execution-word'
    ),
    present(
        generate('improper-word-product', 'whole-number-fraction-product-improper', 'multiplication'),
        'execution-word'
    )
];

const changed = (
    source: FractionArithmeticProblem,
    update: (data: FractionArithmeticProblem) => void
): FractionArithmeticProblem => {
    const data = structuredClone(source);
    update(data);
    return data;
};

describe('isValidFractionArithmeticProblem', () => {
    it('accepts every supplied arithmetic branch and mixed regrouping strategy', () => {
        expect(fixtures.map(data => ({
            task: data.task,
            strategy: data.task === 'mixed-operation' ? data.strategy : null,
            valid: isValidFractionArithmeticProblem(data)
        }))).toEqual(fixtures.map(data => ({
            task: data.task,
            strategy: data.task === 'mixed-operation' ? data.strategy : null,
            valid: true
        })));
        expect(new Set(fixtures
            .filter(data => data.task === 'mixed-operation')
            .map(data => data.strategy))).toEqual(new Set([
            'addition-with-carry',
            'addition-without-carry',
            'subtraction-with-borrow',
            'subtraction-without-borrow'
        ]));
    });

    it('rejects contradictory binary answers, grouping, cells, stories, and question equations', () => {
        const source = fixtures.find(data => data.task === 'interpret-operation')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'interpret-operation') data.result.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'interpret-operation') data.solutionModel.groups[0]!.partCount += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'interpret-operation') data.questionModels[0].frames[0]!.cells[0]!.groupId = null;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'interpret-operation') data.solutionModel.frames = [];
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            data.story.question = 'The answer is already shown.';
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            data.questionEquation = data.answer;
        }))).toBe(false);
    });

    it('rejects unsupported runtime operations and frame counts beyond four wholes', () => {
        const subtraction = fixtures.find(data =>
            data.task === 'interpret-operation' && data.operation === 'subtraction')!;
        expect(isValidFractionArithmeticProblem(changed(subtraction, data => {
            if (data.task === 'interpret-operation') {
                data.operation = 'division' as never;
                data.answerStatement = `The separating operation is division: ${data.solutionEquation}.`;
            }
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(subtraction, data => {
            if (data.task === 'interpret-operation') {
                data.solutionModel.frameCount = 5 as never;
                data.solutionModel.frames.push(structuredClone(data.solutionModel.frames.at(-1)!));
            }
        }))).toBe(false);
    });

    it('rejects duplicate or mathematically inconsistent decompositions', () => {
        const source = fixtures.find(data => data.task === 'decompose')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.decompositions[1] = structuredClone(data.decompositions[0]);
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.decompositions[0].terms[0]!.numerator += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'decompose') data.solutionEquations = [] as never;
        }))).toBe(false);
        const mixedSource = fixtures.find(data => data.task === 'decompose' && data.sourceKind === 'mixed')!;
        expect(isValidFractionArithmeticProblem(changed(mixedSource, data => {
            if (data.task !== 'decompose') return;
            data.sourceKind = 'unknown' as never;
            data.solutionEquations = data.decompositions.map(decomposition => {
                const sum = decomposition.terms.map(term => term.notation).join(' + ');
                decomposition.equation = `${data.sourceDisplay} = ${sum}`;
                return decomposition.equation;
            }) as [string, string];
            data.answer = data.solutionEquations.join('; ');
            data.answerStatement = `Two decompositions are ${data.solutionEquations[0]} and ${data.solutionEquations[1]}.`;
        }))).toBe(false);
    });

    it('rejects contradictory mixed-number conversions, regrouping, strategy, and result models', () => {
        const source = fixtures.find(data => data.task === 'mixed-operation' && data.requiresRegrouping)!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.operandConversionEquations[0] = '1 = 1';
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.regroupingEquation = null;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.requiresRegrouping = false;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') data.solutionModel.display = data.first.notation;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'mixed-operation') {
                data.first.whole = 0;
                data.first.notation = `${data.first.numerator}/${data.denominator}`;
                data.first.improperNumerator = data.first.numerator;
                data.first.improperNotation = data.first.notation;
            }
        }))).toBe(false);
    });

    it('rejects contradictory unit-fraction multiplier evidence and out-of-capacity groups', () => {
        const source = fixtures.find(data => data.task === 'unit-fraction-multiple')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'unit-fraction-multiple') data.questionModel.display = data.unitFraction.notation;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'unit-fraction-multiple') data.questionEquation = data.solutionEquation;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'unit-fraction-multiple') data.solutionModel.groups[0]!.partCount += 1;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'unit-fraction-multiple') {
                data.wholeFactor = 5;
                data.wholeFactorDisplay = '5';
            }
        }))).toBe(false);
    });

    it('rejects contradictory repeated groups, unit rewrites, products, and bounds', () => {
        const source = fixtures.find(data => data.task === 'whole-number-fraction-product')!;
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'whole-number-fraction-product') data.questionGroupModels.pop();
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'whole-number-fraction-product') data.questionGroupModels[0]!.groups[0]!.id = 'wrong-group';
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'whole-number-fraction-product') data.fractionAsUnitMultipleEquation = '2/3 = 2/3';
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(source, data => {
            if (data.task === 'whole-number-fraction-product') data.product.numerator += 1;
        }))).toBe(false);

        const word = fixtures.find(data => data.task === 'fraction-multiplication-problem')!;
        expect(isValidFractionArithmeticProblem(changed(word, data => {
            if (data.task === 'fraction-multiplication-problem') data.boundsStatement = `0 < ${data.product.notation} < 99`;
        }))).toBe(false);
        expect(isValidFractionArithmeticProblem(changed(word, data => {
            if (data.task === 'fraction-multiplication-problem') {
                data.product.numerator = data.denominator;
                data.product.notation = `${data.denominator}/${data.denominator}`;
            }
        }))).toBe(false);
    });
});
