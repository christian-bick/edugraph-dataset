import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    RectangleAreaFormulaModel,
    ShapeSquareArrayProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    buildRectangleAreaPresentation,
    buildSquareArrayInversionPresentation,
    getAreaTilePrompt,
    getSquareArrayStoryPrompt,
    InverseRectangleAreaPresentation,
    isRectangleAreaFormulaModel,
    isValidShapeSquareArrayProblem,
    RectangleAreaPresentation,
    resolveShapeSquareArrayTask,
    ShapeSquareArrayMode
} from './shape-square-array-helpers.ts';

interface ShapeSquareArrayViewProps {
    mode: ShapeSquareArrayMode;
    payload: RenderPayload<AbstractProblem<ShapeSquareArrayProblem>>;
    useStory: boolean;
    viewId: string;
}

const CELL_SIZE = 44;

function UnitSquare() {
    return (
        <svg viewBox="0 0 340 260" className="h-[260px] w-[340px]" aria-label="A square tile with side lengths of 1 unit">
            <rect x="92" y="38" width="156" height="156" rx="4" fill="#ede9fe" stroke="#6d28d9" strokeWidth="5" />
            <line x1="92" y1="215" x2="248" y2="215" stroke="#475569" strokeWidth="2" />
            <line x1="92" y1="208" x2="92" y2="222" stroke="#475569" strokeWidth="2" />
            <line x1="248" y1="208" x2="248" y2="222" stroke="#475569" strokeWidth="2" />
            <text x="170" y="240" textAnchor="middle" className="fill-slate-700 text-[16px] font-bold">1 unit</text>
            <line x1="70" y1="38" x2="70" y2="194" stroke="#475569" strokeWidth="2" />
            <line x1="63" y1="38" x2="77" y2="38" stroke="#475569" strokeWidth="2" />
            <line x1="63" y1="194" x2="77" y2="194" stroke="#475569" strokeWidth="2" />
            <text x="43" y="116" textAnchor="middle" transform="rotate(-90 43 116)" className="fill-slate-700 text-[16px] font-bold">1 unit</text>
            <text x="170" y="123" textAnchor="middle" className="fill-violet-800 text-[18px] font-extrabold">unit square</text>
        </svg>
    );
}

function SquareArray({
    data,
    showCells,
    showCount,
    showSideLengths,
    hiddenDimension
}: {
    data: ShapeSquareArrayProblem;
    showCells: boolean;
    showCount: boolean;
    showSideLengths: boolean;
    hiddenDimension?: 'length' | 'width';
}) {
    const width = data.columns * CELL_SIZE;
    const height = data.rows * CELL_SIZE;
    const x = (340 - width) / 2;
    const y = (220 - height) / 2 + 28;

    return (
        <svg
            viewBox="0 0 340 260"
            className="w-[340px] h-[260px]"
            aria-label={hiddenDimension
                ? `Equal-square array with unknown ${hiddenDimension}`
                : `${data.rows} rows and ${data.columns} columns of equal squares`}
        >
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx="3"
                fill="#f8fafc"
                stroke="#334155"
                strokeWidth="5"
            />
            {showCells && Array.from({length: data.squareCount}, (_, index) => {
                const row = Math.floor(index / data.columns);
                const column = index % data.columns;
                return (
                    <g key={index}>
                        <rect
                            x={x + column * CELL_SIZE}
                            y={y + row * CELL_SIZE}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            fill={(row + column) % 2 === 0 ? '#dbeafe' : '#eff6ff'}
                            stroke="#475569"
                            strokeWidth="2"
                        />
                        {showCount && (
                            <text
                                x={x + column * CELL_SIZE + CELL_SIZE / 2}
                                y={y + row * CELL_SIZE + CELL_SIZE / 2 + 6}
                                textAnchor="middle"
                                className="fill-slate-700 text-[15px] font-bold"
                            >
                                {index + 1}
                            </text>
                        )}
                    </g>
                );
            })}
            <text
                x={x + width / 2}
                y={y - 13}
                textAnchor="middle"
                className="fill-slate-600 text-[15px] font-bold"
            >
                {hiddenDimension === 'length'
                    ? '? units'
                    : showSideLengths ? `${data.columns} units` : `${data.columns} columns`}
            </text>
            <text
                x={x - 16}
                y={y + height / 2}
                textAnchor="middle"
                transform={`rotate(-90 ${x - 16} ${y + height / 2})`}
                className="fill-slate-600 text-[15px] font-bold"
            >
                {hiddenDimension === 'width'
                    ? '? units'
                    : showSideLengths ? `${data.rows} units` : `${data.rows} rows`}
            </text>
        </svg>
    );
}

