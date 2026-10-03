import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalRoundingProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    formatTenThousandths,
    LINE_LEFT,
    LINE_RIGHT,
    linePosition,
    placeFractionDigits,
    roundingExplanation,
    sourceBadgeX,
    validDecimalRounding
} from './helpers.ts';
import type {NumbersDecimalRoundingLineViewConfig} from './spec.ts';
import {NumbersDecimalRoundingLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-rounding-line';
const AXIS_Y = 150;

interface CoreProps {
    config: NumbersDecimalRoundingLineViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

function RoundingLine({data, isSolutionView}: {data: DecimalRoundingProblem; isSolutionView: boolean}) {
    const sourceX = linePosition(data, data.inputInTenThousandths);
    const midpointX = linePosition(data, data.midpointInTenThousandths);
    const chosenX = linePosition(data, data.roundedInTenThousandths);
    const badgeX = sourceBadgeX(sourceX);
    const precision = placeFractionDigits(data.roundingPlace);
    const input = formatTenThousandths(data.inputInTenThousandths);
    const lower = formatTenThousandths(data.lowerCandidateInTenThousandths, precision);
    const upper = formatTenThousandths(data.upperCandidateInTenThousandths, precision);
    const midpoint = formatTenThousandths(data.midpointInTenThousandths);

    return <svg viewBox="0 0 800 245" className="mt-4 w-full" role="img"
        aria-label={`Number line from ${lower} to ${upper}, with ${input} marked and midpoint ${midpoint}`}>
        <line x1={LINE_LEFT} y1={AXIS_Y} x2={LINE_RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />
        {Array.from({length: 11}, (_, index) => {
            const x = LINE_LEFT + index * (LINE_RIGHT - LINE_LEFT) / 10;
            return <line key={index} x1={x} y1={AXIS_Y - (index % 5 === 0 ? 13 : 7)}
                x2={x} y2={AXIS_Y + (index % 5 === 0 ? 13 : 7)}
                stroke="#475569" strokeWidth={index % 5 === 0 ? 3 : 2} />;
        })}
        <text x={LINE_LEFT + 4} y="190" textAnchor="start"
            className={`${isSolutionView && data.direction === 'down' ? 'fill-emerald-700' : 'fill-slate-800'} text-[18px] font-bold`}>{lower}</text>
        <text x={LINE_RIGHT - 4} y="190" textAnchor="end"
            className={`${isSolutionView && data.direction === 'up' ? 'fill-emerald-700' : 'fill-slate-800'} text-[18px] font-bold`}>{upper}</text>
        <line x1={midpointX} y1={AXIS_Y + 16} x2={midpointX} y2="199" stroke="#d97706" strokeWidth="2" strokeDasharray="5 4" />
        <text x={midpointX} y="225" textAnchor="middle" className="fill-amber-800 text-[16px] font-semibold">midpoint {midpoint}</text>
        {isSolutionView && <>
            <line x1={sourceX} y1={AXIS_Y - 2} x2={chosenX} y2={AXIS_Y - 2}
                stroke="#059669" strokeWidth="8" strokeLinecap="round" />
            <circle cx={chosenX} cy={AXIS_Y} r="10" fill="#059669" stroke="white" strokeWidth="3" />
        </>}
        <line x1={badgeX} y1="64" x2={sourceX} y2={AXIS_Y - 13} stroke="#2563eb" strokeWidth="2" />
        <rect x={badgeX - 91} y="25" width="182" height="38" rx="9" fill="white" stroke="#93c5fd" strokeWidth="2" />
        <text x={badgeX} y="50" textAnchor="middle" className="fill-blue-800 text-[20px] font-bold">{input}</text>
        <circle cx={sourceX} cy={AXIS_Y} r="7" fill="#2563eb" stroke="white" strokeWidth="2" />
    </svg>;
}

export const NumbersDecimalRoundingLineCore = ({payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'kind', 'inputInTenThousandths', 'roundingPlace', 'lowerCandidateInTenThousandths',
        'upperCandidateInTenThousandths', 'midpointInTenThousandths', 'roundedInTenThousandths',
        'direction', 'isMidpointTie', 'distanceToLowerInTenThousandths', 'distanceToUpperInTenThousandths'
    ]);
    if (!validDecimalRounding(data)) {
        throw new ViewValidationError(VIEW_ID, 'Decimal rounding candidates, distances, or selected endpoint are inconsistent.');
    }
    const input = formatTenThousandths(data.inputInTenThousandths);
    const rounded = formatTenThousandths(data.roundedInTenThousandths, placeFractionDigits(data.roundingPlace));

    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 860, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-sky-700">Decimal rounding</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Round {input} to the nearest {data.roundingPlace.name.slice(0, -1)}.</h1>
        <p className="mt-2 text-base text-slate-600">Use the neighboring candidates and midpoint on the number line.</p>
        <RoundingLine data={data} isSolutionView={isSolutionView} />
        <div className={`mt-2 rounded-xl border-2 px-5 py-4 text-center ${isSolutionView
            ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-700'}`}>
            <div className="font-mono text-xl font-bold">{input} → {isSolutionView ? rounded : '___'}</div>
            {isSolutionView && <p className="mt-2 text-base font-semibold">{roundingExplanation(data)}</p>}
        </div>
    </main>;
};

export const NumbersDecimalRoundingLine = withConfig(NumbersDecimalRoundingLineViewSchema, NumbersDecimalRoundingLineCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<NumbersDecimalRoundingLine payload={payload} />);
};
