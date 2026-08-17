import {createHash} from 'node:crypto';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticModel,
    FractionArithmeticOperation,
    FractionArithmeticProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionValue,
    TenthsHundredthsGridModel
} from '../../../types/problems.ts';
import {FractionArithmeticGenerator} from './generator.ts';
import {FractionArithmeticGeneratorConfig} from './spec.ts';

const generator = new FractionArithmeticGenerator();
const denominators = [2, 3, 4, 6, 8] as const satisfies readonly FractionParts[];

const configs = {
    interpret: (operation: FractionArithmeticOperation): FractionArithmeticGeneratorConfig => ({
        task: 'interpret-operation',
        usesCommonDenominator: true,
        operation
    }),
    fractionOperation: (
        operation: FractionArithmeticOperation
    ): FractionArithmeticGeneratorConfig => ({
        task: 'fraction-operation',
        usesCommonDenominator: true,
        operation
    }),
    decomposeProper: (): FractionArithmeticGeneratorConfig => ({
        task: 'decompose-proper',
        usesCommonDenominator: true,
        operation: 'addition'
    }),
    decomposeMixed: (): FractionArithmeticGeneratorConfig => ({
        task: 'decompose-mixed',
        usesCommonDenominator: true,
        operation: 'addition'
    }),
    mixed: (operation: FractionArithmeticOperation): FractionArithmeticGeneratorConfig => ({
        task: 'mixed-operation',
        usesCommonDenominator: true,
        operation
    }),
    unitMultiple: (): FractionArithmeticGeneratorConfig => ({
        task: 'unit-fraction-multiple',
        usesCommonDenominator: false,
        operation: 'multiplication'
    }),
    fractionProduct: (
        task: 'whole-number-fraction-product' | 'fraction-multiplication-problem',
        productKind: 'proper' | 'improper'
    ): FractionArithmeticGeneratorConfig => ({
        task: `${task}-${productKind}`,
        usesCommonDenominator: false,
        operation: 'multiplication'
    }),
    tenthsHundredths: (): FractionArithmeticGeneratorConfig => ({
        task: 'tenths-hundredths-addition',
        usesCommonDenominator: true,
        operation: 'addition'
    })
};

const expectFraction = (
    value: LikeDenominatorFractionValue,
    denominator: FractionParts
): void => {
    expect(value.denominator).toBe(denominator);
    expect(value.numerator).toBeGreaterThan(0);
    expect(value.notation).toBe(`${value.numerator}/${denominator}`);
};

const expectMixed = (value: MixedFractionValue, denominator: FractionParts): void => {
    expect(value.denominator).toBe(denominator);
    expect(value.numerator).toBeGreaterThan(0);
    expect(value.numerator).toBeLessThan(denominator);
    expect(value.improperNumerator).toBe(value.whole * denominator + value.numerator);
    expect(value.improperNotation).toBe(`${value.improperNumerator}/${denominator}`);
    expect(value.notation).toBe(value.whole > 0
        ? `${value.whole} ${value.numerator}/${denominator}`
        : `${value.numerator}/${denominator}`);
};

const expectModel = (model: FractionArithmeticModel): void => {
    expect(denominators).toContain(model.denominator);
    expect(model.totalNumerator).toBeGreaterThan(0);
    expect(model.frameCount).toBe(Math.max(1, Math.ceil(
        model.totalNumerator / model.denominator
    )));
    expect(model.frameCount).toBeLessThanOrEqual(4);
    expect(model.frames).toHaveLength(model.frameCount);
    expect(model.groups.reduce((sum, group) => sum + group.partCount, 0))
        .toBe(model.totalNumerator);

    let expectedStart = 0;
    for (const group of model.groups) {
        expect(group.partCount).toBeGreaterThan(0);
        expect(group.startPart).toBe(expectedStart);
        expect(group.label.length).toBeGreaterThan(0);
        expectedStart += group.partCount;
    }

    const cells = model.frames.flatMap((frame, frameIndex) => {
        expect(frame.frameIndex).toBe(frameIndex);
        expect(frame.cells).toHaveLength(model.denominator);
        return frame.cells;
    });
    expect(cells).toHaveLength(model.frameCount * model.denominator);
    cells.forEach((cell, partIndex) => {
        expect(cell.partIndex).toBe(partIndex);
        const group = model.groups.find(candidate =>
            partIndex >= candidate.startPart
            && partIndex < candidate.startPart + candidate.partCount
        );
        expect(cell.groupId).toBe(group?.id ?? null);
        if (partIndex < model.totalNumerator) expect(cell.groupId).not.toBeNull();
        else expect(cell.groupId).toBeNull();
    });
};

