import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersRoundingLineViewConfig, NumbersRoundingLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const LEFT = 58;
const RIGHT = 702;
const AXIS_Y = 145;

interface CoreProps {
    config: NumbersRoundingLineViewConfig;
    payload: ViewRenderPayload<'numbers-rounding-line'>;
}

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

    const coherent = (data.roundingPlace === 10 || data.roundingPlace === 100)
        && data.upperMultiple - data.lowerMultiple === data.roundingPlace
        && data.midpoint === (data.lowerMultiple + data.upperMultiple) / 2
        && data.number > data.lowerMultiple
        && data.number < data.upperMultiple
        && data.distanceLower === data.number - data.lowerMultiple
        && data.distanceUpper === data.upperMultiple - data.number
        && data.roundedValue === Math.round(data.number / data.roundingPlace) * data.roundingPlace
        && data.direction === (data.number < data.midpoint ? 'down' : 'up')
        && data.isMidpointTie === (data.number === data.midpoint);
    if (!coherent) {
        throw new ViewValidationError('numbers-rounding-line', 'Rounding values are not coherent.');
    }

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

export const NumbersRoundingLine = withConfig(NumbersRoundingLineViewSchema, NumbersRoundingLineCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-rounding-line'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersRoundingLine payload={payload} />);
    }
};