function RectangleAreaDiagram({
    data,
    presentation,
    isSolutionView
}: {
    data: RectangleAreaFormulaModel;
    presentation: RectangleAreaPresentation;
    isSolutionView: boolean;
}) {
    const isInverse = presentation.task === 'find-missing-area-dimension';
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
            <rect x="88" y="30" width="292" height="170" rx="5" fill="#ede9fe" stroke="#6d28d9" strokeWidth="5" />
            <line x1="88" y1="218" x2="380" y2="218" stroke="#475569" strokeWidth="2" />
            <line x1="88" y1="211" x2="88" y2="225" stroke="#475569" strokeWidth="2" />
            <line x1="380" y1="211" x2="380" y2="225" stroke="#475569" strokeWidth="2" />
            <text x="234" y="240" textAnchor="middle" className="fill-slate-700 text-[16px] font-extrabold">
                length: {lengthLabel}
            </text>
            <line x1="62" y1="30" x2="62" y2="200" stroke="#475569" strokeWidth="2" />
            <line x1="55" y1="30" x2="69" y2="30" stroke="#475569" strokeWidth="2" />
            <line x1="55" y1="200" x2="69" y2="200" stroke="#475569" strokeWidth="2" />
            <text x="26" y="115" textAnchor="middle" transform="rotate(-90 26 115)" className="fill-slate-700 text-[16px] font-extrabold">
                width: {widthLabel}
            </text>
            <text x="234" y="122" textAnchor="middle" className="fill-violet-800 text-[18px] font-extrabold">
                {isInverse ? `Area: ${data.area} square units` : 'rectangle'}
            </text>
        </svg>
    );
}

function RectangleAreaFormulaTask({
    data,
    presentation,
    isSolutionView
}: {
    data: RectangleAreaFormulaModel;
    presentation: RectangleAreaPresentation;
    isSolutionView: boolean;
}) {
    const isInverse = presentation.task === 'find-missing-area-dimension';
    return (
        <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">
                {presentation.prompt}
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <RectangleAreaDiagram
                    data={data}
                    presentation={presentation}
                    isSolutionView={isSolutionView}
                />
            </div>
            <div className="mt-4 grid grid-cols-[245px_1fr] gap-3">
                <div className="flex items-center justify-center rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-3 font-mono text-[0.95rem] font-extrabold text-violet-800">
                    {data.formula}
                </div>
                <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-slate-700">
                    {presentation.questionEquation}
                </div>
            </div>
            {isInverse && !isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-blue-800">
                    Inverse step: {presentation.inverseEquation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.08rem] font-extrabold">{presentation.solutionEquation}</div>
                    <div className="mt-1 text-[1.05rem] font-extrabold">{presentation.answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{presentation.explanation}</div>
                </div>
            )}
        </div>
    );
}

