import {createRoot} from 'react-dom/client';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    LegacyIntegerRoundingProblem,
    MultiDigitIntegerRoundingProblem
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    displayRoundingPlace,
    getPointLabelX,
    getSourceScaleCue,
    isValidLegacyRoundingProblem,
    isValidMultiDigitRoundingProblem
} from './helpers.ts';
import {NumbersRoundingLineViewConfig, NumbersRoundingLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const LEFT = 58;
const RIGHT = 702;
const AXIS_Y = 145;

interface CoreProps {
    config: NumbersRoundingLineViewConfig;
    payload: ViewRenderPayload<'numbers-rounding-line'>;
}

interface RoundingProps<T> {
    data: T;
    isSolutionView: boolean;
}

const LegacyRoundingLine = ({
    data,
    isSolutionView
}: RoundingProps<LegacyIntegerRoundingProblem>) => {
    const toX = (value: number) => LEFT
        + ((value - data.lowerMultiple) / data.roundingPlace) * (RIGHT - LEFT);
    const numberX = toX(data.number);
    const midpointX = toX(data.midpoint);
    const roundedX = toX(data.roundedValue);
    const placeName = data.roundingPlace === 10 ? 'ten' : 'hundred';
    const ticks = Array.from({length: 11}, (_, index) => data.lowerMultiple
        + index * data.roundingPlace / 10);
    const reason = data.isMidpointTie
        ? `${data.number} is exactly at the midpoint, so it rounds up.`
        : `${data.number} is closer to ${data.roundedValue}.`;

    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                Round to the nearest {placeName}
            </div>
            <div className="mt-1 text-[1.4rem] font-bold text-slate-800">
                What is {data.number} rounded to the nearest {placeName}?
            </div>

            <svg viewBox="0 0 760 245" className="mt-3 h-[245px] w-full" role="img" aria-label={`Number line from ${data.lowerMultiple} to ${data.upperMultiple}`}>
                {isSolutionView && (
                    <line x1={numberX} y1={AXIS_Y - 3} x2={roundedX} y2={AXIS_Y - 3} stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                )}
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />
                {ticks.map((value, index) => {
                    const x = toX(value);
                    const major = index === 0 || index === 5 || index === 10;
                    return (
                        <g key={value}>
                            <line x1={x} y1={AXIS_Y - (major ? 14 : 8)} x2={x} y2={AXIS_Y + (major ? 14 : 8)} stroke="#475569" strokeWidth={major ? 3 : 2} />
                            {major && <text x={x} y={AXIS_Y + 42} textAnchor="middle" className="fill-slate-700 text-[17px] font-bold">{value}</text>}
                        </g>
                    );
                })}
                <line x1={midpointX} y1={54} x2={midpointX} y2={AXIS_Y - 16} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 5" />
                <text x={midpointX} y={43} textAnchor="middle" className="fill-amber-700 text-[15px] font-bold">midpoint {data.midpoint}</text>
                <circle cx={numberX} cy={AXIS_Y} r="11" fill="#2563eb" stroke="white" strokeWidth="4" />
                <text x={numberX} y={AXIS_Y - 28} textAnchor="middle" className="fill-blue-700 text-[21px] font-bold">{data.number}</text>
                {isSolutionView && <circle cx={roundedX} cy={AXIS_Y} r="9" fill="#059669" />}
                {isSolutionView && (
                    <g className="fill-slate-600 text-[14px] font-semibold">
                        <text x={(LEFT + numberX) / 2} y={AXIS_Y + 74} textAnchor="middle">distance {data.distanceLower}</text>
                        <text x={(numberX + RIGHT) / 2} y={AXIS_Y + 74} textAnchor="middle">distance {data.distanceUpper}</text>
                    </g>
                )}
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-xl font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-400'}`}>
                {isSolutionView ? `${data.number} → ${data.roundedValue}. ${reason}` : `${data.number} → ?`}
            </div>
        </div>
    );
};

