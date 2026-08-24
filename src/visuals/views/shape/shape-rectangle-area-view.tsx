import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {RectangleAreaProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    buildRectangleAreaPresentation,
    getRectangleAreaStoryPrompt,
    getRectangleDiagramGeometry,
    isValidRectangleAreaProblem,
    RectangleAreaPresentation
} from './shape-square-array-helpers.ts';

const RectangleAreaDiagram = ({
    data,
    presentation,
    isSolutionView
}: {
    data: RectangleAreaProblem;
    presentation: RectangleAreaPresentation;
    isSolutionView: boolean;
}) => {
    const isInverse = presentation.task === 'find-missing-area-dimension';
    const {x, y, pixelLength, pixelWidth} = getRectangleDiagramGeometry(data.length, data.width);
    const horizontalMeasureY = y + pixelWidth + 18;
    const verticalMeasureX = x - 26;
    const areaLabelY = Math.max(20, y - 8);
    const lengthLabel = isInverse && presentation.unknownDimension === 'length' && !isSolutionView
        ? '? units'
        : `${data.length} units`;
    const widthLabel = isInverse && presentation.unknownDimension === 'width' && !isSolutionView
        ? '? units'
        : `${data.width} units`;
    const accessibleDescription = isInverse && !isSolutionView
        ? `Rectangle with known ${presentation.knownDimension} ${presentation.knownValue} units and unknown ${presentation.unknownDimension}`
        : `Rectangle with length ${data.length} units and width ${data.width} units`;

    return (
        <svg viewBox="0 0 440 245" className="h-[245px] w-[440px]" aria-label={accessibleDescription}>
            <rect x={x} y={y} width={pixelLength} height={pixelWidth} rx="5" fill="#ede9fe" stroke="#6d28d9" strokeWidth="5" />
            <line x1={x} y1={horizontalMeasureY} x2={x + pixelLength} y2={horizontalMeasureY} stroke="#475569" strokeWidth="2" />
            <line x1={x} y1={horizontalMeasureY - 7} x2={x} y2={horizontalMeasureY + 7} stroke="#475569" strokeWidth="2" />
            <line x1={x + pixelLength} y1={horizontalMeasureY - 7} x2={x + pixelLength} y2={horizontalMeasureY + 7} stroke="#475569" strokeWidth="2" />
            <text x={x + pixelLength / 2} y={horizontalMeasureY + 22} textAnchor="middle" className="fill-slate-700 text-[16px] font-extrabold">length: {lengthLabel}</text>
            <line x1={verticalMeasureX} y1={y} x2={verticalMeasureX} y2={y + pixelWidth} stroke="#475569" strokeWidth="2" />
            <line x1={verticalMeasureX - 7} y1={y} x2={verticalMeasureX + 7} y2={y} stroke="#475569" strokeWidth="2" />
            <line x1={verticalMeasureX - 7} y1={y + pixelWidth} x2={verticalMeasureX + 7} y2={y + pixelWidth} stroke="#475569" strokeWidth="2" />
            <text x={verticalMeasureX - 25} y={y + pixelWidth / 2} textAnchor="middle" transform={`rotate(-90 ${verticalMeasureX - 25} ${y + pixelWidth / 2})`} className="fill-slate-700 text-[16px] font-extrabold">width: {widthLabel}</text>
            <text x={x + pixelLength / 2} y={areaLabelY} textAnchor="middle" className="fill-violet-800 text-[18px] font-extrabold">
                {isInverse ? `Area: ${data.area} square units` : 'rectangle'}
            </text>
        </svg>
    );
};

export const RectangleAreaView = ({
    payload,
    task,
    useStory,
    viewId
}: {
    payload: RenderPayload<AbstractProblem<RectangleAreaProblem>>;
    task: 'execution' | 'inversion';
    useStory: boolean;
    viewId: string;
}) => {
    const {problem, isSolutionView} = payload;
    validateProblemData(viewId, problem.data, ['kind', 'length', 'width', 'area', 'unitId']);
    if (!isValidRectangleAreaProblem(problem.data)) {
        throw new ViewValidationError(
            viewId,
            'The rectangle-area relation must have consistent dimensions, area, and units.'
        );
    }

    const presentation = buildRectangleAreaPresentation(
        problem.data,
        task === 'execution' ? 'calculate-area' : 'find-missing-area-dimension',
        payload.seed
    );
    const displayedPresentation = useStory && presentation.task === 'calculate-area'
        ? {...presentation, prompt: getRectangleAreaStoryPrompt(problem.data, true)}
        : presentation;
    const isInverse = displayedPresentation.task === 'find-missing-area-dimension';
    return (
        <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">{displayedPresentation.prompt}</div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <RectangleAreaDiagram data={problem.data} presentation={displayedPresentation} isSolutionView={isSolutionView} />
            </div>
            <div className="mt-4 grid grid-cols-[245px_1fr] gap-3">
                <div className="flex items-center justify-center rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-3 font-mono text-[0.95rem] font-extrabold text-violet-800">A = length × width</div>
                <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-slate-700">{displayedPresentation.questionEquation}</div>
            </div>
            {isInverse && !isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-blue-800">Inverse step: {displayedPresentation.inverseEquation}</div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.08rem] font-extrabold">{displayedPresentation.solutionEquation}</div>
                    <div className="mt-1 text-[1.05rem] font-extrabold">{displayedPresentation.answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{displayedPresentation.explanation}</div>
                </div>
            )}
        </div>
    );
};
