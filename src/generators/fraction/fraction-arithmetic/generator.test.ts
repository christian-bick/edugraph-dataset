import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {
    FractionArithmeticModel,
    FractionArithmeticOperation,
    FractionArithmeticProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionValue
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
    } else {
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
    }
};

const expectCommon = (problem: FractionArithmeticProblem): void => {
    expect(denominators).toContain(problem.denominator);
    expect(problem.sharedWhole).toBe(1);
    expect(problem.referenceId).toBe('same-whole');
    expect(problem.prompt.length).toBeGreaterThan(10);
    expect(problem.questionEquation).toContain('?');
    expect(problem.answer.length).toBeGreaterThan(0);
    expect(problem.answerStatement.length).toBeGreaterThan(10);
    expect(problem.explanation.length).toBeGreaterThan(30);
    expectStrictStory(problem);
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
        } as never)).toThrow('Operation must be addition or subtraction.');
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

    it('is deterministic for a complete task configuration', () => {
        const config = configs.mixed('subtraction');
        setSeed('fraction-arithmetic-determinism');
        const first = generator.generate(config);
        setSeed('fraction-arithmetic-determinism');
        expect(generator.generate(config)).toEqual(first);
    });
});
