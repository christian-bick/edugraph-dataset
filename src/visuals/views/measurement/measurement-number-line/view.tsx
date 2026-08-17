import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    getMeasurementPointLabelX,
    isValidMeasurementNumberLineProblem
} from './helpers.ts';
import {
    MeasurementNumberLineViewConfig,
    MeasurementNumberLineViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measurement-number-line';
const LEFT = 62;
const RIGHT = 778;
const AXIS_Y = 150;

interface CoreProps {
    config: MeasurementNumberLineViewConfig;
    payload: ViewRenderPayload<'measurement-number-line'>;
}

const titleCase = (value: string): string => value
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const MeasurementNumberLineCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'measurementKind',
        'numberKind',
        'unit',
        'tickCount',
        'ticks',
        'labeledTickIndices',
        'start',
        'end',
        'interval',
        'target',
        'prompt',
        'scaleStatement',
        'answerStatement',
        'explanation'
    ]);
    if (!isValidMeasurementNumberLineProblem(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Expected a coherent fraction or decimal measurement scale with one interior target.'
        );
    }

    const toX = (index: number): number => LEFT
        + index / data.tickCount * (RIGHT - LEFT);
    const targetX = toX(data.target.index);
    const targetLabelX = getMeasurementPointLabelX(targetX, LEFT, RIGHT);

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.09)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                    Plot a measurement
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.1em]">
                    <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-800">
                        {titleCase(data.measurementKind)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                        {titleCase(data.numberKind)}
                    </span>
                </div>
            </div>

            <div className="mt-4 text-center text-[1.5rem] font-extrabold leading-relaxed text-slate-900">
                {data.prompt}
            </div>
            <div className="mt-2 rounded-lg bg-blue-50 px-4 py-3 text-center text-base font-semibold text-blue-950">
                {data.scaleStatement}
            </div>

            <svg
                viewBox="0 0 840 300"
                className="mt-1 h-[300px] w-full"
                role="img"
                aria-label={`Equal-interval number line in ${data.unit.plural}`}
            >
                <line
                    x1={LEFT}
                    y1={AXIS_Y}
                    x2={RIGHT}
                    y2={AXIS_Y}
                    stroke="#334155"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                {data.ticks.map(tick => {
                    const x = toX(tick.index);
                    const labeled = data.labeledTickIndices.includes(tick.index);
                    const endpoint = tick.index === 0 || tick.index === data.tickCount;
                    return (
                        <g key={tick.index}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (labeled ? 16 : 10)}
                                x2={x}
                                y2={AXIS_Y + (labeled ? 16 : 10)}
                                stroke="#475569"
                                strokeWidth={labeled ? 3 : 2}
                            />
                            {labeled && (
                                <text
                                    x={x}
                                    y={AXIS_Y + 44}
                                    textAnchor={endpoint ? tick.index === 0 ? 'start' : 'end' : 'middle'}
                                    className="fill-slate-800 text-[18px] font-bold"
                                >
                                    {tick.value.display}
                                </text>
                            )}
                        </g>
                    );
                })}

                <text
                    x={(LEFT + RIGHT) / 2}
                    y={AXIS_Y + 86}
                    textAnchor="middle"
                    className="fill-slate-600 text-[16px] font-semibold"
                >
                    Scale in {data.unit.plural} ({data.unit.symbol})
                </text>

                {isSolutionView && (
                    <>
                        <line
                            x1={targetX}
                            y1={AXIS_Y - 13}
                            x2={targetLabelX}
                            y2={67}
                            stroke="#2563eb"
                            strokeWidth="2.5"
                        />
                        <rect
                            x={targetLabelX - 125}
                            y={34}
                            width="250"
                            height="40"
                            rx="10"
                            fill="white"
                            stroke="#60a5fa"
                            strokeWidth="2"
                        />
                        <text
                            x={targetLabelX}
                            y={61}
                            textAnchor="middle"
                            className="fill-blue-800 text-[18px] font-extrabold"
                        >
                            {data.target.value.quantityText}
                        </text>
                        <circle cx={targetX} cy={AXIS_Y} r="12" fill="#2563eb" stroke="white" strokeWidth="4" />
                    </>
                )}
            </svg>

            {isSolutionView ? (
                <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-center text-emerald-950">
                    <div className="text-xl font-extrabold">{data.answerStatement}</div>
                    <div className="mt-2 text-base font-semibold leading-relaxed text-emerald-900">
                        {data.explanation}
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-center text-lg font-bold text-slate-500">
                    Mark the requested measurement on the response line.
                </div>
            )}
        </div>
    );
};

export const MeasurementNumberLineView = withConfig(
    MeasurementNumberLineViewSchema,
    MeasurementNumberLineCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-number-line'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementNumberLineView payload={payload} />);
};
