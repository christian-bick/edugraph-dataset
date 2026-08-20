import {ArithmeticTripleProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type ArithmeticLawUnknown = 'num1' | 'num2' | 'num3' | 'answer' | 'solution';

const symbols = {
    addition: '+',
    multiplication: '×'
} as const;

const lawNames = {
    commutative: 'Commutative property',
    associative: 'Associative property',
    distributive: 'Distributive property'
} as const;

export function validateArithmeticLaw(data: ArithmeticTripleProblem): void {
    if (!data.propertyLaw || !['addition', 'multiplication'].includes(data.operation)) {
        throw new ViewValidationError('arithmetic-law', 'A property-law presentation requires addition or multiplication triple data.');
    }
    if (!Number.isInteger(data.num1)
        || !Number.isInteger(data.num2)
        || !Number.isInteger(data.num3)
        || !Number.isInteger(data.answer)) {
        throw new ViewValidationError('arithmetic-law', 'Property-law operands and answer must be integers.');
    }
    if (data.propertyLaw === 'distributive') {
        if (data.operation !== 'multiplication'
            || data.combinedFactor !== data.num2 + data.num3
            || data.partialProducts?.length !== 2
            || data.partialProducts[0] !== data.num1 * data.num2
            || data.partialProducts[1] !== data.num1 * data.num3
            || data.answer !== data.partialProducts[0] + data.partialProducts[1]) {
            throw new ViewValidationError('arithmetic-law', 'Distributive data must preserve the sum, both partial products, and their total.');
        }
        return;
    }
    const expected = data.operation === 'addition'
        ? data.num1 + data.num2 + data.num3
        : data.num1 * data.num2 * data.num3;
    if (data.answer !== expected) {
        throw new ViewValidationError('arithmetic-law', 'Commutative and associative data must preserve the three-operand result.');
    }
}

export function arithmeticLawEquations(
    data: ArithmeticTripleProblem,
    unknown: ArithmeticLawUnknown,
    revealUnknown: boolean
): {primary: string; witness: string} {
    validateArithmeticLaw(data);
    const hidden = (part: ArithmeticLawUnknown, value: number): string =>
        !revealUnknown && (unknown === part || unknown === 'solution' && part === 'answer')
            ? '□'
            : String(value);
    const first = hidden('num1', data.num1);
    const second = hidden('num2', data.num2);
    const third = hidden('num3', data.num3);
    const answer = hidden('answer', data.answer);

    if (data.propertyLaw === 'distributive') {
        const [leftProduct, rightProduct] = data.partialProducts!;
        const leftPartial = !revealUnknown && (unknown === 'num1' || unknown === 'num2')
            ? '□'
            : String(leftProduct);
        const rightPartial = !revealUnknown && (unknown === 'num1' || unknown === 'num3')
            ? '□'
            : String(rightProduct);
        return {
            primary: `${first} × (${second} + ${third}) = ${answer}`,
            witness: `${first} × ${second} + ${first} × ${third} = ${leftPartial} + ${rightPartial} = ${answer}`
        };
    }

    const symbol = symbols[data.operation as keyof typeof symbols];
    if (data.propertyLaw === 'commutative') {
        return {
            primary: `${first} ${symbol} ${second} ${symbol} ${third} = ${answer}`,
            witness: `${second} ${symbol} ${first} ${symbol} ${third} = ${answer}`
        };
    }
    return {
        primary: `(${first} ${symbol} ${second}) ${symbol} ${third} = ${answer}`,
        witness: `${first} ${symbol} (${second} ${symbol} ${third}) = ${answer}`
    };
}

export function ArithmeticLawExercise({
    data,
    unknown,
    isSolutionView
}: {
    data: ArithmeticTripleProblem;
    unknown: ArithmeticLawUnknown;
    isSolutionView: boolean;
}) {
    const equations = arithmeticLawEquations(data, unknown, isSolutionView);
    const solvedValue = unknown === 'num1'
        ? data.num1
        : unknown === 'num2'
            ? data.num2
            : unknown === 'num3'
                ? data.num3
                : data.answer;
    return (
        <div className="w-[650px] max-w-full rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.07)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.15em] text-violet-700">
                {lawNames[data.propertyLaw!]}
            </div>
            <div className="mt-2 text-center text-lg font-bold text-slate-700">
                Use the property relationship to find the missing value.
            </div>
            <div className="mt-5 rounded-xl border-2 border-slate-300 bg-white px-5 py-4 text-center font-mono text-2xl font-extrabold text-slate-800">
                {equations.primary}
            </div>
            <div className="mt-3 rounded-xl border-2 border-violet-200 bg-violet-50 px-5 py-4 text-center font-mono text-xl font-bold text-violet-900">
                {equations.witness}
            </div>
            <div className={`mt-3 rounded-xl border-2 px-5 py-3 text-center font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? <><span>The missing value is </span><span className="font-mono text-lg font-extrabold text-emerald-700">{solvedValue}</span><span>. {lawNames[data.propertyLaw!]} preserves the value in both forms.</span></>
                    : 'Keep the same unknown in both equivalent forms.'}
            </div>
        </div>
    );
}