function SquareArrayInversionTask({
    data,
    presentation,
    isSolutionView
}: {
    data: ShapeSquareArrayProblem;
    presentation: InverseRectangleAreaPresentation;
    isSolutionView: boolean;
}) {
    return (
        <div className="w-[650px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.25rem] font-bold leading-snug text-slate-700">
                {presentation.prompt}
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <SquareArray
                    data={data}
                    showCells
                    showCount={false}
                    showSideLengths
                    hiddenDimension={isSolutionView ? undefined : presentation.unknownDimension}
                />
            </div>
            <div className="mt-4 grid grid-cols-[245px_1fr] gap-3">
                <div className="flex items-center justify-center rounded-xl border-2 border-violet-200 bg-violet-50 px-3 py-3 font-mono text-[0.95rem] font-extrabold text-violet-800">
                    Area = length × width
                </div>
                <div className="flex min-h-[54px] items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-slate-700">
                    {isSolutionView
                        ? presentation.questionEquation.replace('?', String(presentation.missingValue))
                        : presentation.questionEquation}
                </div>
            </div>
            {!isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center font-mono text-[1.05rem] font-bold text-blue-800">
                    Inverse step: {presentation.inverseEquation}
                </div>
            )}
            {isSolutionView && (
                <div className="mt-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 px-5 py-3 text-center text-emerald-800">
                    <div className="font-mono text-[1.08rem] font-extrabold">{presentation.solutionEquation}</div>
                    <div className="mt-1 text-[1.05rem] font-extrabold">{presentation.answerStatement}</div>
                    <div className="mt-2 text-[0.92rem] font-semibold leading-snug text-slate-700">{presentation.explanation}</div>
                </div>
            )}
        </div>
    );
}

