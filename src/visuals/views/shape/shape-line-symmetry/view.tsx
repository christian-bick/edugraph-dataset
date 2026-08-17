import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {
    DrawLineSymmetryProblem,
    IdentifyLineSymmetryProblem,
    LineSymmetryAxis,
    LineSymmetryFigure
} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    ShapeLineSymmetryViewConfig,
    ShapeLineSymmetryViewSchema
} from './spec.ts';
import {isValidShapeLineSymmetryProblem, rotationFor} from './helpers.ts';
import '../../../../tailwind.css';

const AXIS_COLORS = ['#db2777', '#059669', '#7c3aed', '#d97706'] as const;

function FoldAxes({axes}: {axes: readonly LineSymmetryAxis[]}) {
    return (
        <>
            {axes.map((axis, axisIndex) => {
                const color = AXIS_COLORS[axisIndex % AXIS_COLORS.length];
                const witnesses = axis.correspondences.slice(0, axes.length === 4 ? 1 : 2);
                return (
                    <g key={axis.id}>
                        <line
                            x1={axis.start.x}
                            y1={axis.start.y}
                            x2={axis.end.x}
                            y2={axis.end.y}
                            stroke={color}
                            strokeWidth="2.7"
                            strokeDasharray="5 3"
                            strokeLinecap="round"
                        />
                        {witnesses.map((pair, pairIndex) => (
                            <g key={pairIndex}>
                                <polyline
                                    points={`${pair.first.x},${pair.first.y} ${pair.foldPoint.x},${pair.foldPoint.y} ${pair.second.x},${pair.second.y}`}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="1.25"
                                    strokeDasharray="2 2"
                                    opacity="0.62"
                                />
                                <circle cx={pair.first.x} cy={pair.first.y} r="2.25" fill={color} />
                                <circle cx={pair.second.x} cy={pair.second.y} r="2.25" fill={color} />
                                <circle cx={pair.foldPoint.x} cy={pair.foldPoint.y} r="2" fill="#fff" stroke={color} strokeWidth="1.4" />
                            </g>
                        ))}
                    </g>
                );
            })}
        </>
    );
}

function SymmetryFigure({
    figure,
    axes,
    rotation,
    size = 'card'
}: {
    figure: LineSymmetryFigure;
    axes: readonly LineSymmetryAxis[];
    rotation: number;
    size?: 'card' | 'large';
}) {
    const points = figure.vertices.map(point => `${point.x},${point.y}`).join(' ');
    return (
        <svg
            viewBox="0 0 100 100"
            className={size === 'large' ? 'h-[310px] w-[340px]' : 'h-[125px] w-[165px]'}
            aria-hidden="true"
        >
            <g transform={`rotate(${rotation} 50 50)`}>
                <polygon
                    points={points}
                    fill="#dbeafe"
                    stroke="#334155"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <FoldAxes axes={axes} />
                {figure.vertices.map((point, index) => (
                    <circle key={index} cx={point.x} cy={point.y} r="1.8" fill="#fff" stroke="#334155" strokeWidth="1.2" />
                ))}
            </g>
        </svg>
    );
}

