import {Area} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {PlaceValueArithmeticGenerator} from '../../../../generators/place-value/place-value-arithmetic/generator.ts';
import {PlaceValueArithmeticGeneratorConfig} from '../../../../generators/place-value/place-value-arithmetic/spec.ts';
import {setSeed} from '../../../../lib/random.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {PlaceValueArithmeticProblem} from '../../../../types/problems.ts';
import {isValidPlaceValueArithmeticProblem} from '../helpers.ts';
import {PlaceValueArithmeticModelCore} from './view.tsx';

const generator = new PlaceValueArithmeticGenerator();

const config = (
    overrides: Partial<PlaceValueArithmeticGeneratorConfig> = {}
): PlaceValueArithmeticGeneratorConfig => ({
    operation: Area.Addition,
    requireRegrouping: false,
    requireSingleDigitSmallest: false,
    requireTwoDigitLargest: false,
    requireMultipleOf10: false,
    requireZero: false,
    range: {min: 0, max: 1000},
    ...overrides
});

const generate = (
    seed: string | number,
    overrides: Partial<PlaceValueArithmeticGeneratorConfig>
): PlaceValueArithmeticProblem => {
    setSeed(seed);
    const stub = generator.generate(config(overrides));
    if (stub === null) throw new Error(`Expected a problem for seed ${seed}.`);
    return stub.data;
};

const grade1SingleDigit = (requireRegrouping: boolean): PlaceValueArithmeticProblem =>
    generate(`single-${requireRegrouping}`, {
        requireRegrouping,
        requireSingleDigitSmallest: true,
        requireTwoDigitLargest: true,
        range: {min: 0, max: 100}
    });

const grade1MultipleAddition = (): PlaceValueArithmeticProblem =>
    generate('multiple-addition', {
        requireTwoDigitLargest: true,
        requireMultipleOf10: true,
        range: {min: 0, max: 100}
    });

const grade1TensSubtraction = (requireZero: boolean): PlaceValueArithmeticProblem =>
    generate(`tens-subtraction-${requireZero}`, {
        operation: Area.Subtraction,
        requireMultipleOf10: true,
        requireZero,
        range: {min: 0, max: 100}
    });

const generalRegrouping = (operation: typeof Area.Addition | typeof Area.Subtraction): PlaceValueArithmeticProblem =>
    generate(`general-${operation}`, {operation, requireRegrouping: true});

const subtractionWithHundredsBorrowing = (): PlaceValueArithmeticProblem => {
    return {
        num1: 452,
        num2: 158,
        answer: 294,
        operation: 'subtraction',
        operandProfile: 'general',
        operands: [
            {hundreds: 4, tens: 5, ones: 2},
            {hundreds: 1, tens: 5, ones: 8}
        ],
        result: {hundreds: 2, tens: 9, ones: 4},
        regrouping: {
            kind: 'decompose-ten',
            onesBefore: 2,
            onesAfter: 12,
            tensExchanged: 1,
            statement: 'Decompose 1 ten as 10 ones, changing 2 ones to 12 ones.'
        },
        equation: '452 − 158 = 294',
        strategySteps: [
            {
                kind: 'decompose-ten',
                place: 'tens',
                equation: '450 = 440 + 10',
                explanation: 'Decompose one ten: 450 = 440 + 10.'
            },
            {
                kind: 'subtract-ones',
                place: 'ones',
                equation: '12 − 8 = 4',
                explanation: 'Subtract the ones: 12 − 8 = 4.'
            },
            {
                kind: 'result',
                place: 'result',
                equation: '440 − 150 + 4 = 294',
                explanation: 'Subtract the remaining place-value parts and combine them to get 294.'
            }
        ]
    };
};

const additionWithTwoCarries = (): PlaceValueArithmeticProblem => ({
    num1: 748,
    num2: 158,
    answer: 906,
    operation: 'addition',
    operandProfile: 'general',
    operands: [
        {hundreds: 7, tens: 4, ones: 8},
        {hundreds: 1, tens: 5, ones: 8}
    ],
    result: {hundreds: 9, tens: 0, ones: 6},
    regrouping: {
        kind: 'compose-ten',
        onesBefore: 16,
        onesAfter: 6,
        tensExchanged: 1,
        statement: 'Compose 10 of the 16 ones as 1 ten, leaving 6 ones.'
    },
    equation: '748 + 158 = 906',
    strategySteps: [
        {
            kind: 'combine-ones',
            place: 'ones',
            equation: '8 + 8 = 16',
            explanation: 'Combine the ones: 8 + 8 = 16.'
        },
        {
            kind: 'compose-ten',
            place: 'ones',
            equation: '16 = 10 + 6',
            explanation: 'Compose a ten: 16 ones = 1 ten and 6 ones.'
        },
        {
            kind: 'result',
            place: 'result',
            equation: '740 + 150 + 10 + 6 = 906',
            explanation: 'Combine the tens, the composed ten, and 6 ones to get 906.'
        }
    ]
});

