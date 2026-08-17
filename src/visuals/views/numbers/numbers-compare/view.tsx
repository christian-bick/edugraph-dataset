import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    ComparisonProblem,
    LegacyComparisonProblem,
    MultiDigitComparisonProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    displayPlaceHeading,
    getComparisonSymbol,
    isValidLegacyComparisonProblem,
    isValidMultiDigitComparisonProblem
} from './helpers.ts';
import {NumbersCompareViewConfig, NumbersCompareViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersCompareViewConfig;
    payload: ViewRenderPayload<'numbers-compare'>;
}

const VIEW_ID = 'numbers-compare';
const numberFormatter = new Intl.NumberFormat('en-US');

function isGrade4(data: ComparisonProblem): data is MultiDigitComparisonProblem {
    return 'task' in data && data.task === 'multi-digit-place-value-comparison';
}

function LegacyComparison({data, isSolutionView}: {
    data: LegacyComparisonProblem;
    isSolutionView: boolean;
}) {
    return (
        <div className="flex w-fit items-center justify-center bg-white p-5">
            <div className="flex items-center gap-5 font-mono text-[2rem]">
                <span className="min-w-[60px] text-center">{data.num1}</span>
                <span className={`flex h-[50px] w-[50px] items-center justify-center rounded border-2 border-neutral-800 font-bold text-emerald-700 ${
                    isSolutionView ? 'bg-emerald-50' : 'bg-white'
                }`}>
                    {isSolutionView ? getComparisonSymbol(data.relation) : ''}
                </span>
                <span className="min-w-[60px] text-center">{data.num2}</span>
            </div>
        </div>
    );
}

function FirstDifferenceEvidence({data}: {data: MultiDigitComparisonProblem}) {
    if (data.evidence.kind !== 'first-difference') return null;
    return (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-5">
            <div className="text-center text-xs font-bold uppercase tracking-wide text-amber-700">First differing place: {displayPlaceHeading(data.evidence.placeName)}</div>
            <div className="mt-3 grid grid-cols-[1fr_64px_1fr] items-center gap-3">
                <div className="rounded-lg border border-indigo-200 bg-white px-4 py-3 text-center">
                    <div className="font-mono text-3xl font-extrabold text-indigo-950">{data.evidence.leftDigit}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">value {numberFormatter.format(data.evidence.leftPlaceValue)}</div>
                </div>
                <div className="text-center font-mono text-3xl font-extrabold text-amber-900">{data.symbol}</div>
                <div className="rounded-lg border border-violet-200 bg-white px-4 py-3 text-center">
                    <div className="font-mono text-3xl font-extrabold text-violet-950">{data.evidence.rightDigit}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-600">value {numberFormatter.format(data.evidence.rightPlaceValue)}</div>
                </div>
            </div>
            <div className="mt-3 text-center font-semibold text-amber-950">{data.evidence.explanation}</div>
        </div>
    );
}

function Grade4Comparison({data, isSolutionView}: {
    data: MultiDigitComparisonProblem;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">Multi-digit comparison</div>
            <div className="mt-2 text-center text-xl font-bold text-slate-800">{data.prompt}</div>
            <div className="mt-6 flex items-center justify-center gap-5 rounded-xl border border-slate-200 bg-slate-50 px-6 py-6 font-mono text-4xl font-extrabold text-slate-900">
                {isSolutionView ? (
                    <span>{data.comparisonEquation}</span>
                ) : (
                    <>
                        <span>{data.leftNumeral}</span>
                        <span className="h-14 w-16 rounded-lg border-2 border-dashed border-slate-400 bg-white" />
                        <span>{data.rightNumeral}</span>
                    </>
                )}
            </div>

            {isSolutionView && data.evidence.kind === 'first-difference' && <FirstDifferenceEvidence data={data} />}
            {isSolutionView && data.evidence.kind === 'all-equal' && (
                <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-5 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">All corresponding places match</div>
                    <div className="mt-2 font-semibold text-indigo-950">{data.evidence.explanation}</div>
                </div>
            )}
            {isSolutionView && (
                <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center text-lg font-bold text-emerald-950">{data.conclusion}</div>
            )}
        </div>
    );
}

const NumbersCompareCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['num1', 'num2', 'relation']);

    if (isGrade4(data)) {
        validateProblemData(VIEW_ID, data, [
            'task',
            'leftNumeral',
            'rightNumeral',
            'symbol',
            'prompt',
            'comparisonEquation',
            'conclusion',
            'evidence'
        ]);
        if (!isValidMultiDigitComparisonProblem(data)) {
            throw new ViewValidationError(VIEW_ID, 'Expected a coherent multi-digit comparison with supplied place-value evidence.');
        }
        return <Grade4Comparison data={data} isSolutionView={isSolutionView} />;
    }

    if (!isValidLegacyComparisonProblem(data)) {
        throw new ViewValidationError(VIEW_ID, 'Expected two integers and their mathematically correct relation.');
    }
    return <LegacyComparison data={data} isSolutionView={isSolutionView} />;
};

export const NumbersCompare = withConfig(NumbersCompareViewSchema, NumbersCompareCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-compare'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersCompare payload={payload} />);
    }
};