function IdentificationLayout({
    data,
    isSolutionView,
    seed
}: {
    data: IdentifyLineSymmetryProblem;
    isSolutionView: boolean;
    seed: number;
}) {
    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[62px] items-center justify-center px-5 text-center text-[1.18rem] font-extrabold leading-snug text-slate-700">
                {data.prompt}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {data.options.map((option, index) => {
                    const membership = option.hasLineSymmetry ? data.positiveLabel : data.negativeLabel;
                    const cardClass = !isSolutionView
                        ? 'border-slate-200 bg-slate-50'
                        : option.hasLineSymmetry
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-rose-300 bg-rose-50';
                    return (
                        <div
                            key={option.id}
                            role="img"
                            aria-label={`Figure ${option.id}, closed polygon with ${option.figure.vertices.length} corners${
                                isSolutionView
                                    ? `, ${membership}; ${option.figure.axisCount} valid fold ${option.figure.axisCount === 1 ? 'line' : 'lines'} shown`
                                    : '; classification and fold lines not revealed'
                            }`}
                            className={`relative flex h-[192px] flex-col items-center justify-center rounded-xl border-2 px-3 pb-2 pt-4 ${cardClass}`}
                        >
                            <div className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                                isSolutionView && option.hasLineSymmetry ? 'bg-emerald-700' : 'bg-slate-700'
                            }`}>
                                {option.id}
                            </div>
                            {isSolutionView && (
                                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.63rem] font-extrabold uppercase tracking-wide ${
                                    option.hasLineSymmetry ? 'bg-emerald-700 text-white' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {membership}
                                </div>
                            )}
                            <SymmetryFigure
                                figure={option.figure}
                                axes={isSolutionView ? option.figure.validAxes : []}
                                rotation={rotationFor(seed, index)}
                            />
                            <div className="mt-1 text-[0.82rem] font-bold text-slate-700">Figure {option.id}</div>
                        </div>
                    );
                })}
            </div>
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[0.98rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-1 text-[0.84rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
}

function DrawingLayout({
    data,
    isSolutionView,
    seed
}: {
    data: DrawLineSymmetryProblem;
    isSolutionView: boolean;
    seed: number;
}) {
    const axes = isSolutionView ? data.completedAxes : [];
    return (
        <div className="w-[620px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[58px] items-center justify-center px-5 text-center text-[1.22rem] font-extrabold leading-snug text-slate-700">
                {data.prompt}
            </div>
            <div
                role="img"
                aria-label={`Closed polygon with ${data.figure.vertices.length} corners${
                    isSolutionView
                        ? `; ${data.figure.axisCount} completed fold ${data.figure.axisCount === 1 ? 'line' : 'lines'} and paired fold witnesses shown`
                        : '; learner-drawn fold lines and their count not shown'
                }`}
                className="mt-3 flex h-[340px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50"
            >
                <SymmetryFigure
                    figure={data.figure}
                    axes={axes}
                    rotation={rotationFor(seed, 0)}
                    size="large"
                />
            </div>
            {isSolutionView && (
                <div className="mt-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[1rem] font-extrabold">{data.answerStatement}</div>
                    <div className="mt-1 text-[0.84rem] font-semibold leading-snug text-slate-700">{data.explanation}</div>
                </div>
            )}
        </div>
    );
}

interface CoreProps {
    config: ShapeLineSymmetryViewConfig;
    payload: ViewRenderPayload<'shape-line-symmetry'>;
}

const ShapeLineSymmetryCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView, seed} = payload;
    const data = problem.data;
    validateProblemData('shape-line-symmetry', data, ['task']);

    if (data.task === 'identify-line-symmetry') {
        validateProblemData('shape-line-symmetry', data, [
            'task',
            'prompt',
            'positiveLabel',
            'negativeLabel',
            'options',
            'answerIds',
            'answerStatement',
            'explanation'
        ]);
    } else {
        validateProblemData('shape-line-symmetry', data, [
            'task',
            'prompt',
            'figure',
            'completedAxes',
            'answer',
            'answerStatement',
            'explanation'
        ]);
    }
    if (!isValidShapeLineSymmetryProblem(data)) {
        throw new ViewValidationError(
            'shape-line-symmetry',
            'The outline, complete fold axes, correspondence proof, membership, and prose must agree.'
        );
    }
    return data.task === 'identify-line-symmetry'
        ? <IdentificationLayout data={data} isSolutionView={isSolutionView} seed={seed} />
        : <DrawingLayout data={data} isSolutionView={isSolutionView} seed={seed} />;
};

export const ShapeLineSymmetry = withConfig(
    ShapeLineSymmetryViewSchema,
    ShapeLineSymmetryCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-line-symmetry'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeLineSymmetry payload={payload} />);
    }
};
