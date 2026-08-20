import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {AngleArithmeticProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {counterclockwiseAngleArc, pointOnAngleCircle} from './helpers.ts';
import {
    AngleArithmeticTask,
    AngleArithmeticViewModel,
    buildAngleArithmeticPresentation,
    isValidAngleArithmeticProblem,
    resolveAngleArithmeticTask
} from './angle-arithmetic-helpers.ts';

interface AngleArithmeticViewProps {
    payload: RenderPayload<AbstractProblem<AngleArithmeticProblem>>;
    task: AngleArithmeticTask;
    viewId: string;
}

type MeasureRole = 'left-component' | 'right-component' | 'whole';

const CENTER_X = 300;
const CENTER_Y = 225;
const RAY_RADIUS = 205;

const keepEndpointLabelVisible = ({x, y}: {x: number; y: number}) => ({
    x: Math.min(630, Math.max(20, x)),
    y: Math.min(278, Math.max(22, y + 6))
});

const roleValue = (
    data: AngleArithmeticViewModel,
    role: MeasureRole,
    isSolutionView: boolean
): string => {
    const hidden = data.task === 'solve-unknown-angle'
        && data.unknownRole === role
        && !isSolutionView;
    if (hidden) return '?°';
    if (role === 'left-component') return `${data.leftMeasure}°`;
    if (role === 'right-component') return `${data.rightMeasure}°`;
    return `${data.wholeMeasure}°`;
};

const accessibleDiagramName = (
    data: AngleArithmeticViewModel,
    isSolutionView: boolean
): string => {
    const left = roleValue(data, 'left-component', isSolutionView);
    const right = roleValue(data, 'right-component', isSolutionView);
    const whole = roleValue(data, 'whole', isSolutionView);
    return `Adjacent angles AOB (${left}) and BOC (${right}) form whole angle AOC (${whole}); component arcs do not overlap`;
};

function MeasurePill({x, y, value, colors}: {
    x: number;
    y: number;
    value: string;
    colors: {border: string; text: string};
}) {
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect x="-31" y="-19" width="62" height="36" rx="15" fill="white" stroke={colors.border} strokeWidth="3" />
            <text y="5" textAnchor="middle" fill={colors.text} className="text-[17px] font-extrabold">{value}</text>
        </g>
    );
}

function AnglePartitionDiagram({data, isSolutionView}: {
    data: AngleArithmeticViewModel;
    isSolutionView: boolean;
}) {
    const startEnd = pointOnAngleCircle(CENTER_X, CENTER_Y, RAY_RADIUS, data.geometry.startDegrees);
    const dividerEnd = pointOnAngleCircle(CENTER_X, CENTER_Y, RAY_RADIUS, data.geometry.dividerDegrees);
    const wholeEnd = pointOnAngleCircle(CENTER_X, CENTER_Y, RAY_RADIUS, data.geometry.endDegrees);
    const startLabel = keepEndpointLabelVisible(pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS + 28,
        data.geometry.startDegrees
    ));
    const dividerLabel = keepEndpointLabelVisible(pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS + 28,
        data.geometry.dividerDegrees
    ));
    const wholeLabel = keepEndpointLabelVisible(pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        RAY_RADIUS + 28,
        data.geometry.endDegrees
    ));
    const leftMeasurePosition = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        112,
        data.geometry.leftSweepDegrees / 2
    );
    const rightMeasurePosition = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        112,
        data.geometry.dividerDegrees + data.geometry.rightSweepDegrees / 2
    );
    const wholeMeasurePosition = pointOnAngleCircle(
        CENTER_X,
        CENTER_Y,
        168,
        data.geometry.wholeSweepDegrees / 2
    );

    return (
        <svg
            viewBox="0 0 650 330"
            className="h-[330px] w-[650px]"
            aria-label={accessibleDiagramName(data, isSolutionView)}
        >
            <defs>
                <marker id="arithmetic-ray-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill="#334155" />
                </marker>
            </defs>
            {[startEnd, dividerEnd, wholeEnd].map((point, index) => (
                <line
                    key={index}
                    x1={CENTER_X}
                    y1={CENTER_Y}
                    x2={point.x}
                    y2={point.y}
                    stroke="#334155"
                    strokeWidth="5"
                    markerEnd="url(#arithmetic-ray-arrow)"
                />
            ))}
            <path
                d={counterclockwiseAngleArc(
                    CENTER_X,
                    CENTER_Y,
                    78,
                    data.geometry.startDegrees,
                    data.geometry.dividerDegrees
                )}
                fill="none"
                stroke="#0d9488"
                strokeWidth="11"
                strokeLinecap="round"
            />
            <path
                d={counterclockwiseAngleArc(
                    CENTER_X,
                    CENTER_Y,
                    78,
                    data.geometry.dividerDegrees,
                    data.geometry.endDegrees
                )}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="11"
                strokeLinecap="butt"
            />
            <path
                d={counterclockwiseAngleArc(
                    CENTER_X,
                    CENTER_Y,
                    142,
                    data.geometry.startDegrees,
                    data.geometry.endDegrees
                )}
                fill="none"
                stroke="#d97706"
                strokeWidth="7"
                strokeLinecap="round"
            />
            <circle cx={CENTER_X} cy={CENTER_Y} r="7" fill="#1e293b" />
            <text x={CENTER_X - 17} y={CENTER_Y + 29} className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.vertexLabel}</text>
            <text x={startLabel.x} y={startLabel.y} textAnchor="middle" className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.startPointLabel}</text>
            <text x={dividerLabel.x} y={dividerLabel.y} textAnchor="middle" className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.dividerPointLabel}</text>
            <text x={wholeLabel.x} y={wholeLabel.y} textAnchor="middle" className="fill-slate-800 text-[18px] font-extrabold">{data.geometry.endPointLabel}</text>
            <MeasurePill
                x={leftMeasurePosition.x}
                y={leftMeasurePosition.y}
                value={roleValue(data, 'left-component', isSolutionView)}
                colors={{border: '#0d9488', text: '#0f766e'}}
            />
            <MeasurePill
                x={rightMeasurePosition.x}
                y={rightMeasurePosition.y}
                value={roleValue(data, 'right-component', isSolutionView)}
                colors={{border: '#4f46e5', text: '#4338ca'}}
            />
            <MeasurePill
                x={wholeMeasurePosition.x}
                y={wholeMeasurePosition.y}
                value={roleValue(data, 'whole', isSolutionView)}
                colors={{border: '#d97706', text: '#b45309'}}
            />
            <g transform="translate(325 304)">
                <circle cx="-205" r="6" fill="#0d9488" />
                <text x="-193" y="5" className="fill-slate-600 text-[13px] font-bold">AOB</text>
                <circle cx="-85" r="6" fill="#4f46e5" />
                <text x="-73" y="5" className="fill-slate-600 text-[13px] font-bold">BOC</text>
                <circle cx="35" r="6" fill="#d97706" />
                <text x="47" y="5" className="fill-slate-600 text-[13px] font-bold">AOC (whole)</text>
            </g>
        </svg>
    );
}

