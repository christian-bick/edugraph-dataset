import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import type {ArithmeticPairedPatternSequence, CoordinatePatternPairsProblem} from '../../../types/problems.ts';
import {validateProblemData} from '../../helpers/validation.ts';
import {
    coordinateGridScale,
    coordinatePointPosition,
    GRID_BOTTOM,
    GRID_LEFT,
    GRID_SIZE,
    GRID_TOP,
    markerLabelPosition,
    validateCoordinatePattern
} from './coordinate-pattern-helpers.ts';

export type CoordinatePatternViewId = 'coordinate-plot-pattern-pairs' | 'coordinate-form-pattern-pairs';
export type CoordinatePatternMode = 'plot' | 'form';

interface Props {
    mode: CoordinatePatternMode;
    payload: ViewRenderPayload<CoordinatePatternViewId>;
    viewId: CoordinatePatternViewId;
}

function RuleSummary({name, role, sequence}: {
    name: string;
    role: string;
    sequence: ArithmeticPairedPatternSequence;
}) {
    return <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="text-sm font-bold text-indigo-800">{name} → {role}</div>
        <div className="mt-1 text-base text-slate-900">Start <strong>{sequence.start}</strong>; add <strong>{sequence.rule.increment}</strong> each step.</div>
    </div>;
}

function SourcePatterns({data}: {data: CoordinatePatternPairsProblem}) {
    const columns = {gridTemplateColumns: `minmax(95px, 1.4fr) repeat(${data.first.terms.length}, minmax(42px, 1fr))`};
    return <div>
        <div className="grid grid-cols-2 gap-3">
            <RuleSummary name="Pattern A" role="first / x" sequence={data.first} />
            <RuleSummary name="Pattern B" role="second / y" sequence={data.second} />
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 text-center">
            <div className="grid bg-slate-800 text-sm font-bold text-white" style={columns}>
                <div className="px-1 py-2">Position</div>
                {data.points.map((_, index) => <div key={index} className="border-l border-slate-600 px-1 py-2">{index}</div>)}
            </div>
            {([
                ['A / x', data.first.terms],
                ['B / y', data.second.terms]
            ] as const).map(([name, terms]) => <div key={name} className="grid border-t border-slate-300" style={columns}>
                <div className="bg-slate-100 px-1 py-2 text-sm font-bold text-slate-700">{name}</div>
                {terms.map((term, index) => <div key={index} className="border-l border-slate-200 bg-white px-1 py-2 font-mono text-base font-bold text-slate-900">{term}</div>)}
            </div>)}
        </div>
    </div>;
}

const markerNames = 'ABCDEFGH';

function GivenPairs({data}: {data: CoordinatePatternPairsProblem}) {
    return <div className="mt-4">
        <div className="text-sm font-bold text-slate-700">Given ordered pairs to plot</div>
        <div className="mt-2 flex flex-wrap gap-2">
            {data.points.map((point, index) => <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-base font-semibold text-slate-900">
                {markerNames[index]} ({point.x}, {point.y})
            </div>)}
        </div>
    </div>;
}