const expectStrictStory = (problem: FractionArithmeticProblem): void => {
    expect(problem.story.givenDisplays.every(display => problem.story.context.includes(display)))
        .toBe(true);
    expect(problem.story.question.endsWith('?')).toBe(true);
    if (problem.task === 'interpret-operation' || problem.task === 'fraction-operation') {
        const {first, second, story} = problem;
        expect(story.givenDisplays).toEqual([first.notation, second.notation]);
        expect(story.wholeLabel).toBe('one poster');
        expect(story.unitLabel).toBe('of the poster');
        if (problem.operation === 'addition') {
            expect(story.storyKind).toBe('poster-join');
            expect(story.context).toBe(
                `A poster is divided into ${problem.denominator} equal parts. ${first.notation} of the same poster is colored blue and ${second.notation} is colored gold.`
            );
            expect(story.question).toBe(problem.task === 'interpret-operation'
                ? 'Which joining operation and equation describe the colored parts?'
                : 'What fraction of the poster is colored altogether?');
        } else {
            expect(story.storyKind).toBe('poster-separate');
            expect(story.context).toBe(
                `A poster is divided into ${problem.denominator} equal parts. ${first.notation} of the same poster is colored, and then ${second.notation} is erased.`
            );
            expect(story.question).toBe(problem.task === 'interpret-operation'
                ? 'Which separating operation and equation describe the change?'
                : 'What fraction of the poster remains colored?');
        }
        expect(story.unknownRole).toBe(problem.task === 'interpret-operation'
            ? 'operation'
            : 'result');
    } else if (problem.task === 'decompose') {
        expect(problem.story).toEqual({
            storyKind: 'mosaic-decomposition',
            context: `A mosaic design uses panels divided into ${problem.denominator} equal columns. The tiled amount is ${problem.sourceDisplay} panels.`,
            question: 'What are two different same-denominator decompositions of this amount?',
            wholeLabel: 'one panel',
            unitLabel: 'panels',
            givenDisplays: [problem.sourceDisplay],
            unknownRole: 'decompositions'
        });
    } else if (problem.task === 'mixed-operation') {
        const expectedKind = problem.operation === 'addition'
            ? 'route-combination'
            : 'route-difference';
        expect(problem.story.storyKind).toBe(expectedKind);
        expect(problem.story.givenDisplays).toEqual([
            problem.first.notation,
            problem.second.notation
        ]);
        expect(problem.story.wholeLabel).toBe('one mile');
        expect(problem.story.unitLabel).toBe('miles');
        expect(problem.story.unknownRole).toBe('result');
        expect(problem.story.context).toBe(problem.operation === 'addition'
            ? `One trail section is ${problem.first.notation} miles long and a second section is ${problem.second.notation} miles long. Both distances use the same mile unit.`
            : `A route is ${problem.first.notation} miles long, and ${problem.second.notation} miles have been completed. Both distances use the same mile unit.`);
        expect(problem.story.question).toBe(problem.operation === 'addition'
            ? 'How many miles long are the two sections altogether?'
            : 'How many miles remain?');
    } else if (problem.task === 'tenths-hundredths-addition') {
        expect(problem.story).toEqual({
            storyKind: 'hundred-grid-addition',
            context: `A mosaic uses ${problem.firstTenths.notation} of a unit square in blue and a non-overlapping ${problem.secondHundredths.notation} of the same-sized unit square in gold.`,
            question: 'How much of one unit square is used altogether when the amount is expressed in hundredths?',
            wholeLabel: 'one unit square',
            unitLabel: 'of a unit square',
            givenDisplays: [problem.firstTenths.notation, problem.secondHundredths.notation],
            unknownRole: 'result'
        });
    } else {
        throw new Error(`Unexpected multiplication task ${problem.task}.`);
    }
};

const expectCommon = (problem: FractionArithmeticProblem): void => {
    if (problem.task === 'tenths-hundredths-addition') expect(problem.denominator).toBe(100);
    else expect(denominators).toContain(problem.denominator);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.referenceId).toBe('same-whole');
    expect(problem.prompt.length).toBeGreaterThan(10);
    expect(problem.questionEquation).toContain('?');
    expect(problem.answer.length).toBeGreaterThan(0);
    expect(problem.answerStatement.length).toBeGreaterThan(10);
    expect(problem.explanation.length).toBeGreaterThan(30);
    expectStrictStory(problem);
};

