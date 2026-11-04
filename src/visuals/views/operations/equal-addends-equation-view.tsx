import type {ArithmeticPairProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export function validateEqualAddendsEquation(data: ArithmeticPairProblem): void {
    validateProblemData('operations-equal-addends-equation', data, ['num1', 'num2', 'operation', 'answer']);
    if (data.operation !== 'addition' || data.num3 !== undefined || data.propertyLaw !== undefined
        || 'num4' in data && data.num4 !== undefined
        || ![data.num1, data.num2, data.answer].every(Number.isSafeInteger)
        || data.num1 !== data.num2 || data.answer !== data.num1 + data.num2 || data.answer % 2 !== 0) {
        throw new ViewValidationError('operations-equal-addends-equation', 'An even integer total and its two equal canonical addends are required.');
    }
}

export function EqualAddendsEquation({data, isSolutionView}: {
    data: ArithmeticPairProblem;
    isSolutionView: boolean;
}) {
    validateEqualAddendsEquation(data);
    return (
        <div className="w-[620px] max-w-full rounded-2xl bg-white p-6 font-sans">
            <div className="text-center text-2xl font-bold text-slate-800">
                Even number: <span className="font-mono">{data.answer}</span>
            </div>
            <p className="mt-4 text-center text-lg font-semibold text-slate-700">
                Write an addition equation expressing this number as two equal addends.
            </p>
            <div className={`mt-5 flex min-h-[96px] items-center justify-center rounded-xl border-2 p-4 ${
                isSolutionView ? 'border-emerald-500 bg-emerald-50' : 'border-dashed border-slate-400'
            }`} aria-label={isSolutionView ? 'Equal-addends equation' : 'Write your equation'}>
                {isSolutionView && (
                    <span className="font-mono text-3xl font-bold text-emerald-800">
                        {data.num1} + {data.num2} = {data.answer}
                    </span>
                )}
            </div>
        </div>
    );
}