const payload = (
    data: PlaceValueArithmeticProblem,
    isSolutionView: boolean
): ViewRenderPayload<'place-value-arithmetic-model'> => ({
    problem: {type: 'arithmetic', data},
    viewId: 'place-value-arithmetic-model',
    labels: [],
    isSolutionView,
    seed: 23
});

const changed = (
    source: PlaceValueArithmeticProblem,
    update: (value: PlaceValueArithmeticProblem) => void
): PlaceValueArithmeticProblem => {
    const copy = structuredClone(source);
    update(copy);
    return copy;
};

describe('place-value arithmetic shared validation', () => {
    it('accepts every Grade 1 profile and the existing upper-grade general profile', () => {
        const supported = [
            grade1SingleDigit(false),
            grade1SingleDigit(true),
            grade1MultipleAddition(),
            grade1TensSubtraction(false),
            grade1TensSubtraction(true),
            generalRegrouping(Area.Addition),
            generalRegrouping(Area.Subtraction)
        ];
        for (const data of supported) {
            expect(isValidPlaceValueArithmeticProblem(data), data.equation).toBe(true);
        }
    });

    it('rejects contradictory arithmetic, digits, regrouping, profiles, equations, and step records', () => {
        const source = grade1SingleDigit(true);
        const mutations: Array<(value: PlaceValueArithmeticProblem) => void> = [
            value => { value.answer -= 1; },
            value => { value.operands[0].ones = (value.operands[0].ones + 1) % 10; },
            value => { value.result.tens = (value.result.tens + 1) % 10; },
            value => { value.regrouping.onesAfter += 1; },
            value => { value.regrouping.kind = 'none'; },
            value => { value.regrouping.statement = 'A vague regrouping statement.'; },
            value => { value.operandProfile = 'multiples-of-ten'; },
            value => { value.equation = `${value.num1} + ${value.num2} = ${value.answer - 1}`; },
            value => { value.strategySteps[1].kind = 'combine-tens'; },
            value => { value.strategySteps[2].place = 'tens'; },
            value => { value.strategySteps[0].equation = ''; }
        ];
        for (const mutate of mutations) {
            expect(isValidPlaceValueArithmeticProblem(changed(source, mutate))).toBe(false);
        }
    });
});

