import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    DecidingPlace,
    decomposeTensAndOnes,
    findDecidingPlace,
    isValidPlaceValueComparisonProblem,
    relationSymbol,
    TensAndOnesDecomposition
} from './helpers.ts';
import {
    NumbersPlaceValueComparisonViewConfig,
    NumbersPlaceValueComparisonViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: NumbersPlaceValueComparisonViewConfig;
    payload: ViewRenderPayload<'numbers-place-value-comparison'>;
}

const VIEW_ID = 'numbers-place-value-comparison';

const placeClass = (place: 'tens' | 'ones', decidingPlace: DecidingPlace): string =>
    place === decidingPlace
        ? 'border-amber-400 bg-amber-50 text-amber-950 ring-2 ring-amber-200'
        : 'border-slate-200 bg-white text-slate-900';

function PlaceValueRow({
    label,
    number,
    decomposition,
    decidingPlace
}: {
    label: string;
    number: number;
    decomposition: TensAndOnesDecomposition;
    decidingPlace: DecidingPlace;
}) {
    const placeMarks = (count: number, place: 'tens' | 'ones') => (
        <div
            aria-label={count === 0 ? `no ${place}` : `${place} place representation`}
            className="grid max-w-[96px] grid-cols-5 place-items-center gap-1"
        >
            {count === 0
                ? <span className="col-span-5 text-sm font-semibold text-slate-500">none</span>
                : Array.from({length: count}, (_, index) => (
                    place === 'tens'
                        ? <span key={index} className="h-8 w-2.5 rounded-sm bg-indigo-500" />
                        : <span key={index} className="h-3.5 w-3.5 rounded-full bg-indigo-500" />
                ))}
        </div>
    );

    return (
        <div className="grid grid-cols-[140px_130px_130px] items-stretch gap-3">
            <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-indigo-600">{label}</span>
                <span className="mt-1 font-mono text-4xl font-extrabold text-indigo-950">{number}</span>
            </div>
            <div className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 ${placeClass('tens', decidingPlace)}`}>
                {placeMarks(decomposition.tens, 'tens')}
            </div>
            <div className={`flex flex-col items-center justify-center rounded-xl border px-4 py-3 ${placeClass('ones', decidingPlace)}`}>
                {placeMarks(decomposition.ones, 'ones')}
            </div>
        </div>
    );
}

const solutionEvidence = (decidingPlace: DecidingPlace): string => {
    if (decidingPlace === 'tens') {
        return 'The tens columns differ, so the tens decide.';
    }
    if (decidingPlace === 'ones') {
        return 'The tens columns match, so the ones decide.';
    }
    return 'Both the tens and the ones match.';
};

export const NumbersPlaceValueComparisonCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['num1', 'num2', 'relation']);
    if (!isValidPlaceValueComparisonProblem(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Expected two integers from 10 through 100 and their mathematically correct supplied relation.'
        );
    }

    const left = decomposeTensAndOnes(data.num1);
    const right = decomposeTensAndOnes(data.num2);
    const decidingPlace = findDecidingPlace(left, right);

    return (
        <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">Compare by place value</div>
            <div className="mt-2 text-center text-xl font-bold text-slate-800">Compare the tens first. If they match, compare the ones.</div>

            <div className="mt-6 grid grid-cols-[140px_130px_130px] gap-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>Numeral</span>
                <span>Tens</span>
                <span>Ones</span>
            </div>
            <div className="mt-2 space-y-3">
                <PlaceValueRow label="First number" number={data.num1} decomposition={left} decidingPlace={decidingPlace} />
                <PlaceValueRow label="Second number" number={data.num2} decomposition={right} decidingPlace={decidingPlace} />
            </div>

            <div className="mt-6 flex items-center justify-center gap-5 font-mono text-4xl font-extrabold text-slate-900">
                <span>{data.num1}</span>
                <span className={`flex h-14 w-16 items-center justify-center rounded-lg border-2 ${
                    isSolutionView
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-dashed border-slate-400 bg-white text-transparent'
                }`}>
                    {isSolutionView ? relationSymbol(data.relation) : '?'}
                </span>
                <span>{data.num2}</span>
            </div>

            {isSolutionView && (
                <div className="mt-5 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center font-semibold text-emerald-950">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        {decidingPlace === 'all' ? 'All places match' : `Deciding place: ${decidingPlace}`}
                    </div>
                    <div className="mt-2">{solutionEvidence(decidingPlace)}</div>
                </div>
            )}
        </div>
    );
};

export const NumbersPlaceValueComparison = withConfig(
    NumbersPlaceValueComparisonViewSchema,
    NumbersPlaceValueComparisonCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'numbers-place-value-comparison'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<NumbersPlaceValueComparison payload={payload} />);
        }
    };
}