const expectDecimalGrid = (model: TenthsHundredthsGridModel): void => {
    expect(model.cells).toHaveLength(model.partCount);
    expect(model.cells.filter(cell => cell.shaded)).toHaveLength(model.shadedCount);
    model.cells.forEach((cell, index) => {
        expect(cell.index).toBe(index);
        expect(cell.shaded).toBe(index < model.shadedCount);
        if (model.partCount === 100) {
            expect(cell.column).toBe(Math.floor(index / 10));
            expect(cell.row).toBe(index % 10);
            expect(cell.tenthGroupIndex).toBe(cell.column);
        }
    });
    for (const group of model.groups) {
        expect(group.cellCount).toBeGreaterThan(0);
        expect(group.startCell).toBeGreaterThanOrEqual(0);
        expect(group.startCell + group.cellCount).toBeLessThanOrEqual(model.shadedCount);
        expect(group.label.length).toBeGreaterThan(0);
        for (let index = group.startCell; index < group.startCell + group.cellCount; index++) {
            expect(model.cells[index].source).toBe(group.source);
        }
    }
};

describe('FractionArithmeticGenerator', () => {
    it('strictly validates all required fields and task combinations', () => {
        expect(() => generator.generate({} as never))
            .toThrow('Required field "task" is missing.');
        expect(() => generator.generate({
            task: 'interpret-operation',
            usesCommonDenominator: true,
            operation: undefined
        })).toThrow('Required field "operation" is missing.');
        expect(() => generator.generate({
            task: undefined,
            usesCommonDenominator: true,
            operation: 'addition'
        })).toThrow('Required field "task" is missing.');
        expect(() => generator.generate({
            ...configs.interpret('addition'),
            operation: 'unsupported'
        } as never)).toThrow('Operation must be addition, subtraction, or multiplication.');
        expect(() => generator.generate({
            task: 'unsupported',
            usesCommonDenominator: true,
            operation: 'addition'
        } as never)).toThrow('Unsupported task ability');
        expect(() => generator.generate({
            ...configs.interpret('addition'),
            usesCommonDenominator: false
        })).toThrow('CommonDenominator is required');
        expect(() => generator.generate({
            ...configs.decomposeProper(),
            operation: 'subtraction'
        })).toThrow('Unsupported task ability');
        expect(() => generator.generate({
            ...configs.decomposeProper(),
            task: 'unsupported'
        } as never)).toThrow('Unsupported task ability');
        expect(() => generator.generate({
            ...configs.unitMultiple(),
            task: 'interpret-operation'
        })).toThrow('Unsupported multiplication task');
        expect(() => generator.generate({
            ...configs.unitMultiple(),
            operation: 'addition',
            usesCommonDenominator: true
        })).toThrow('Unsupported task ability');
    });

    it.each([
        ['interpret-operation', 'addition'],
        ['interpret-operation', 'subtraction'],
        ['fraction-operation', 'addition'],
        ['fraction-operation', 'subtraction']
    ] as const)('generates coherent %s / %s binary tasks', (task, operationLabel) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`${task}-${operationLabel}-${seed}`);
            const problem = generator.generate(task === 'interpret-operation'
                ? configs.interpret(operationLabel)
                : configs.fractionOperation(operationLabel)).data;
            expect(problem.task).toBe(task);
            if (problem.task !== 'interpret-operation' && problem.task !== 'fraction-operation') {
                throw new Error('Expected a binary fraction operation.');
            }
            expectCommon(problem);
            expectFraction(problem.first, problem.denominator);
            expectFraction(problem.second, problem.denominator);
            expectFraction(problem.result, problem.denominator);
            expect(problem.operation).toBe(operationLabel);
            expect(problem.symbol).toBe(problem.operation === 'addition' ? '+' : '−');
            expect(problem.action).toBe(problem.operation === 'addition' ? 'join' : 'separate');
            const expectedNumerator = problem.operation === 'addition'
                ? problem.first.numerator + problem.second.numerator
                : problem.first.numerator - problem.second.numerator;
            expect(problem.result.numerator).toBe(expectedNumerator);
            expect(problem.result.numerator).toBeGreaterThan(0);
            expect(problem.result.numerator).toBeLessThanOrEqual(problem.denominator);
            expect(problem.solutionEquation).toBe(
                `${problem.first.notation} ${problem.symbol} ${problem.second.notation} = ${problem.result.notation}`
            );
            expect(problem.questionEquation).toBe(task === 'interpret-operation'
                ? `${problem.first.notation} ? ${problem.second.notation} = ?`
                : `${problem.first.notation} ${problem.symbol} ${problem.second.notation} = ?/${problem.denominator}`);
            expect(problem.answer).toBe(task === 'interpret-operation'
                ? problem.solutionEquation
                : problem.result.notation);
            problem.questionModels.forEach(expectModel);
            expectModel(problem.solutionModel);
            if (problem.operation === 'addition') {
                expect(problem.solutionModel.totalNumerator).toBe(problem.result.numerator);
                expect(problem.solutionModel.groups.map(group => group.role))
                    .toEqual(['first-addend', 'second-addend']);
            } else {
                expect(problem.solutionModel.totalNumerator).toBe(problem.first.numerator);
                expect(problem.solutionModel.groups.map(group => group.role))
                    .toEqual(['remaining', 'removed']);
                expect(problem.solutionModel.groups[0].partCount).toBe(problem.result.numerator);
                expect(problem.solutionModel.groups[1].partCount).toBe(problem.second.numerator);
            }
        }
    });

    it.each(['proper', 'mixed'] as const)('generates two true %s decompositions', sourceKind => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`decompose-${sourceKind}-${seed}`);
            const problem = generator.generate(sourceKind === 'proper'
                ? configs.decomposeProper()
                : configs.decomposeMixed()).data;
            expect(problem.task).toBe('decompose');
            if (problem.task !== 'decompose') throw new Error('Expected decomposition.');
            expectCommon(problem);
            expect(problem.operation).toBe('addition');
            expect(problem.sourceKind).toBe(sourceKind);
            expectFraction(problem.sourceFraction, problem.denominator);
            expectModel(problem.sourceModel);
            const signatures = problem.decompositions.map(decomposition => {
                decomposition.terms.forEach(term => expectFraction(term, problem.denominator));
                expect(decomposition.terms.every(term => term.numerator > 0)).toBe(true);
                expect(decomposition.terms.reduce((sum, term) => sum + term.numerator, 0))
                    .toBe(problem.sourceFraction.numerator);
                expect(decomposition.equation).toContain(problem.sourceDisplay);
                expect(decomposition.equation).toContain(
                    decomposition.terms.map(term => term.notation).join(' + ')
                );
                expectModel(decomposition.model);
                expect(decomposition.model.totalNumerator).toBe(problem.sourceFraction.numerator);
                return decomposition.terms.map(term => term.numerator).sort((a, b) => a - b).join(',');
            });
            expect(signatures[0]).not.toBe(signatures[1]);
            expect(problem.solutionEquations).toEqual(problem.decompositions.map(item => item.equation));
            expect(problem.questionEquation).toBe(`${problem.sourceDisplay} = ?`);
            if (sourceKind === 'proper') {
                expect(problem.sourceMixed).toBeNull();
                expect(problem.sourceFraction.numerator).toBeLessThan(problem.denominator);
                expect(problem.sourceFraction.numerator).toBeGreaterThanOrEqual(3);
            } else {
                expect(problem.sourceMixed).not.toBeNull();
                expectMixed(problem.sourceMixed!, problem.denominator);
                expect(problem.sourceMixed!.improperNotation).toBe(problem.sourceFraction.notation);
                expect(problem.sourceDisplay).toBe(problem.sourceMixed!.notation);
                problem.decompositions.forEach(decomposition =>
                    expect(decomposition.equation).toContain(problem.sourceFraction.notation));
            }
        }
    });

    it.each(['addition', 'subtraction'] as const)(
        'generates exact mixed-number %s strategies including regrouping stress',
        operationLabel => {
            const strategies = new Set<string>();
            for (let seed = 0; seed < 200; seed++) {
                setSeed(`mixed-${operationLabel}-${seed}`);
                const problem = generator.generate(configs.mixed(operationLabel)).data;
                expect(problem.task).toBe('mixed-operation');
                if (problem.task !== 'mixed-operation') throw new Error('Expected mixed operation.');
                expectCommon(problem);
                expectMixed(problem.first, problem.denominator);
                expectMixed(problem.second, problem.denominator);
                expectMixed(problem.result, problem.denominator);
                expect(problem.first.whole).toBeGreaterThan(0);
                expect(problem.second.whole).toBeGreaterThan(0);
                const expectedImproper = problem.operation === 'addition'
                    ? problem.first.improperNumerator + problem.second.improperNumerator
                    : problem.first.improperNumerator - problem.second.improperNumerator;
                expect(problem.result.improperNumerator).toBe(expectedImproper);
                expect(problem.result.improperNumerator).toBeGreaterThan(0);
                expect(problem.operandConversionEquations).toEqual([
                    `${problem.first.notation} = ${problem.first.improperNotation}`,
                    `${problem.second.notation} = ${problem.second.improperNotation}`
                ]);
                expect(problem.improperOperationEquation).toBe(
                    `${problem.first.improperNotation} ${problem.symbol} ${problem.second.improperNotation} = ${problem.result.improperNotation}`
                );
                expect(problem.normalizationEquation).toBe(
                    `${problem.result.improperNotation} = ${problem.result.notation}`
                );
                expect(problem.solutionEquation).toBe(
                    `${problem.first.notation} ${problem.symbol} ${problem.second.notation} = ${problem.result.notation}`
                );
                expect(problem.questionEquation).toBe(
                    `${problem.first.notation} ${problem.symbol} ${problem.second.notation} = ?`
                );
                expect(problem.transformationSteps).toEqual([
                    ...problem.operandConversionEquations,
                    ...(problem.regroupingEquation ? [problem.regroupingEquation] : []),
                    problem.improperOperationEquation,
                    problem.normalizationEquation
                ]);
                expect(problem.requiresRegrouping).toBe(
                    problem.strategy === 'addition-with-carry'
                    || problem.strategy === 'subtraction-with-borrow'
                );
                if (problem.strategy.includes('with-carry')) {
                    expect(problem.first.numerator + problem.second.numerator)
                        .toBeGreaterThan(problem.denominator);
                    expect(problem.regroupingEquation).not.toBeNull();
                } else if (problem.strategy.includes('without-carry')) {
                    expect(problem.first.numerator + problem.second.numerator)
                        .toBeLessThan(problem.denominator);
                    expect(problem.regroupingEquation).toBeNull();
                } else if (problem.strategy.includes('with-borrow')) {
                    expect(problem.first.numerator).toBeLessThan(problem.second.numerator);
                    expect(problem.regroupingEquation).toBe(
                        `${problem.first.notation} = ${problem.first.whole - 1} ${problem.denominator + problem.first.numerator}/${problem.denominator}`
                    );
                } else {
                    expect(problem.first.numerator).toBeGreaterThan(problem.second.numerator);
                    expect(problem.regroupingEquation).toBeNull();
                }
                problem.questionModels.forEach(expectModel);
                expectModel(problem.solutionModel);
                expect(problem.solutionModel.totalNumerator).toBe(problem.result.improperNumerator);
                strategies.add(problem.strategy);
            }
            expect(strategies).toEqual(operationLabel === 'addition'
                ? new Set(['addition-with-carry', 'addition-without-carry'])
                : new Set(['subtraction-with-borrow', 'subtraction-without-borrow']));
        }
    );

    it('generates exact unit-fraction multiples with the multiplier hidden in Q', () => {
        const productKinds = new Set<string>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`unit-fraction-multiple-${seed}`);
            const problem = generator.generate(configs.unitMultiple()).data;
            expect(problem.task).toBe('unit-fraction-multiple');
            if (problem.task !== 'unit-fraction-multiple') {
                throw new Error('Expected a unit-fraction multiple.');
            }
            expect(problem.operation).toBe('multiplication');
            expect(problem.wholeFactor).toBeGreaterThanOrEqual(2);
            expect(problem.wholeFactor).toBeLessThanOrEqual(4);
            expect(problem.wholeFactorDisplay).toBe(`${problem.wholeFactor}`);
            expectFraction(problem.unitFraction, problem.denominator);
            expect(problem.unitFraction.numerator).toBe(1);
            expectFraction(problem.product, problem.denominator);
            expect(problem.product.numerator).toBe(problem.wholeFactor);
            expect(problem.productKind).toBe(problem.product.numerator < problem.denominator
                ? 'proper'
                : 'improper');
            expect(problem.groupCount).toBe(problem.wholeFactor);
            expect(problem.partsPerGroup).toBe(1);
            expect(problem.totalUnitParts).toBe(problem.wholeFactor);
            expectModel(problem.questionModel);
            expect(problem.questionModel.display).toBe(problem.product.notation);
            expect(problem.questionModel.totalNumerator).toBe(problem.product.numerator);
            expect(problem.questionModel.groups).toEqual([{
                id: 'given-product',
                role: 'result',
                label: problem.product.notation,
                startPart: 0,
                partCount: problem.product.numerator
            }]);
            expectModel(problem.solutionModel);
            expect(problem.solutionModel.display).toBe(problem.product.notation);
            expect(problem.solutionModel.totalNumerator).toBe(problem.product.numerator);
            expect(problem.solutionModel.groups).toHaveLength(problem.wholeFactor);
            expect(problem.solutionModel.groups.every(group => group.role === 'unit-part'))
                .toBe(true);
            const identity = `${problem.product.notation} = ${problem.wholeFactor} × (${problem.unitFraction.notation})`;
            expect(problem.unitMultipleEquation).toBe(identity);
            expect(problem.solutionEquation).toBe(identity);
            expect(problem.equationChain).toBe(identity);
            expect(problem.prompt).toBe(
                `How many copies of ${problem.unitFraction.notation} make ${problem.product.notation}? Complete the equation.`
            );
            expect(problem.questionEquation).toBe(
                `${problem.product.notation} = ? × (${problem.unitFraction.notation})`
            );
            expect(problem.unitSizeStatement).toBe(
                `Each equal part is ${problem.unitFraction.notation} of the ribbon.`
            );
            expect(problem.answer).toBe(`${problem.wholeFactor}`);
            expect(problem.answerStatement).toBe(
                `${problem.product.notation} is ${problem.wholeFactor} copies of ${problem.unitFraction.notation}, so ${identity}.`
            );
            expect(problem.story).toEqual({
                storyKind: 'ribbon-unit-multiple',
                context: `A ribbon is divided into ${problem.denominator} equal parts. The highlighted amount is ${problem.product.notation} of the ribbon, and each equal part is ${problem.unitFraction.notation} of the same ribbon.`,
                question: `How many copies of ${problem.unitFraction.notation} make ${problem.product.notation}? Complete the equation.`,
                wholeLabel: 'one ribbon',
                unitLabel: 'of the ribbon',
                givenDisplays: [problem.product.notation, problem.unitFraction.notation],
                unknownRole: 'multiplier'
            });
            productKinds.add(problem.productKind);
        }
        expect(productKinds).toEqual(new Set(['proper', 'improper']));
    });

    it.each([
        ['whole-number-fraction-product', 'proper'],
        ['whole-number-fraction-product', 'improper'],
        ['fraction-multiplication-problem', 'proper'],
        ['fraction-multiplication-problem', 'improper']
    ] as const)('generates coherent %s / %s products and exact unit chains', (
        task,
        productKind
    ) => {
        for (let seed = 0; seed < 200; seed++) {
            setSeed(`${task}-${productKind}-${seed}`);
            const problem = generator.generate(configs.fractionProduct(task, productKind)).data;
            expect(problem.task).toBe(task);
            if (problem.task !== 'whole-number-fraction-product'
                && problem.task !== 'fraction-multiplication-problem') {
                throw new Error('Expected a whole-number fraction product.');
            }
            expect(problem.operation).toBe('multiplication');
            expect(problem.productKind).toBe(productKind);
            expect(problem.wholeFactor).toBeGreaterThanOrEqual(2);
            expect(problem.wholeFactor).toBeLessThanOrEqual(4);
            expect(problem.wholeFactorDisplay).toBe(`${problem.wholeFactor}`);
            expectFraction(problem.unitFraction, problem.denominator);
            expect(problem.unitFraction.numerator).toBe(1);
            expectFraction(problem.fractionFactor, problem.denominator);
            expect(problem.fractionFactor.numerator).toBeGreaterThan(1);
            expect(problem.fractionFactor.numerator).toBeLessThan(problem.denominator);
            expectFraction(problem.product, problem.denominator);
            expect(problem.product.numerator).toBe(
                problem.wholeFactor * problem.fractionFactor.numerator
            );
            expect(problem.product.numerator).toBeLessThanOrEqual(4 * problem.denominator);
            expect(problem.product.numerator % problem.denominator).not.toBe(0);
            expect(problem.product.numerator < problem.denominator).toBe(
                productKind === 'proper'
            );
            expect(problem.groupCount).toBe(problem.wholeFactor);
            expect(problem.partsPerGroup).toBe(problem.fractionFactor.numerator);
            expect(problem.totalUnitParts).toBe(problem.product.numerator);
            expect(problem.questionGroupModels).toHaveLength(problem.wholeFactor);
            problem.questionGroupModels.forEach((model, groupIndex) => {
                expectModel(model);
                expect(model.display).toBe(problem.fractionFactor.notation);
                expect(model.totalNumerator).toBe(problem.fractionFactor.numerator);
                expect(model.groups).toEqual([{
                    id: `group-${groupIndex}`,
                    role: 'fraction-group',
                    label: problem.fractionFactor.notation,
                    startPart: 0,
                    partCount: problem.fractionFactor.numerator
                }]);
            });
            expectModel(problem.solutionModel);
            expect(problem.solutionModel.display).toBe(problem.product.notation);
            expect(problem.solutionModel.totalNumerator).toBe(problem.product.numerator);
            expect(problem.solutionModel.groups).toHaveLength(problem.wholeFactor);
            expect(problem.solutionModel.groups.every(group =>
                group.role === 'fraction-group'
                && group.partCount === problem.fractionFactor.numerator
            )).toBe(true);
            const factorEquation = `${problem.fractionFactor.notation} = ${problem.fractionFactor.numerator} × (${problem.unitFraction.notation})`;
            const iteratedEquation = `${problem.wholeFactor} × (${problem.fractionFactor.notation}) = ${problem.product.numerator} × (${problem.unitFraction.notation})`;
            const solutionEquation = `${problem.wholeFactor} × (${problem.fractionFactor.notation}) = ${problem.product.notation}`;
            const equationChain = `${problem.wholeFactor} × (${problem.fractionFactor.notation}) = (${problem.wholeFactor} × ${problem.fractionFactor.numerator}) × (${problem.unitFraction.notation}) = ${problem.product.numerator} × (${problem.unitFraction.notation}) = ${problem.product.notation}`;
            expect(problem.fractionAsUnitMultipleEquation).toBe(factorEquation);
            expect(problem.iteratedUnitEquation).toBe(iteratedEquation);
            expect(problem.solutionEquation).toBe(solutionEquation);
            expect(problem.equationChain).toBe(equationChain);
            expect(problem.questionEquation).toBe(
                `${problem.wholeFactor} × (${problem.fractionFactor.notation}) = ?/${problem.denominator}`
            );
            expect(problem.answer).toBe(problem.product.notation);
            expect(problem.story.storyKind).toBe('equal-fraction-groups');
            expect(problem.story.context).toBe(
                `${problem.wholeFactor} craft kits each use ${problem.fractionFactor.notation} meter of ribbon from the same kind of roll.`
            );
            expect(problem.story.givenDisplays).toEqual([
                `${problem.wholeFactor} craft kits`,
                problem.fractionFactor.notation
            ]);
            expect(problem.story.unknownRole).toBe('product');
            if (problem.task === 'fraction-multiplication-problem') {
                expect(problem.lowerWhole).toBe(Math.floor(
                    problem.product.numerator / problem.denominator
                ));
                expect(problem.upperWhole).toBe(Math.ceil(
                    problem.product.numerator / problem.denominator
                ));
                expect(problem.upperWhole).toBe(problem.lowerWhole + 1);
                expect(problem.boundsStatement).toBe(
                    `${problem.lowerWhole} < ${problem.product.notation} < ${problem.upperWhole}`
                );
                expect(problem.story.question).toBe(
                    'How many meters of ribbon do the craft kits use altogether?'
                );
            } else {
                expect(problem.story.question).toBe(
                    'Use unit-fraction groups to determine the total ribbon used.'
                );
            }
        }
    });

    it('is deterministic for a complete task configuration', () => {
        const config = configs.mixed('subtraction');
        setSeed('fraction-arithmetic-determinism');
        const first = generator.generate(config);
        setSeed('fraction-arithmetic-determinism');
        expect(generator.generate(config)).toEqual(first);
    });

    it('converts tenths to hundredths before adding with exact Q/S evidence', () => {
        const tenthsSeen = new Set<number>();
        let sawTinyHundredths = false;
        let sawTenthBoundaryCarry = false;
        let sawExactWhole = false;
        for (let seed = 0; seed < 120; seed++) {
            setSeed(`tenths-hundredths-${seed}`);
            const problem = generator.generate(configs.tenthsHundredths()).data;
            expect(problem.task).toBe('tenths-hundredths-addition');
            if (problem.task !== 'tenths-hundredths-addition') {
                throw new Error('Expected tenths-hundredths addition.');
            }
            expectCommon(problem);
            const a = problem.firstTenths.numerator;
            const b = problem.secondHundredths.numerator;
            const converted = a * 10;
            const result = converted + b;
            expect(a).toBeGreaterThanOrEqual(1);
            expect(a).toBeLessThanOrEqual(9);
            expect(b).toBeGreaterThanOrEqual(1);
            expect(b).toBeLessThanOrEqual(100 - converted);
            expect(problem.convertedFirst.numerator).toBe(converted);
            expect(problem.result.numerator).toBe(result);
            expect(result).toBeLessThanOrEqual(100);
            expect(problem.conversion).toEqual({
                factor: 10,
                numeratorEquation: `${a} × 10 = ${converted}`,
                denominatorEquation: '10 × 10 = 100',
                equation: `${a}/10 = ${converted}/100`
            });
            expect(problem.prompt).toBe('Express the tenths as hundredths, then add.');
            expect(problem.questionEquation).toBe(`${a}/10 + ${b}/100 = ?/100`);
            expect(problem.conversionEquation).toBe(`${a}/10 = ${converted}/100`);
            expect(problem.solutionEquation).toBe(`${converted}/100 + ${b}/100 = ${result}/100`);
            expect(problem.equationChain).toBe(
                `${a}/10 + ${b}/100 = ${converted}/100 + ${b}/100 = ${result}/100`
            );
            expect(problem.answer).toBe(String(result));
            expect(problem.answerStatement).toBe(`${a}/10 + ${b}/100 = ${result}/100.`);
            expectDecimalGrid(problem.questionModels.firstTenths);
            expectDecimalGrid(problem.questionModels.secondHundredths);
            expectDecimalGrid(problem.solutionModels.convertedFirst);
            expectDecimalGrid(problem.solutionModels.result);
            expect(problem.questionModels.firstTenths.shadedCount).toBe(a);
            expect(problem.questionModels.secondHundredths.shadedCount).toBe(b);
            expect(problem.solutionModels.convertedFirst.shadedCount).toBe(converted);
            expect(problem.solutionModels.result.shadedCount).toBe(result);
            expect(problem.questionModels.firstTenths.groups).toEqual([{
                source: 'first-addend', label: `${a}/10`, startCell: 0, cellCount: a
            }]);
            expect(problem.questionModels.secondHundredths.groups).toEqual([{
                source: 'second-addend', label: `${b}/100`, startCell: 0, cellCount: b
            }]);
            expect(problem.solutionModels.result.groups).toEqual([{
                source: 'first-addend', label: `${converted}/100`, startCell: 0, cellCount: converted
            }, {
                source: 'second-addend', label: `${b}/100`, startCell: converted, cellCount: b
            }]);
            tenthsSeen.add(a);
            sawTinyHundredths ||= b === 1;
            sawTenthBoundaryCarry ||= b >= 10;
            sawExactWhole ||= result === 100;
        }
        expect(tenthsSeen).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        expect(sawTinyHundredths).toBe(true);
        expect(sawTenthBoundaryCarry).toBe(true);
        expect(sawExactWhole).toBe(true);
    });

    it.each([
        ['tiny hundredths', 'tenths-stress-52', 4, 1, 41],
        ['cross-tenth addition', 'tenths-stress-1', 2, 66, 86],
        ['near-full grid', 'tenths-stress-2', 8, 19, 99],
        ['exact whole', 'tenths-stress-0', 6, 40, 100]
    ] as const)('locks the deterministic %s stress payload', (
        _stress,
        seed,
        tenthsNumerator,
        hundredthsNumerator,
        resultNumerator
    ) => {
        setSeed(seed);
        const problem = generator.generate(configs.tenthsHundredths()).data;
        expect(problem.task).toBe('tenths-hundredths-addition');
        if (problem.task !== 'tenths-hundredths-addition') throw new Error('Expected decimal-grid addition.');
        expect([
            problem.firstTenths.numerator,
            problem.secondHundredths.numerator,
            problem.result.numerator
        ]).toEqual([tenthsNumerator, hundredthsNumerator, resultNumerator]);
    });

    it.each([
        [
            'interpret',
            'legacy-interpret',
            configs.interpret('addition'),
            '93d4abb6057f18ef50706661398064f0f106dd0c25d271ef704764e85891ef92'
        ],
        [
            'decompose',
            'legacy-decompose',
            configs.decomposeMixed(),
            '9c9392ce740fffc83073edd17c0fa86e11f6d0bd629421e2628f513465c94597'
        ],
        [
            'mixed',
            'legacy-mixed',
            configs.mixed('subtraction'),
            'bbed4731e79d44c5a1f3ace2a917d0c59fe48e04a6ed68827a441be049784d51'
        ],
        [
            'word',
            'legacy-word',
            configs.fractionOperation('addition'),
            '39b7a249802f5ba85bcbe4f1bb90698e3bcb67c382dc862288732f8d33b258fb'
        ]
    ] as const)('preserves the fixed-seed B.3 %s payload', (
        _name,
        seed,
        config,
        expectedHash
    ) => {
        setSeed(seed);
        const payload = generator.generate(config).data;
        expect(createHash('sha256').update(JSON.stringify(payload)).digest('hex'))
            .toBe(expectedHash);
    });
});
