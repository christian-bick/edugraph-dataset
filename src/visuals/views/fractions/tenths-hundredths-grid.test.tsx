import {Ability} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionArithmeticGenerator} from '../../../generators/fraction/fraction-arithmetic/generator.ts';
import {FractionEquivalenceGenerator} from '../../../generators/fraction/fraction-equivalence/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {TenthsHundredthsGrid as SharedTenthsHundredthsGrid} from '../../components/TenthsHundredthsGrid.tsx';
import {
    TenthsHundredthsAdditionProblem,
    TenthsToHundredthsProblem
} from '../../../types/problems.ts';
import {FractionArithmeticWork} from './fraction-arithmetic-components.tsx';
import {
    isValidTenthsHundredthsAdditionProblem,
    isValidTenthsToHundredthsProblem,
    TenthsHundredthsGrid as CompatibilityTenthsHundredthsGrid,
    TenthsToHundredthsModel
} from './tenths-hundredths-grid.tsx';

const arithmeticGenerator = new FractionArithmeticGenerator();

const generateAddition = (seed = 'tenths-hundredths-addition-view'): TenthsHundredthsAdditionProblem => {
    setSeed(seed);
    const data = arithmeticGenerator.generate({
        task: 'tenths-hundredths-addition',
        operation: 'addition',
        usesCommonDenominator: true
    }).data;
    if (data.task !== 'tenths-hundredths-addition') throw new Error('Expected addition payload.');
    return data;
};

const generateEquivalence = (seed = 'tenths-hundredths-equivalence-view'): TenthsToHundredthsProblem => {
    setSeed(seed);
    const data = new FractionEquivalenceGenerator().generate({
        taskAbilities: [Ability.Formalization],
        usesMultiplication: true,
        usesEqualShares: true,
        usesImproperFractions: false,
        usesIntegerNumbers: false
    }).data;
    if (data.task !== 'tenths-to-hundredths') throw new Error('Expected equivalence payload.');
    return data;
};

