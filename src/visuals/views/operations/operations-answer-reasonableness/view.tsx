import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ArithmeticOperation} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    OperationsAnswerReasonablenessViewConfig,
    OperationsAnswerReasonablenessViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsAnswerReasonablenessViewConfig;
    payload: ViewRenderPayload<'operations-answer-reasonableness'>;
}

const symbols: Record<ArithmeticOperation, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷'
};

const OperationsAnswerReasonablenessCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-answer-reasonableness', data, [
        'num1',
        'num2',
        'operation',
        'roundedNum1',
        'roundedNum2',
        'roundingPlace',
        'exactAnswer',
        'estimatedAnswer',
        'proposedAnswer',
        'estimateDifference',
        'tolerance',
        'isReasonable'
    ]);

    if (!Object.hasOwn(symbols, data.operation) || data.roundingPlace !== 10) {
        throw new ViewValidationError(
            'operations-answer-reasonableness',
            'Unsupported operation or rounding place.'
        );
    }
    const values = [
        data.num1,
        data.num2,
        data.roundedNum1,
        data.roundedNum2,
        data.exactAnswer,
        data.estimatedAnswer,
        data.proposedAnswer,
        data.estimateDifference,
        data.tolerance
    ];
    if (values.some(value => !Number.isInteger(value) || value < 0 || value > 1000)) {
        throw new ViewValidationError(
            'operations-answer-reasonableness',
            'This layout requires whole-number values from 0 through 1000.'
        );
    }
    if (data.estimateDifference !== Math.abs(data.proposedAnswer - data.estimatedAnswer)
        || data.isReasonable !== (data.estimateDifference <= data.tolerance)) {
        throw new ViewValidationError(
            'operations-answer-reasonableness',
            'The proposed answer and estimate do not support the supplied verdict.'
        );
    }

    const symbol = symbols[data.operation];
    const choiceClass = (reasonable: boolean) => {
        const base = 'flex h-[58px] w-[190px] items-center justify-center rounded-xl border-2 text-lg font-bold';
        return isSolutionView && data.isReasonable === reasonable
            ? `${base} border-emerald-600 bg-emerald-50 text-emerald-700`
            : `${base} border-slate-300 bg-white text-slate-600`;
    };

    return (
        <div className="w-[720px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                Answer reasonableness
            </div>
            <div className="mt-1 text-xl font-bold text-slate-800">
                Does the estimate support the proposed answer?
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Original calculation</div>
                    <div className="mt-3 font-mono text-[2rem] font-bold text-slate-800">
                        {data.num1} {symbol} {data.num2} = {isSolutionView ? data.exactAnswer : '?'}
                    </div>
                </div>
                <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Proposed answer</div>
                    <div className="mt-3 font-mono text-[2rem] font-bold text-amber-900">
                        {data.proposedAnswer}
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-5">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Round to the nearest ten</div>
                <div className="mt-3 flex items-center justify-center gap-6 font-mono text-[1.65rem] font-bold text-slate-700">
                    <span>{data.num1} → {data.roundedNum1}</span>
                    <span>{data.num2} → {data.roundedNum2}</span>
                </div>
                <div className="mt-4 border-t border-sky-200 pt-4 text-center font-mono text-[1.9rem] font-bold text-sky-900">
                    {data.roundedNum1} {symbol} {data.roundedNum2} ≈ {data.estimatedAnswer}
                </div>
            </div>

            <div className="mt-5 flex justify-center gap-5">
                <div className={choiceClass(true)}>Reasonable</div>
                <div className={choiceClass(false)}>Not reasonable</div>
            </div>

            {isSolutionView && (
                <div className="mt-5 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 px-5 py-4 text-center text-lg font-semibold text-emerald-900">
                    {data.proposedAnswer} is {data.isReasonable ? 'close to' : 'too far from'} the estimate of {data.estimatedAnswer}.
                </div>
            )}
        </div>
    );
};

export const OperationsAnswerReasonableness = withConfig(
    OperationsAnswerReasonablenessViewSchema,
    OperationsAnswerReasonablenessCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-answer-reasonableness'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsAnswerReasonableness payload={payload} />);
    }
};