function CoordinateGrid({data, isSolutionView}: {
    data: CoordinatePatternPairsProblem;
    isSolutionView: boolean;
}) {
    const {maximum, majorStep} = coordinateGridScale(data);
    const ticks = Array.from({length: maximum + 1}, (_, index) => index);
    const right = GRID_LEFT + GRID_SIZE;
    return <svg viewBox="0 0 420 420" className="h-[420px] w-[420px]" role="img"
        aria-label={isSolutionView
            ? 'Coordinate grid with every given point plotted and labeled'
            : 'Empty coordinate grid with horizontal x-axis and vertical y-axis'}>
        <rect x={GRID_LEFT} y={GRID_TOP} width={GRID_SIZE} height={GRID_SIZE} fill="#ffffff" />
        {ticks.map(tick => {
            const offset = tick * GRID_SIZE / maximum;
            const major = tick % majorStep === 0;
            return <g key={tick}>
                <line x1={GRID_LEFT + offset} y1={GRID_TOP} x2={GRID_LEFT + offset} y2={GRID_BOTTOM}
                    stroke={major ? '#cbd5e1' : '#e2e8f0'} strokeWidth={major ? 1.5 : 0.8} />
                <line x1={GRID_LEFT} y1={GRID_BOTTOM - offset} x2={right} y2={GRID_BOTTOM - offset}
                    stroke={major ? '#cbd5e1' : '#e2e8f0'} strokeWidth={major ? 1.5 : 0.8} />
                {major && tick > 0 && <>
                    <text x={GRID_LEFT + offset} y={GRID_BOTTOM + 19} textAnchor="middle" className="fill-slate-700 text-[12px] font-semibold">{tick}</text>
                    <text x={GRID_LEFT - 10} y={GRID_BOTTOM - offset + 4} textAnchor="end" className="fill-slate-700 text-[12px] font-semibold">{tick}</text>
                </>}
            </g>;
        })}
        <line x1={GRID_LEFT} y1={GRID_BOTTOM} x2={right + 4} y2={GRID_BOTTOM} stroke="#334155" strokeWidth="2.5" />
        <line x1={GRID_LEFT} y1={GRID_BOTTOM} x2={GRID_LEFT} y2={GRID_TOP - 4} stroke="#334155" strokeWidth="2.5" />
        <text x={GRID_LEFT - 10} y={GRID_BOTTOM + 18} textAnchor="end" className="fill-slate-800 text-[13px] font-bold">0</text>
        <text x={right + 8} y={GRID_BOTTOM + 5} className="fill-indigo-700 text-[16px] font-bold">x</text>
        <text x={GRID_LEFT - 4} y={GRID_TOP - 9} className="fill-indigo-700 text-[16px] font-bold">y</text>
        {isSolutionView && data.points.map((point, index) => {
            const position = coordinatePointPosition(point, maximum);
            const label = markerLabelPosition(point, maximum);
            return <g key={index}>
                <circle cx={position.x} cy={position.y} r="8" fill="#ffffff" />
                <circle cx={position.x} cy={position.y} r="5.5" fill="#4f46e5" stroke="#312e81" strokeWidth="1.5" />
                <text x={label.x} y={label.y} textAnchor={label.anchor} className="fill-indigo-900 text-[13px] font-bold">{markerNames[index]}</text>
            </g>;
        })}
    </svg>;
}

function PlotTask({data, isSolutionView}: {data: CoordinatePatternPairsProblem; isSolutionView: boolean}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm" style={{width: 1060, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Graph pattern pairs</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Plot the ordered pairs</h1>
        <p className="mt-2 text-base">Use Pattern A for the horizontal x-coordinate and Pattern B for the vertical y-coordinate. Mark each given pair on the grid.</p>
        <div className="mt-4 grid grid-cols-[1fr_420px] items-start gap-5">
            <div>
                <SourcePatterns data={data} />
                <GivenPairs data={data} />
            </div>
            <CoordinateGrid data={data} isSolutionView={isSolutionView} />
        </div>
    </main>;
}

function FormTask({data, isSolutionView}: {data: CoordinatePatternPairsProblem; isSolutionView: boolean}) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800 shadow-sm" style={{width: 760, maxWidth: '95vw'}}>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Pattern pairs</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Write ordered pairs</h1>
        <p className="mt-3 text-lg">For each position, write an ordered pair. Pattern A gives the first (x) component; Pattern B gives the second (y) component.</p>
        <div className="mt-5"><SourcePatterns data={data} /></div>
        <div className="mt-5 grid grid-cols-3 gap-3">
            {data.points.map((point, index) => <div key={index} className={`rounded-xl border-2 px-3 py-3 text-center font-mono text-base font-bold ${isSolutionView ? 'border-emerald-300 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 bg-white text-slate-500'}`}>
                {index}: {isSolutionView ? `(${point.x}, ${point.y})` : '( __ , __ )'}
            </div>)}
        </div>
    </main>;
}

/** The leaf fixes whether the learner plots or forms the canonical pairs. */
export function CoordinatePatternView({mode, payload, viewId}: Props) {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, ['kind', 'first', 'second', 'points']);
    validateCoordinatePattern(viewId, data);
    return mode === 'plot'
        ? <PlotTask data={data} isSolutionView={isSolutionView} />
        : <FormTask data={data} isSolutionView={isSolutionView} />;
}