describe('tenths/hundredths view contract', () => {
    it('keeps the legacy category export on the identical shared renderer', () => {
        expect(CompatibilityTenthsHundredthsGrid).toBe(SharedTenthsHundredthsGrid);
    });

    it('accepts generator-supplied 1×10 and 10×10 shared-whole models', () => {
        let sawWholeEquivalence = false;
        let sawOneHundredth = false;
        let sawBoundaryCrossing = false;
        let sawWholeSum = false;
        for (let seed = 0; seed < 200; seed++) {
            const equivalence = generateEquivalence(`equivalence-${seed}`);
            const addition = generateAddition(`addition-${seed}`);
            expect(isValidTenthsToHundredthsProblem(equivalence)).toBe(true);
            expect(isValidTenthsHundredthsAdditionProblem(addition)).toBe(true);
            sawWholeEquivalence ||= equivalence.tenths.numerator === 10;
            sawOneHundredth ||= addition.secondHundredths.numerator === 1;
            sawBoundaryCrossing ||= addition.secondHundredths.numerator >= 10;
            sawWholeSum ||= addition.result.numerator === 100;
        }
        expect({sawWholeEquivalence, sawOneHundredth, sawBoundaryCrossing, sawWholeSum}).toEqual({
            sawWholeEquivalence: true,
            sawOneHundredth: true,
            sawBoundaryCrossing: true,
            sawWholeSum: true
        });
    });

    it('rejects contradictory scaling, geometry, shading, equations, and prose', () => {
        const mutations: Array<(data: TenthsToHundredthsProblem) => void> = [
            data => { data.numeratorScale.result += 1; },
            data => { data.models.hundredths.cells[10]!.column += 1; },
            data => { data.models.hundredths.cells[0]!.shaded = false; },
            data => { data.models.hundredths.cells[0]!.tenthGroupIndex = 2; },
            data => { data.questionEquation = data.solutionEquation; },
            data => { data.answerStatement = 'The models look equal.'; }
        ];
        for (const mutate of mutations) {
            const data = structuredClone(generateEquivalence());
            mutate(data);
            expect(isValidTenthsToHundredthsProblem(data)).toBe(false);
        }
    });

    it('rejects contradictory addition conversion, result, story, and model evidence', () => {
        const mutations: Array<(data: TenthsHundredthsAdditionProblem) => void> = [
            data => { data.conversion.factor = 2 as never; },
            data => { data.result.numerator += 1; },
            data => { data.story.unknownRole = 'operation' as never; },
            data => { data.story.givenDisplays.push('extra'); },
            data => { data.solutionModels.result.cells[0]!.source = 'second-addend'; },
            data => { data.solutionModels.result.groups[1]!.startCell -= 1; },
            data => { data.solutionModels.result.cells.pop(); },
            data => {
                data.result.numerator = 101;
                data.result.notation = '101/100';
            },
            data => { data.equationChain = data.questionEquation; }
        ];
        for (const mutate of mutations) {
            const data = structuredClone(generateAddition());
            mutate(data);
            expect(isValidTenthsHundredthsAdditionProblem(data)).toBe(false);
        }
    });

    it('returns false rather than throwing for missing nested payload objects', () => {
        const malformedEquivalence = structuredClone(generateEquivalence()) as unknown as Record<string, unknown>;
        malformedEquivalence.numeratorScale = null;
        expect(() => isValidTenthsToHundredthsProblem(
            malformedEquivalence as unknown as TenthsToHundredthsProblem
        )).not.toThrow();
        expect(isValidTenthsToHundredthsProblem(
            malformedEquivalence as unknown as TenthsToHundredthsProblem
        )).toBe(false);

        const malformedAddition = structuredClone(generateAddition()) as unknown as Record<string, unknown>;
        malformedAddition.story = null;
        expect(() => isValidTenthsHundredthsAdditionProblem(
            malformedAddition as unknown as TenthsHundredthsAdditionProblem
        )).not.toThrow();
        expect(isValidTenthsHundredthsAdditionProblem(
            malformedAddition as unknown as TenthsHundredthsAdditionProblem
        )).toBe(false);

        const missingCells = structuredClone(generateAddition());
        missingCells.solutionModels.result.cells = null as never;
        expect(() => isValidTenthsHundredthsAdditionProblem(missingCells)).not.toThrow();
        expect(isValidTenthsHundredthsAdditionProblem(missingCells)).toBe(false);

        const missingGroups = structuredClone(generateAddition());
        missingGroups.solutionModels.result.groups = null as never;
        expect(() => isValidTenthsHundredthsAdditionProblem(missingGroups)).not.toThrow();
        expect(isValidTenthsHundredthsAdditionProblem(missingGroups)).toBe(false);
    });

    it('withholds answer-bearing scaling and addition evidence in Question Mode', () => {
        const equivalence = generateEquivalence();
        const equivalenceQuestion = renderToStaticMarkup(
            <TenthsToHundredthsModel data={equivalence} isSolutionView={false} />
        );
        const equivalenceSolution = renderToStaticMarkup(
            <TenthsToHundredthsModel data={equivalence} isSolutionView />
        );
        expect(equivalenceQuestion).not.toContain(equivalence.hundredths.notation);
        expect(equivalenceQuestion).not.toContain(equivalence.answerStatement);
        expect(equivalenceSolution).toContain(equivalence.hundredths.notation);
        expect(equivalenceSolution).toContain(equivalence.answerStatement);

        const addition = generateAddition();
        const additionQuestion = renderToStaticMarkup(
            <FractionArithmeticWork data={addition} isSolutionView={false} />
        );
        const additionSolution = renderToStaticMarkup(
            <FractionArithmeticWork data={addition} isSolutionView />
        );
        expect(additionQuestion).not.toContain(addition.conversionEquation);
        expect(additionQuestion).not.toContain(addition.result.notation);
        expect(additionSolution).toContain(addition.conversionEquation);
        expect(additionSolution).toContain(addition.result.notation);
    });
});
