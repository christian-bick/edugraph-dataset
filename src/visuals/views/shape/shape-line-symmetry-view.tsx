import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    LineSymmetryAxis,
    LineSymmetryFigure,
    ShapeLineSymmetryProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    axisEndpoints,
    DrawingFigureKind,
    drawingFigure,
    IdentificationMultiAxisKind,
    identificationPresentation,
    isValidShapeLineSymmetryProblem,
    rotationFor
} from './shape-line-symmetry-helpers.ts';

const AXIS_COLORS = ['#db2777', '#059669', '#7c3aed', '#d97706'] as const;

function FoldAxes({
    axes,
    figure,
    viewId
}: {
    axes: readonly LineSymmetryAxis[];
    figure: LineSymmetryFigure;
    viewId: string;
}) {
    return (
        <>
            {axes.map((axis, axisIndex) => {
                const endpoints = axisEndpoints(axis, figure);
                if (endpoints === null) {
                    throw new ViewValidationError(
                        viewId,
                        `The ${figure.kind} symmetry axis cannot be projected into the figure bounds.`
                    );
                }
                const [start, end] = endpoints;
                const color = AXIS_COLORS[axisIndex % AXIS_COLORS.length];
                return (
                    <g key={`${axis.equation.a}:${axis.equation.b}:${axis.equation.c}`}>
                        <line
                            x1={start.x}
                            y1={start.y}
                            x2={end.x}
                            y2={end.y}
                            stroke={color}
                            strokeWidth="2.7"
                            strokeDasharray="5 3"
                            strokeLinecap="round"
                        />
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
    size = 'card',
    viewId
}: {
    figure: LineSymmetryFigure;
    axes: readonly LineSymmetryAxis[];
    rotation: number;
    size?: 'card' | 'large';
    viewId: string;
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
                <FoldAxes axes={axes} figure={figure} viewId={viewId} />
            </g>
        </svg>
    );
}

function IdentificationLayout({
    data,
    isSolutionView,
    multiAxisKind,
    seed,
    viewId
}: {
    data: ShapeLineSymmetryProblem;
    isSolutionView: boolean;
    multiAxisKind: IdentificationMultiAxisKind;
    seed: number;
    viewId: string;
}) {
    const {options, answerIds} = identificationPresentation(data, multiAxisKind, seed);
    const prompt = 'Classify each figure by whether it can be folded along a line into exactly matching halves.';
    const positiveLabel = 'has line symmetry';
    const negativeLabel = 'does not have line symmetry';
    const answerStatement = `Figures ${answerIds.join(' and ')} have at least one line of symmetry.`;
    return (
        <div className="w-[700px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[62px] items-center justify-center px-5 text-center text-[1.18rem] font-extrabold leading-snug text-slate-700">
                {prompt}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
                {options.map((option, index) => {
                    const hasLineSymmetry = option.figure.validAxes.length > 0;
                    const axisCount = option.figure.validAxes.length;
                    const membership = hasLineSymmetry ? positiveLabel : negativeLabel;
                    const cardClass = !isSolutionView
                        ? 'border-slate-200 bg-slate-50'
                        : hasLineSymmetry
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-rose-300 bg-rose-50';
                    return (
                        <div
                            key={option.id}
                            role="img"
                            aria-label={`Figure ${option.id}, closed polygon with ${option.figure.vertices.length} corners${
                                isSolutionView
                                    ? `, ${membership}; ${axisCount} valid fold ${axisCount === 1 ? 'line' : 'lines'} shown`
                                    : '; classification and fold lines not revealed'
                            }`}
                            className={`relative flex h-[192px] flex-col items-center justify-center rounded-xl border-2 px-3 pb-2 pt-4 ${cardClass}`}
                        >
                            <div className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                                isSolutionView && hasLineSymmetry ? 'bg-emerald-700' : 'bg-slate-700'
                            }`}>
                                {option.id}
                            </div>
                            {isSolutionView && (
                                <div className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[0.63rem] font-extrabold uppercase tracking-wide ${
                                    hasLineSymmetry ? 'bg-emerald-700 text-white' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {membership}
                                </div>
                            )}
                            <SymmetryFigure
                                figure={option.figure}
                                axes={isSolutionView && hasLineSymmetry ? option.figure.validAxes : []}
                                rotation={rotationFor(seed, index)}
                                viewId={viewId}
                            />
                            <div className="mt-1 text-[0.82rem] font-bold text-slate-700">Figure {option.id}</div>
                        </div>
                    );
                })}
            </div>
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[0.98rem] font-extrabold">{answerStatement}</div>
                    <div className="mt-1 text-[0.84rem] font-semibold leading-snug text-slate-700">
                        Each selected figure can be folded along a valid line so its matching parts coincide.
                    </div>
                </div>
            )}
        </div>
    );
}

function DrawingLayout({
    data,
    figureKind,
    isSolutionView,
    seed,
    viewId
}: {
    data: ShapeLineSymmetryProblem;
    figureKind: DrawingFigureKind;
    isSolutionView: boolean;
    seed: number;
    viewId: string;
}) {
    const figure = drawingFigure(data, figureKind);
    const axes = isSolutionView ? figure.validAxes : [];
    const axisCount = figure.validAxes.length;
    const answer = `${axisCount} ${axisCount === 1 ? 'line' : 'lines'} of symmetry`;
    return (
        <div className="w-[620px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-[58px] items-center justify-center px-5 text-center text-[1.22rem] font-extrabold leading-snug text-slate-700">
                Draw every line where folding the figure makes exactly matching halves.
            </div>
            <div
                role="img"
                aria-label={`Closed polygon with ${figure.vertices.length} corners${
                    isSolutionView
                        ? `; ${axisCount} valid fold ${axisCount === 1 ? 'line' : 'lines'} shown`
                        : '; learner-drawn fold lines and their count not shown'
                }`}
                className="mt-3 flex h-[340px] items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-50"
            >
                <SymmetryFigure
                    figure={figure}
                    axes={axes}
                    rotation={rotationFor(seed, 0)}
                    size="large"
                    viewId={viewId}
                />
            </div>
            {isSolutionView && (
                <div className="mt-4 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="text-[1rem] font-extrabold">The figure has {answer}.</div>
                    <div className="mt-1 text-[0.84rem] font-semibold leading-snug text-slate-700">
                        Each completed line divides the figure into matching reflected halves.
                    </div>
                </div>
            )}
        </div>
    );
}

export type ShapeLineSymmetryTaskMode = 'identify' | 'draw';

type ShapeLineSymmetryViewProps = {
    payload: RenderPayload<AbstractProblem<ShapeLineSymmetryProblem>>;
    viewId: string;
} & ({
    mode: 'identify';
    multiAxisKind: IdentificationMultiAxisKind;
} | {
    mode: 'draw';
    figureKind: DrawingFigureKind;
});

export const ShapeLineSymmetryView = (props: ShapeLineSymmetryViewProps) => {
    const {payload, viewId} = props;
    const {problem, isSolutionView, seed} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, ['figures']);
    if (!isValidShapeLineSymmetryProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'The canonical figure catalogue, complete fold axes, and vertex correspondences must agree.'
        );
    }
    if (props.mode === 'identify') {
        return (
            <IdentificationLayout
                data={data}
                isSolutionView={isSolutionView}
                multiAxisKind={props.multiAxisKind}
                seed={seed}
                viewId={viewId}
            />
        );
    }
    return (
        <DrawingLayout
            data={data}
            figureKind={props.figureKind}
            isSolutionView={isSolutionView}
            seed={seed}
            viewId={viewId}
        />
    );
};