export const ShapeSquareArrayView = ({
    mode,
    payload,
    useStory,
    viewId
}: ShapeSquareArrayViewProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData(viewId, problem.data, [
        'model',
        'rows',
        'columns',
        'squareCount',
        'areaUnit'
    ]);
    if (!isValidShapeSquareArrayProblem(problem.data)) {
        throw new ViewValidationError(
            viewId,
            'The supplied square-array model must have consistent dimensions, area, and units.'
        );
    }

    const task = resolveShapeSquareArrayTask(problem.data, mode);
    if (!task) {
        throw new ViewValidationError(
            viewId,
            'The requested task is not supported by this mathematical model.'
        );
    }

    if (isRectangleAreaFormulaModel(problem.data)) {
        validateProblemData(viewId, problem.data, [
            'length',
            'width',
            'area',
            'formula'
        ]);
        if (task !== 'rectangle-area-formula' && task !== 'find-missing-area-dimension') {
            throw new ViewValidationError(
                viewId,
                'The rectangle-area formula model requires execution or inversion.'
            );
        }
        const presentation = buildRectangleAreaPresentation(problem.data, task, payload.seed);
        const displayedPresentation = useStory && task === 'rectangle-area-formula'
            ? {
                ...presentation,
                prompt: getSquareArrayStoryPrompt(problem.data, task)
            }
            : presentation;
        return (
            <RectangleAreaFormulaTask
                data={problem.data}
                presentation={displayedPresentation}
                isSolutionView={isSolutionView}
            />
        );
    }

    if (task === 'find-missing-area-dimension') {
        return (
            <SquareArrayInversionTask
                data={problem.data}
                presentation={buildSquareArrayInversionPresentation(problem.data, payload.seed)}
                isSolutionView={isSolutionView}
            />
        );
    }

    const isUnitInterpretation = task === 'interpret-unit';
    const isCoverageInterpretation = task === 'interpret-coverage';
    const isAreaCount = task === 'count-area';
    const isProductExplanation = task === 'explain-product';
    const isAreaCalculation = task === 'calculate-area';
    const isPartition = task === 'partition';
    const showCells = !isPartition || isSolutionView;
    const storyPrompt = useStory && (
        task === 'count'
        || task === 'count-area'
        || task === 'calculate-area'
    )
        ? getSquareArrayStoryPrompt(problem.data, task)
        : null;

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="flex min-h-[450px] w-[520px] flex-col items-center gap-4">
                <div className={`${isAreaCount || isCoverageInterpretation || useStory
                    ? 'min-h-[82px] text-[1.1rem] leading-tight'
                    : 'h-[58px] text-[1.3rem] leading-snug'
                } flex items-center justify-center px-5 text-center font-bold text-slate-700`}>
                    {storyPrompt ?? (isUnitInterpretation
                        ? 'This square tile has side length 1 unit. What area does it represent?'
                            : isCoverageInterpretation
                                ? `Count one row at a time, adding ${problem.data.columns} unit squares for each row. What does the repeated count tell you about area?`
                            : isAreaCount
                                ? getAreaTilePrompt(problem.data.areaUnit)
                                : isProductExplanation
                                    ? 'Why does multiplying the side lengths give the area of this tiled rectangle?'
                                    : isAreaCalculation
                                        ? `Find the area of this ${problem.data.columns}-unit by ${problem.data.rows}-unit rectangle.`
                        : isPartition
                        ? `Partition the rectangle into ${problem.data.rows} rows and ${problem.data.columns} columns of equal squares.`
                        : 'How many equal squares are in the rectangle?')}
                </div>
                <div className="w-[420px] h-[280px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center box-border">
                    {isUnitInterpretation
                        ? <UnitSquare />
                        : (
                            <SquareArray
                                data={problem.data}
                                showCells={showCells}
                                showCount={!isPartition && !isProductExplanation && !isAreaCalculation && isSolutionView}
                                showSideLengths={isProductExplanation || isAreaCalculation}
                            />
                        )}
                </div>
                <div
                    className={`h-[52px] min-w-[270px] px-6 rounded-xl border-2 flex items-center justify-center text-[1.18rem] font-bold box-border ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : isPartition || isUnitInterpretation || isCoverageInterpretation
                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                : 'border-slate-300 bg-white text-transparent'
                    }`}
                    aria-label={isSolutionView
                        ? isUnitInterpretation
                            ? 'Answer: one square unit'
                            : isCoverageInterpretation
                                ? `Answer: ${problem.data.squareCount} square units of area`
                                : isAreaCount
                                    ? `Answer: ${problem.data.squareCount} ${problem.data.areaUnit}`
                                    : isProductExplanation
                                        ? `Explanation: ${problem.data.rows} times ${problem.data.columns} equals ${problem.data.squareCount} square units`
                                        : isAreaCalculation
                                            ? `Answer: ${problem.data.squareCount} square units`
                            : isPartition
                            ? `Partition: ${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `Answer: ${problem.data.squareCount} equal squares`
                        : isUnitInterpretation
                            ? 'Name the area'
                            : isCoverageInterpretation
                                ? 'Interpret the tile count as area'
                                : isAreaCount
                                    ? 'Blank area answer'
                                    : isProductExplanation
                                        ? 'Connect side lengths, rows, columns, and area'
                                        : isAreaCalculation
                                            ? 'Blank area answer'
                                : isPartition ? 'Draw the square grid' : 'Blank answer'}
                >
                    {isSolutionView
                        ? isUnitInterpretation
                            ? '1 unit × 1 unit = 1 square unit'
                            : isCoverageInterpretation
                                ? `${problem.data.squareCount} unit squares cover the figure, so its area is ${problem.data.squareCount} square units.`
                                : isAreaCount
                                    ? `Area = ${problem.data.squareCount} ${problem.data.areaUnit}`
                                    : isProductExplanation
                                        ? `${problem.data.rows} rows of ${problem.data.columns} unit squares: ${problem.data.rows} × ${problem.data.columns} = ${problem.data.squareCount} square units.`
                                        : isAreaCalculation
                                            ? `Area = ${problem.data.rows} × ${problem.data.columns} = ${problem.data.squareCount} square units`
                            : isPartition
                            ? `${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `${problem.data.rows} × ${problem.data.columns} = ${problem.data.squareCount} equal squares`
                        : isUnitInterpretation
                            ? 'Name the area represented.'
                            : isCoverageInterpretation
                                ? 'Interpret the square-tile count as area.'
                                : isAreaCount
                                    ? '\u00a0'
                                    : isProductExplanation
                                        ? 'Connect the tiled side lengths to multiplication.'
                                        : isAreaCalculation
                                            ? '\u00a0'
                                : isPartition ? 'Draw the square grid.' : '\u00a0'}
                </div>
            </div>
        </div>
    );
};