function QuestionEquations({data}: {data: AngleArithmeticViewModel}) {
    if (data.task === 'explain-angle-addition') {
        return (
            <div className="flex min-h-[58px] items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-3 text-center font-semibold text-slate-500">
                Write an explanation using the adjacent-angle diagram.
            </div>
        );
    }
    const showWholePart = data.task === 'solve-unknown-angle'
        && data.unknownRole !== 'whole';
    return (
        <div className={showWholePart ? 'grid grid-cols-2 gap-3' : ''}>
            {showWholePart && (
                <div className="flex min-h-[58px] items-center justify-center rounded-xl border-2 border-sky-200 bg-sky-50 px-3 text-center font-mono text-[0.98rem] font-extrabold text-sky-900">
                    {data.wholePartEquation}
                </div>
            )}
            <div className="flex min-h-[58px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-3 text-center font-mono text-[1.02rem] font-extrabold text-slate-700">
                {data.questionEquation}
            </div>
        </div>
    );
}

export const AngleArithmeticView = ({payload, task: requestedTask, viewId}: AngleArithmeticViewProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData(viewId, problem.data, [
        'operation',
        'geometry',
        'leftMeasure',
        'rightMeasure',
        'wholeMeasure',
        'relationStatement'
    ]);
    const data = problem.data;
    if (!isValidAngleArithmeticProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'The adjacent component arcs and whole-part measures must agree exactly.'
        );
    }
    const task = resolveAngleArithmeticTask(data, requestedTask);
    if (!task) {
        throw new ViewValidationError(
            viewId,
            `Operation ${data.operation} does not support task ${requestedTask}.`
        );
    }
    const presentation = buildAngleArithmeticPresentation(data, task, payload.seed);
    const viewModel: AngleArithmeticViewModel = {...data, ...presentation};

    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[54px] items-center justify-center px-4 text-center text-[1.18rem] font-bold leading-snug text-slate-700">
                {viewModel.prompt}
            </div>
            <div className="mt-2 flex h-[340px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <AnglePartitionDiagram data={viewModel} isSolutionView={isSolutionView} />
            </div>
            {!isSolutionView && (
                <div className="mt-3">
                    <QuestionEquations data={viewModel} />
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.08rem] font-extrabold">{viewModel.solutionEquation}</div>
                    <div className="mt-1 text-[0.98rem] font-extrabold">{viewModel.answerStatement}</div>
                    <div className="mt-1 text-[0.86rem] font-semibold leading-snug text-slate-700">{viewModel.explanation}</div>
                </div>
            )}
        </div>
    );
};
