import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {FractionNumberLineStep} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {NumbersFractionLineViewConfig, NumbersFractionLineViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-fraction-line';
const LEFT = 54;
const RIGHT = 786;
const AXIS_Y = 158;
const DENOMINATORS = [2, 3, 4, 6, 8];

interface CoreProps {
    config: NumbersFractionLineViewConfig;
    payload: ViewRenderPayload<'numbers-fraction-line'>;
}

const validateSteps = (steps: FractionNumberLineStep[], numerator: number) => {
    if (steps.length !== numerator) {
        throw new ViewValidationError(VIEW_ID, 'The explicit unit-fraction steps must reach the target numerator.');
    }

    steps.forEach((step, index) => {
        if (!Number.isInteger(step.fromNumerator)
            || !Number.isInteger(step.toNumerator)
            || step.fromNumerator !== index
            || step.toNumerator !== index + 1) {
            throw new ViewValidationError(VIEW_ID, 'Unit-fraction steps must be consecutive from zero to the target.');
        }
    });
};

const NumbersFractionLineCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'numerator',
        'denominator',
        'unitFraction',
        'targetFraction',
        'wholeCount',
        'steps',
        'answer'
    ]);

    if (data.task !== 'locate-fraction') {
        throw new ViewValidationError(VIEW_ID, 'Expected a fraction-location task.');
    }
    if (!Number.isInteger(data.numerator) || data.numerator < 1 || data.numerator > 15) {
        throw new ViewValidationError(VIEW_ID, 'The numerator must be an integer from 1 through 15.');
    }
    if (!Number.isInteger(data.denominator) || !DENOMINATORS.includes(data.denominator)) {
        throw new ViewValidationError(VIEW_ID, 'The denominator must be 2, 3, 4, 6, or 8.');
    }
    if ((data.wholeCount !== 1 && data.wholeCount !== 2)
        || data.wholeCount !== Math.ceil(data.numerator / data.denominator)) {
        throw new ViewValidationError(VIEW_ID, 'The number-line extent must end at the whole containing the target.');
    }
    if (data.unitFraction !== `1/${data.denominator}`
        || data.targetFraction !== `${data.numerator}/${data.denominator}`
        || data.answer !== data.targetFraction) {
        throw new ViewValidationError(VIEW_ID, 'Fraction labels and answer must agree with the numerator and denominator.');
    }
    validateSteps(data.steps, data.numerator);

    const subdivisionCount = data.denominator * data.wholeCount;
    const toX = (numeratorUnits: number) => LEFT
        + (numeratorUnits / subdivisionCount) * (RIGHT - LEFT);
    const subdivisionTicks = Array.from({length: subdivisionCount + 1}, (_, index) => index);
    const wholeTicks = Array.from({length: data.wholeCount + 1}, (_, index) => index);
    const endpointX = toX(data.numerator);

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-bold text-slate-800">
                Partition each whole into {data.denominator} equal parts. Then locate{' '}
                <span className="text-blue-700">{data.targetFraction}</span>.
            </div>

            <svg
                viewBox="0 0 840 270"
                className="mt-2 h-[270px] w-full"
                role="img"
                aria-label={`Number line from zero through ${data.wholeCount}`}
            >
                <defs>
                    <marker
                        id="fraction-step-arrow"
                        markerWidth="6"
                        markerHeight="6"
                        refX="5"
                        refY="3"
                        orient="auto"
                        markerUnits="strokeWidth"
                    >
                        <path d="M 0 0 L 6 3 L 0 6 z" fill="#2563eb" />
                    </marker>
                </defs>

                {isSolutionView && (
                    <line
                        x1={LEFT}
                        y1={AXIS_Y}
                        x2={endpointX}
                        y2={AXIS_Y}
                        stroke="#bfdbfe"
                        strokeWidth="12"
                        strokeLinecap="round"
                    />
                )}
                <line x1={LEFT} y1={AXIS_Y} x2={RIGHT} y2={AXIS_Y} stroke="#334155" strokeWidth="4" />

                {(isSolutionView ? subdivisionTicks : wholeTicks.map(value => value * data.denominator)).map(index => {
                    const x = toX(index);
                    const isWhole = index % data.denominator === 0;
                    return (
                        <g key={index}>
                            <line
                                x1={x}
                                y1={AXIS_Y - (isWhole ? 16 : 10)}
                                x2={x}
                                y2={AXIS_Y + (isWhole ? 16 : 10)}
                                stroke="#334155"
                                strokeWidth={isWhole ? 3 : 2}
                            />
                            {isWhole && (
                                <text
                                    x={x}
                                    y={AXIS_Y + 43}
                                    textAnchor="middle"
                                    className="fill-slate-700 text-[18px] font-bold"
                                >
                                    {index / data.denominator}
                                </text>
                            )}
                        </g>
                    );
                })}

                {isSolutionView && data.steps.map((step, index) => {
                    const fromX = toX(step.fromNumerator);
                    const toStepX = toX(step.toNumerator);
                    const arcTop = AXIS_Y - 42 - (index % 2) * 8;
                    return (
                        <path
                            key={`${step.fromNumerator}-${step.toNumerator}`}
                            d={`M ${fromX + 2} ${AXIS_Y - 13} Q ${(fromX + toStepX) / 2} ${arcTop} ${toStepX - 3} ${AXIS_Y - 13}`}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="2.5"
                            markerEnd="url(#fraction-step-arrow)"
                        />
                    );
                })}

                {isSolutionView && (
                    <>
                        <text
                            x={(toX(0) + toX(1)) / 2}
                            y={AXIS_Y - 61}
                            textAnchor="middle"
                            className="fill-blue-700 text-[15px] font-bold"
                        >
                            {data.unitFraction} each step
                        </text>
                        <circle cx={endpointX} cy={AXIS_Y} r="10" fill="#059669" stroke="white" strokeWidth="3" />
                        <text
                            x={endpointX}
                            y={AXIS_Y - 72}
                            textAnchor="middle"
                            className="fill-emerald-700 text-[20px] font-bold"
                        >
                            {data.targetFraction}
                        </text>
                    </>
                )}
            </svg>

            <div className={`rounded-xl border-2 px-5 py-4 text-center text-lg font-semibold ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView
                    ? `Start at 0. Make ${data.numerator} equal steps of ${data.unitFraction}. The endpoint is ${data.answer}.`
                    : `Draw the equal partitions and mark ${data.targetFraction}.`}
            </div>
        </div>
    );
};

export const NumbersFractionLine = withConfig(
    NumbersFractionLineViewSchema,
    NumbersFractionLineCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'numbers-fraction-line'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<NumbersFractionLine payload={payload} />);
    }
};