describe('place-value arithmetic model modes', () => {
    it('withholds compose-ten evidence and the result in Question Mode, then reveals the exact exchange', () => {
        const data = grade1SingleDigit(true);
        const question = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(data, true)} />);

        expect(question).toContain(`First operand: ${data.num1}`);
        expect(question).toContain(`Second operand: ${data.num2}`);
        expect(question).not.toContain(data.regrouping.statement);
        expect(question).not.toContain('Combined ones');
        expect(question).not.toContain(`Result ${data.answer}`);
        expect(solution).toContain('Combined ones');
        expect(solution).toContain(`${data.regrouping.onesBefore} ones`);
        expect(solution).toContain('Compose one ten');
        expect(solution).toContain(`1 ten and ${data.regrouping.onesAfter} ones`);
        expect(solution).toContain(`Result ${data.answer}`);
        expect(solution).toContain(`${data.result.tens} tens`);
    });

    it('shows direct combination for no-regroup and multiple-of-ten addition', () => {
        const noRegroupData = grade1SingleDigit(false);
        const multipleData = grade1MultipleAddition();
        const noRegroup = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(noRegroupData, true)} />
        );
        const multipleOfTen = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(multipleData, true)} />
        );

        expect(noRegroup).toContain(`Combine ${noRegroupData.num2}`);
        expect(noRegroup).toContain(`Result ${noRegroupData.answer}`);
        expect(multipleOfTen).toContain(`Combine ${multipleData.num2}`);
        expect(multipleOfTen).toContain(`Result ${multipleData.answer}`);
    });

    it('matches and removes exact tens, including equal operands that produce zero', () => {
        const differenceData = grade1TensSubtraction(false);
        const zeroData = grade1TensSubtraction(true);
        const difference = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(differenceData, true)} />
        );
        const zero = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: false}} payload={payload(zeroData, true)} />
        );

        expect(difference).toContain(`${differenceData.num1 / 10} tens`);
        expect(difference).toContain(`${differenceData.num2 / 10} tens`);
        expect(difference).toContain(`${differenceData.answer / 10} tens`);
        expect(difference).toContain(`Result ${differenceData.answer}`);
        expect(difference).not.toContain('0 hundreds');
        expect(difference).not.toContain('0 ones');
        expect(difference).toContain('The ones places are empty, so subtract the tens directly.');
        expect(zero).toContain(`${zeroData.num1 / 10} tens`);
        expect(zero).toContain('0 hundreds');
        expect(zero).toContain('0 ones');
        expect(zero).toContain('0 tens');
        expect(zero).toContain('Result 0');
        expect(zero).toContain('all blocks were removed');
    });

    it('aligns the same quantities vertically and reveals the written result only in Solution Mode', () => {
        const data = grade1SingleDigit(true);
        const question = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, true)} />);

        expect(question).toContain('Vertical written method');
        expect(question).toContain(`aria-label="First operand ${data.num1}"`);
        expect(question).toContain(`aria-label="Second operand ${data.num2}"`);
        expect(question).not.toContain(`aria-label="Written result ${data.answer}"`);
        expect(solution).toContain(`aria-label="Written result ${data.answer}"`);
        expect(solution).toContain('text-rose-600');
    });

    it('uses a complete tens-unit vertical method for positive whole-tens subtraction', () => {
        const data = grade1TensSubtraction(false);
        const question = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, false)} />);
        const solution = renderToStaticMarkup(<PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, true)} />);

        expect(question).toContain('Tens-unit vertical method');
        expect(question).toContain(`aria-label="First operand ${data.num1 / 10} tens"`);
        expect(question).toContain(`aria-label="Second operand ${data.num2 / 10} tens"`);
        expect(question).not.toContain('0 ones');
        expect(question).not.toContain('0 hundreds');
        expect(question).not.toContain(`aria-label="Written result ${data.answer / 10} tens"`);
        expect(solution).toContain(`aria-label="Written result ${data.answer / 10} tens"`);
    });

    it('continues to render structured upper-grade general regrouping records', () => {
        const additionData = generalRegrouping(Area.Addition);
        const subtractionData = generalRegrouping(Area.Subtraction);
        const addition = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(additionData, true)} />
        );
        const subtraction = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(subtractionData, true)} />
        );

        expect(addition).toContain(`First operand: ${additionData.num1}`);
        expect(addition).toContain(`${additionData.operands[0].hundreds} hundreds`);
        expect(addition).toContain(`Written result ${additionData.answer}`);
        expect(subtraction).toContain(`First operand: ${subtractionData.num1}`);
        expect(subtraction).toContain(`Written result ${subtractionData.answer}`);
        expect(subtraction).toContain(`${subtractionData.regrouping.onesAfter} ones`);
        expect(subtraction).toContain(`${subtractionData.operands[1].ones} ones; ${subtractionData.result.ones} remain`);
    });

    it('shows a complete hundreds-to-tens borrowing annotation in the vertical method', () => {
        const data = subtractionWithHundredsBorrowing();
        const adjustedHundreds = data.operands[0].hundreds - 1;
        const adjustedTens = data.operands[0].tens - 1 + 10;
        const adjustedOnes = data.operands[0].ones + 10;
        const solution = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, true)} />
        );

        expect(solution).toContain('Regrouped top number');
        expect(solution).toContain(
            `aria-label="Regrouped top number: H ${adjustedHundreds}, T ${adjustedTens}, O ${adjustedOnes}"`
        );
    });

    it('shows both carries when addition composes from ones into tens and tens into hundreds', () => {
        const data = additionWithTwoCarries();
        expect(isValidPlaceValueArithmeticProblem(data)).toBe(true);
        const solution = renderToStaticMarkup(
            <PlaceValueArithmeticModelCore config={{showWrittenMethod: true}} payload={payload(data, true)} />
        );

        expect(solution).toContain('Carried values');
        expect(solution).toContain('aria-label="Carried values: H 1, T 1, O unchanged"');
        expect(solution).toContain('aria-label="Written result 906"');
    });
});
