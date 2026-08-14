import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {ShapeSquareArrayProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {ShapeSquareArrayViewConfig, ShapeSquareArrayViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: ShapeSquareArrayViewConfig;
    payload: ViewRenderPayload<'shape-square-array'>;
}

const CELL_SIZE = 44;

function validateArray(data: ShapeSquareArrayProblem) {
    if (data.task !== 'interpret-unit' && data.task !== 'partition' && data.task !== 'count') {
        throw new ViewValidationError('shape-square-array', 'Expected a unit interpretation, partition, or count task.');
    }
    if (data.task === 'interpret-unit') {
        if (data.rows !== 1 || data.columns !== 1 || data.squareCount !== 1) {
            throw new ViewValidationError('shape-square-array', 'A unit-square interpretation must contain exactly one square.');
        }
        return;
    }
    if (
        !Number.isInteger(data.rows)
        || !Number.isInteger(data.columns)
        || data.rows < 2
        || data.rows > 5
        || data.columns < 2
        || data.columns > 5
        || data.rows === data.columns
    ) {
        throw new ViewValidationError('shape-square-array', 'Expected a non-square array of two to five rows and columns.');
    }
    if (data.squareCount !== data.rows * data.columns) {
        throw new ViewValidationError('shape-square-array', 'The square count must equal rows times columns.');
    }
}

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
    showCount
}: {
    data: ShapeSquareArrayProblem;
    showCells: boolean;
    showCount: boolean;
}) {
    const width = data.columns * CELL_SIZE;
    const height = data.rows * CELL_SIZE;
    const x = (340 - width) / 2;
    const y = (220 - height) / 2 + 28;

    return (
        <svg
            viewBox="0 0 340 260"
            className="w-[340px] h-[260px]"
            aria-label={`${data.rows} rows and ${data.columns} columns of equal squares`}
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
                {data.columns} columns
            </text>
            <text
                x={x - 16}
                y={y + height / 2}
                textAnchor="middle"
                transform={`rotate(-90 ${x - 16} ${y + height / 2})`}
                className="fill-slate-600 text-[15px] font-bold"
            >
                {data.rows} rows
            </text>
        </svg>
    );
}

const ShapeSquareArrayCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    validateProblemData('shape-square-array', problem.data, [
        'task',
        'rows',
        'columns',
        'squareCount'
    ]);
    validateArray(problem.data);

    const isUnitInterpretation = problem.data.task === 'interpret-unit';
    const isPartition = problem.data.task === 'partition';
    const showCells = !isPartition || isSolutionView;

    return (
        <div className="flex justify-center items-center p-8 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05)] w-fit font-sans">
            <div className="w-[520px] h-[450px] flex flex-col items-center gap-4">
                <div className="h-[58px] px-5 flex items-start justify-center text-center text-[1.3rem] leading-snug font-bold text-slate-700">
                    {isUnitInterpretation
                        ? 'This square tile has side length 1 unit. What area does it represent?'
                        : isPartition
                        ? `Partition the rectangle into ${problem.data.rows} rows and ${problem.data.columns} columns of equal squares.`
                        : 'How many equal squares are in the rectangle?'}
                </div>
                <div className="w-[420px] h-[280px] rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center box-border">
                    {isUnitInterpretation
                        ? <UnitSquare />
                        : (
                            <SquareArray
                                data={problem.data}
                                showCells={showCells}
                                showCount={!isPartition && isSolutionView}
                            />
                        )}
                </div>
                <div
                    className={`h-[52px] min-w-[270px] px-6 rounded-xl border-2 flex items-center justify-center text-[1.18rem] font-bold box-border ${
                        isSolutionView
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : isPartition || isUnitInterpretation
                                ? 'border-slate-200 bg-slate-100 text-slate-600'
                                : 'border-slate-300 bg-white text-transparent'
                    }`}
                    aria-label={isSolutionView
                        ? isUnitInterpretation
                            ? 'Answer: one square unit'
                            : isPartition
                            ? `Partition: ${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `Answer: ${problem.data.squareCount} equal squares`
                        : isUnitInterpretation ? 'Name the area' : isPartition ? 'Draw the square grid' : 'Blank answer'}
                >
                    {isSolutionView
                        ? isUnitInterpretation
                            ? '1 unit × 1 unit = 1 square unit'
                            : isPartition
                            ? `${problem.data.rows} rows of ${problem.data.columns} equal squares`
                            : `${problem.data.rows} × ${problem.data.columns} = ${problem.data.squareCount} equal squares`
                        : isUnitInterpretation ? 'Name the area represented.' : isPartition ? 'Draw the square grid.' : '\u00a0'}
                </div>
            </div>
        </div>
    );
};

export const ShapeSquareArray = withConfig(ShapeSquareArrayViewSchema, ShapeSquareArrayCore);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'shape-square-array'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<ShapeSquareArray payload={payload} />);
    }
};
