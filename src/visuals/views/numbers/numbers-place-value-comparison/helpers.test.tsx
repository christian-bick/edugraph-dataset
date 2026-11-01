import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ComparisonProblem, LegacyComparisonProblem} from '../../../../types/problems.ts';
import {
    decomposeTensAndOnes,
    findDecidingPlace,
    isValidPlaceValueComparisonProblem,
    relationSymbol
} from './helpers.ts';
import {NumbersPlaceValueComparisonCore} from './view.tsx';
import {ComparisonGenerator} from '../../../../generators/comparison/generator.ts';
import {comparisonProfiles} from '../../../../generators/comparison/profiles.ts';
import {setSeed} from '../../../../lib/random.ts';

const payload = (
    data: LegacyComparisonProblem,
    isSolutionView: boolean
): ViewRenderPayload<'numbers-place-value-comparison'> => ({
    problem: {type: 'comparison', data, labels: []},
    viewId: 'numbers-place-value-comparison',
    targetLabels: [],
    isSolutionView,
    seed: 17
});

describe('place-value comparison helpers', () => {
    it('validates the supplied relation for two-digit compared values', () => {
        expect(isValidPlaceValueComparisonProblem({num1: 42, num2: 37, relation: 'greater'})).toBe(true);
        expect(isValidPlaceValueComparisonProblem({num1: 42, num2: 47, relation: 'greater'})).toBe(false);
        expect(isValidPlaceValueComparisonProblem({num1: 55, num2: 55, relation: 'equal'})).toBe(true);
        expect(isValidPlaceValueComparisonProblem({num1: 10, num2: 99, relation: 'less'})).toBe(true);
        expect(isValidPlaceValueComparisonProblem({num1: 99, num2: 99, relation: 'equal'})).toBe(true);
    });

    it.each([
        {num1: 9, num2: 22, relation: 'less'},
        {num1: 22, num2: 100, relation: 'less'},
        {num1: 22, num2: 101, relation: 'less'},
        {num1: -22, num2: 33, relation: 'less'},
        {num1: 22.5, num2: 33, relation: 'less'}
    ])('rejects values outside the two-digit boundary', candidate => {
        expect(isValidPlaceValueComparisonProblem(candidate as ComparisonProblem)).toBe(false);
    });

    it('rejects the multi-digit comparison payload variant', () => {
        const candidate = {
            task: 'multi-digit-place-value-comparison',
            num1: 1234,
            num2: 1235,
            relation: 'less'
        } as ComparisonProblem;
        expect(isValidPlaceValueComparisonProblem(candidate)).toBe(false);
    });

    it('decomposes numerals and identifies the first deciding place', () => {
        const fortyTwo = decomposeTensAndOnes(42);
        const thirtySeven = decomposeTensAndOnes(37);
        const fortySeven = decomposeTensAndOnes(47);
        const ninety = decomposeTensAndOnes(90);

        expect(fortyTwo).toEqual({tens: 4, ones: 2});
        expect(ninety).toEqual({tens: 9, ones: 0});
        expect(findDecidingPlace(fortyTwo, thirtySeven)).toBe('tens');
        expect(findDecidingPlace(fortyTwo, fortySeven)).toBe('ones');
        expect(findDecidingPlace(fortyTwo, fortyTwo)).toBe('all');
        expect(findDecidingPlace(ninety, decomposeTensAndOnes(99))).toBe('ones');
    });

    it('maps each validated relation to its symbol', () => {
        expect(relationSymbol('less')).toBe('<');
        expect(relationSymbol('greater')).toBe('>');
        expect(relationSymbol('equal')).toBe('=');
    });
});

describe('place-value comparison modes', () => {
    it('withholds the relation in Question Mode and reveals it with deciding-place evidence in Solution Mode', () => {
        const data: LegacyComparisonProblem = {num1: 42, num2: 37, relation: 'greater'};
        const question = renderToStaticMarkup(
            <NumbersPlaceValueComparisonCore config={{}} payload={payload(data, false)} />
        );
        const solution = renderToStaticMarkup(
            <NumbersPlaceValueComparisonCore config={{}} payload={payload(data, true)} />
        ).replaceAll('&gt;', '>');

        expect(question).toContain('tens place representation');
        expect(question).toContain('ones place representation');
        expect(question).not.toContain('42 > 37');
        expect(question).not.toContain('Deciding place: tens');
        expect(question).not.toContain('The tens decide');
        expect(solution).toContain('42');
        expect(solution).toContain('>');
        expect(solution).toContain('Deciding place: tens');
        expect(solution).toContain('The tens columns differ');
    });

    it('explains a ones-place decision only in Solution Mode', () => {
        const data: LegacyComparisonProblem = {num1: 42, num2: 47, relation: 'less'};
        const solution = renderToStaticMarkup(
            <NumbersPlaceValueComparisonCore config={{}} payload={payload(data, true)} />
        );

        expect(solution).toContain('Deciding place: ones');
        expect(solution).toContain('The tens columns match, so the ones decide');
    });

    it('renders a zero ones-place count within the two-digit source domain', () => {
        const data: LegacyComparisonProblem = {num1: 90, num2: 89, relation: 'greater'};
        const solution = renderToStaticMarkup(
            <NumbersPlaceValueComparisonCore config={{}} payload={payload(data, true)} />
        ).replaceAll('&gt;', '>');

        expect(solution).toContain('tens place representation');
        expect(solution).toContain('no ones');
        expect(solution).toContain('90');
        expect(solution).toContain('Deciding place: tens');
        expect(solution).toContain('>');
    });

    it('renders every canonical two-digit comparison profile in both modes', () => {
        const generator = new ComparisonGenerator();
        const profiles = comparisonProfiles.filter(({profile}) =>
            !profile.requireNegative && !profile.requireZero
            && profile.range.min >= 10 && profile.maximumValue <= 99);
        expect(profiles).toHaveLength(8);
        for (const {profile: comparison} of profiles) {
            for (let seed = 0; seed < 8; seed++) {
                setSeed(seed);
                const data = generator.generate({comparison})!.data;
                expect(isValidPlaceValueComparisonProblem(data)).toBe(true);
                for (const mode of [false, true]) {
                    const html = renderToStaticMarkup(
                        <NumbersPlaceValueComparisonCore config={{}}
                            payload={payload(data as LegacyComparisonProblem, mode)} />
                    );
                    expect(html).toContain(String(data.num1));
                    expect(html).toContain(String(data.num2));
                }
            }
        }
    });
});
