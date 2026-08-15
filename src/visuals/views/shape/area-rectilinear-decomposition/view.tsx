import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {AreaDecompositionProblem, RectilinearAreaDecompositionProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    AreaRectilinearDecompositionViewConfig,
    AreaRectilinearDecompositionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: AreaRectilinearDecompositionViewConfig;
    payload: ViewRenderPayload<'area-rectilinear-decomposition'>;
}

const CELL_SIZE = 44;

function validateDecomposition(
    data: AreaDecompositionProblem
): asserts data is RectilinearAreaDecompositionProblem {
    validateProblemData('area-rectilinear-decomposition', data, [
        'kind',
        'leftWidth',
        'rightWidth',
        'totalHeight',
        'bottomHeight',
        'leftArea',
        'rightArea',
        'totalArea'
    ]);
    if (
        data.kind !== 'rectilinear'
        || !Number.isInteger(data.leftWidth)
        || !Number.isInteger(data.rightWidth)
        || !Number.isInteger(data.totalHeight)
        || !Number.isInteger(data.bottomHeight)
        || data.leftWidth < 2
        || data.leftWidth > 3
        || data.rightWidth < 2
        || data.rightWidth > 3
        || data.totalHeight < 3
        || data.totalHeight > 5
        || data.bottomHeight < 1
        || data.bottomHeight >= data.totalHeight
        || data.leftArea !== data.leftWidth * data.totalHeight
        || data.rightArea !== data.rightWidth * data.bottomHeight
        || data.totalArea !== data.leftArea + data.rightArea
    ) {
        throw new ViewValidationError('area-rectilinear-decomposition', 'The rectilinear decomposition and component areas must be consistent.');
    }
}

function RectilinearFigure({data, showDecomposition}: {
    data: RectilinearAreaDecompositionProblem;
    showDecomposition: boolean;
}) {
    const totalWidth = data.leftWidth + data.rightWidth;
    const width = totalWidth * CELL_SIZE;
    const height = data.totalHeight * CELL_SIZE;
    const x = (520 - width) / 2;
    const y = (250 - height) / 2 + 12;
    const splitX = x + data.leftWidth * CELL_SIZE;
    const armY = y + (data.totalHeight - data.bottomHeight) * CELL_SIZE;
    const rightX = x + width;
    const bottomY = y + height;

    return (
        <svg viewBox="0 0 520 290" className="h-[290px] w-[520px]" aria-label="A dimensioned L-shaped figure made from square units">
            {Array.from({length: data.totalHeight}, (_, row) =>
                Array.from({length: totalWidth}, (__, column) => {
                    const occupied = column < data.leftWidth
                        || row >= data.totalHeight - data.bottomHeight;
                    if (!occupied) return null;
                    const isRightPart = column >= data.leftWidth;
                    return (
                        <rect
                            key={`${row}-${column}`}
                            x={x + column * CELL_SIZE}
                            y={y + row * CELL_SIZE}
                            width={CELL_SIZE}
                            height={CELL_SIZE}
                            fill={showDecomposition
                                ? isRightPart ? '#fef3c7' : '#dbeafe'
                                : '#e2e8f0'}
                            stroke="#64748b"
                            strokeWidth="1.5"
                        />
                    );
                })
            )}
            <path
                d={`M ${x} ${y} H ${splitX} V ${armY} H ${rightX} V ${bottomY} H ${x} Z`}
                fill="none"
                stroke="#334155"
                strokeWidth="4"
                strokeLinejoin="round"
            />
            {showDecomposition && (
                <line x1={splitX} y1={armY} x2={splitX} y2={bottomY} stroke="#7c3aed" strokeWidth="5" />
            )}

            <text x={x + data.leftWidth * CELL_SIZE / 2} y={y - 13} textAnchor="middle" className="fill-slate-700 text-[15px] font-bold">
                {data.leftWidth} units
            </text>
            <text x={splitX + data.rightWidth * CELL_SIZE / 2} y={armY - 13} textAnchor="middle" className="fill-slate-700 text-[15px] font-bold">
                {data.rightWidth} units
            </text>
            <text x={x - 17} y={y + height / 2} textAnchor="middle" transform={`rotate(-90 ${x - 17} ${y + height / 2})`} className="fill-slate-700 text-[15px] font-bold">
                {data.totalHeight} units
            </text>
            <text x={rightX + 17} y={armY + data.bottomHeight * CELL_SIZE / 2} textAnchor="middle" transform={`rotate(-90 ${rightX + 17} ${armY + data.bottomHeight * CELL_SIZE / 2})`} className="fill-slate-700 text-[15px] font-bold">
                {data.bottomHeight} {data.bottomHeight === 1 ? 'unit' : 'units'}
            </text>

            {showDecomposition && (
                <>
                    <text x={x + data.leftWidth * CELL_SIZE / 2} y={y + height / 2 + 5} textAnchor="middle" className="fill-blue-800 text-[14px] font-extrabold">
                        {data.leftWidth} × {data.totalHeight} = {data.leftArea}
                    </text>
                    <text x={splitX + data.rightWidth * CELL_SIZE / 2} y={armY + data.bottomHeight * CELL_SIZE / 2 + 5} textAnchor="middle" className="fill-amber-800 text-[14px] font-extrabold">
                        {data.rightWidth} × {data.bottomHeight} = {data.rightArea}
                    </text>
                </>
            )}
        </svg>
    );
}

const AreaRectilinearDecompositionCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateDecomposition(data);

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                Decompose the rectilinear figure into rectangles and find its area.
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <RectilinearFigure data={data} showDecomposition={isSolutionView} />
            </div>
            <div className={`mt-4 min-h-[62px] rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.2rem] font-bold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-600'
            }`}>
                {isSolutionView
                    ? `${data.leftArea} + ${data.rightArea} = ${data.totalArea} square units`
                    : 'Show two non-overlapping rectangles and add their areas.'}
            </div>
        </div>
    );
};

export const AreaRectilinearDecomposition = withConfig(
    AreaRectilinearDecompositionViewSchema,
    AreaRectilinearDecompositionCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'area-rectilinear-decomposition'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AreaRectilinearDecomposition payload={payload} />);
};
