import {createRoot} from 'react-dom/client';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MultiDigitDivisionProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidMultiDigitDivisionProblem} from './helpers.ts';
import {
    OperationsDivisionAreaModelViewConfig,
    OperationsDivisionAreaModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsDivisionAreaModelViewConfig;
    payload: ViewRenderPayload<'operations-division-area-model'>;
}

const PartialQuotientSteps = ({
    data,
    isSolutionView
}: {
    data: MultiDigitDivisionProblem;
    isSolutionView: boolean;
}) => (
    <div className="overflow-hidden rounded-xl border-2 border-indigo-300 bg-white">
        <div className="grid grid-cols-[92px_1fr_1fr_126px] gap-px bg-indigo-200 text-center text-xs font-bold uppercase tracking-wide text-indigo-800">
            <div className="bg-indigo-50 px-2 py-3">Step</div>
            <div className="bg-indigo-50 px-3 py-3">Quotient chunk × divisor</div>
            <div className="bg-indigo-50 px-3 py-3">Subtract partial product</div>
            <div className="bg-indigo-50 px-2 py-3">Amount left</div>
        </div>
        {data.partialQuotients.map((step, index) => (
            <div
                className="grid grid-cols-[92px_1fr_1fr_126px] gap-px border-t border-indigo-200 bg-indigo-200 text-center"
                key={`${step.placeValue}-${index}`}
            >
                <div className="flex min-h-[92px] flex-col items-center justify-center bg-sky-50 px-2">
                    <div className="text-sm font-bold text-sky-900">{index + 1}</div>
                    <div className="mt-1 text-[0.68rem] font-semibold uppercase leading-tight tracking-wide text-sky-700">
                        {step.placeName} place
                    </div>
                </div>
                <div className={`flex min-h-[92px] flex-col items-center justify-center px-3 ${isSolutionView ? 'bg-emerald-50' : 'bg-white'}`}>
                    {isSolutionView ? (
                        <div className="mb-1 text-xs font-semibold text-emerald-700">
                            Chunk {formatStandardNumeral(step.partialQuotient)}
                        </div>
                    ) : (
                        <div className="mb-1 text-xs font-semibold text-slate-500">Choose a chunk</div>
                    )}
                    <div className={`font-mono text-sm font-bold leading-snug ${isSolutionView ? 'text-emerald-950' : 'text-slate-700'}`}>
                        {isSolutionView
                            ? step.solutionMultiplicationEquation
                            : step.questionMultiplicationEquation}
                    </div>
                </div>
                <div className={`flex min-h-[92px] items-center justify-center px-3 ${isSolutionView ? 'bg-emerald-50' : 'bg-white'}`}>
                    <div className={`font-mono text-sm font-bold leading-snug ${isSolutionView ? 'text-emerald-950' : 'text-slate-700'}`}>
                        {isSolutionView
                            ? step.solutionSubtractionEquation
                            : step.questionSubtractionEquation}
                    </div>
                </div>
                <div className={`flex min-h-[92px] items-center justify-center px-2 ${isSolutionView ? 'bg-emerald-50' : 'bg-white'}`}>
                    {isSolutionView ? (
                        <div className="font-mono text-lg font-bold text-emerald-950">
                            {formatStandardNumeral(step.remainingAfter)}
                        </div>
                    ) : (
                        <div className="h-8 w-16 rounded-md border-2 border-dashed border-indigo-300 bg-indigo-50" aria-label="Unresolved amount remaining" />
                    )}
                </div>
            </div>
        ))}
    </div>
);

const OperationsDivisionAreaModelCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-division-area-model', data, [
        'task',
        'dividend',
        'divisor',
        'quotient',
        'remainder',
        'dividendDigits',
        'divisorDigits',
        'dividendDecomposition',
        'divisorDecomposition',
        'partialQuotients',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'partialQuotientsSumEquation',
        'multiplicationCheckEquation',
        'remainderStatement',
        'explanation'
    ]);
    if (!isValidMultiDigitDivisionProblem(data)) {
        throw new ViewValidationError(
            'operations-division-area-model',
            'The operands, decompositions, partial quotients, remainder, and authored equations must agree.'
        );
    }

    return (
        <div className="w-[920px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    Place-value division area model
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{data.prompt}</div>
                <div className={`mx-auto mt-3 w-fit rounded-lg border-2 px-6 py-2 font-mono text-2xl font-bold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-700'}`}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Dividend by place value
                    </div>
                    <div className="mt-1 font-mono text-[1rem] font-bold text-indigo-950">
                        {data.dividendDecomposition.equation}
                    </div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
                        Divisor by place value
                    </div>
                    <div className="mt-1 font-mono text-[1rem] font-bold text-sky-950">
                        {data.divisorDecomposition.equation}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Equal regions show the ordered partial-quotient steps
                </div>
                <PartialQuotientSteps data={data} isSolutionView={isSolutionView} />
            </div>

            {isSolutionView ? (
                <div className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center text-emerald-950">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-lg bg-white/75 px-3 py-2">
                            <div className="text-[0.68rem] font-bold uppercase tracking-wide text-emerald-700">Add quotient chunks</div>
                            <div className="mt-1 font-mono text-sm font-bold">{data.partialQuotientsSumEquation}</div>
                        </div>
                        <div className="rounded-lg bg-white/75 px-3 py-2">
                            <div className="text-[0.68rem] font-bold uppercase tracking-wide text-emerald-700">Multiply to check</div>
                            <div className="mt-1 font-mono text-sm font-bold">{data.multiplicationCheckEquation}</div>
                        </div>
                        <div className="rounded-lg bg-white/75 px-3 py-2">
                            <div className="text-[0.68rem] font-bold uppercase tracking-wide text-emerald-700">Nonzero remainder</div>
                            <div className="mt-1 text-sm font-bold">{data.remainderStatement}</div>
                        </div>
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-relaxed text-emerald-900">
                        {data.explanation}
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-500">
                    Choose each place-value quotient chunk, multiply, subtract, and record the amount left.
                </div>
            )}
        </div>
    );
};

export const OperationsDivisionAreaModel = withConfig(
    OperationsDivisionAreaModelViewSchema,
    OperationsDivisionAreaModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-division-area-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsDivisionAreaModel payload={payload} />);
    }
};