const MultiDigitRoundingLine = ({
    data,
    isSolutionView
}: RoundingProps<MultiDigitIntegerRoundingProblem>) => {
    const toX = (value: number) => LEFT
        + ((value - data.lowerMultiple) / data.roundingPlace) * (RIGHT - LEFT);
    const numberX = toX(data.number);
    const midpointX = toX(data.midpoint);
    const roundedX = toX(data.roundedValue);
    const pointLabelX = getPointLabelX(numberX, midpointX);
    const sourceScaleCue = getSourceScaleCue(
        data.number,
        data.lowerMultiple,
        data.roundingPlace
    );
    const ticks = Array.from({length: 11}, (_, index) => ({
        value: data.lowerMultiple + index * data.roundingPlace / 10,
        x: LEFT + index * (RIGHT - LEFT) / 10
    }));
    const placeName = displayRoundingPlace(data.roundingPlaceName);

    return (
        <div className="w-[780px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">
                Rounding on a number line
            </div>
            <div className="mt-1 text-[1.35rem] font-bold text-slate-800">
                {data.prompt}
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-500">
                Nearest {placeName}
            </div>

            <svg viewBox="0 0 760 235" className="mt-1 h-[235px] w-full" role="img" aria-label={`Number line from ${formatStandardNumeral(data.lowerMultiple)} to ${formatStandardNumeral(data.upperMultiple)}, with ${formatStandardNumeral(data.number)} marked`}>
                {isSolutionView && (
                    <line x1={numberX} y1={AXIS_Y - 3} x2={roundedX} y2={AXIS_Y - 3} stroke="#10b981" strokeWidth="10" strokeLinecap="round" />
                )}
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />
                {ticks.map(({value, x}, index) => {
                    const major = index === 0 || index === 5 || index === 10;
                    return (
                        <g key={value}>
                            <line x1={x} y1={AXIS_Y - (major ? 14 : 8)} x2={x} y2={AXIS_Y + (major ? 14 : 8)} stroke="#475569" strokeWidth={major ? 3 : 2} />
                            {major && (
                                <text
                                    x={x}
                                    y={AXIS_Y + 43}
                                    textAnchor={index === 0 ? 'start' : index === 10 ? 'end' : 'middle'}
                                    className="fill-slate-700 text-[16px] font-bold"
                                >
                                    {formatStandardNumeral(value)}
                                </text>
                            )}
                        </g>
                    );
                })}
                <line x1={midpointX} y1={48} x2={midpointX} y2={AXIS_Y - 16} stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 5" />
                <text x={midpointX} y={37} textAnchor="middle" className="fill-amber-700 text-[15px] font-bold">
                    midpoint {formatStandardNumeral(data.midpoint)}
                </text>
                <line
                    x1={numberX}
                    y1={AXIS_Y - 12}
                    x2={pointLabelX}
                    y2={AXIS_Y - 38}
                    stroke="#2563eb"
                    strokeWidth="2"
                />
                <rect
                    x={pointLabelX - 64}
                    y={AXIS_Y - 65}
                    width="128"
                    height="30"
                    rx="8"
                    fill="white"
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                />
                <text x={pointLabelX} y={AXIS_Y - 44} textAnchor="middle" className="fill-blue-700 text-[17px] font-bold">
                    {formatStandardNumeral(data.number)}
                </text>
                <circle cx={numberX} cy={AXIS_Y} r="11" fill="#2563eb" stroke="white" strokeWidth="4" />
                {isSolutionView && <circle cx={roundedX} cy={AXIS_Y} r="9" fill="#059669" />}
            </svg>

            <div className="-mt-4 mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-center text-sm font-semibold text-blue-900">
                {sourceScaleCue.kind === 'between'
                    ? <>Local scale: {formatStandardNumeral(sourceScaleCue.lowerTick)} &lt; <span className="font-bold text-blue-700">{formatStandardNumeral(data.number)}</span> &lt; {formatStandardNumeral(sourceScaleCue.upperTick)}</>
                    : <>Exact scale tick: <span className="font-bold text-blue-700">{formatStandardNumeral(sourceScaleCue.tick)}</span></>}
            </div>

            {isSolutionView && (
                <div className="mb-3 grid grid-cols-2 gap-3 text-center text-sm font-semibold text-slate-700">
                    <div className="rounded-lg bg-slate-100 px-3 py-2">
                        Distance to {formatStandardNumeral(data.lowerMultiple)}: {formatStandardNumeral(data.distanceLower)}
                    </div>
                    <div className="rounded-lg bg-slate-100 px-3 py-2">
                        Distance to {formatStandardNumeral(data.upperMultiple)}: {formatStandardNumeral(data.distanceUpper)}
                    </div>
                </div>
            )}

            <div className={`rounded-xl border-2 px-5 py-3 text-center font-bold ${isSolutionView ? 'border-emerald-500 bg-emerald-50 text-emerald-950' : 'border-dashed border-slate-300 text-xl text-slate-500'}`}>
                <div className={isSolutionView ? 'text-xl' : ''}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
                {isSolutionView && (
                    <>
                        <div className="mt-2 text-base">{data.roundingStatement}</div>
                        <div className="mt-1 text-sm font-semibold text-emerald-800">
                            {data.decisionExplanation}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const NumbersRoundingLineCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('numbers-rounding-line', data, [
        'number',
        'roundingPlace',
        'lowerMultiple',
        'midpoint',
        'upperMultiple',
        'roundedValue',
        'direction',
        'distanceLower',
        'distanceUpper',
        'isMidpointTie'
    ]);

    if ('task' in data) {
        validateProblemData('numbers-rounding-line', data, [
            'task',
            'roundingPlaceName',
            'prompt',
            'questionEquation',
            'solutionEquation',
            'roundingStatement',
            'decisionExplanation'
        ]);
        if (!isValidMultiDigitRoundingProblem(data)) {
            throw new ViewValidationError(
                'numbers-rounding-line',
                'Multi-digit rounding values or authored explanations are not coherent.'
            );
        }
        return <MultiDigitRoundingLine data={data} isSolutionView={isSolutionView} />;
    }

    if (!isValidLegacyRoundingProblem(data)) {
        throw new ViewValidationError('numbers-rounding-line', 'Rounding values are not coherent.');
    }
    return <LegacyRoundingLine data={data} isSolutionView={isSolutionView} />;
};

export const NumbersRoundingLine = withConfig(NumbersRoundingLineViewSchema, NumbersRoundingLineCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-rounding-line'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersRoundingLine payload={payload} />);
    }
};
