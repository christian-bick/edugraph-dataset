import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {AreaDecompositionProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {AreaDistributiveModelViewConfig, AreaDistributiveModelViewSchema} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: AreaDistributiveModelViewConfig;
    payload: ViewRenderPayload<'area-distributive-model'>;
}

const CELL_SIZE = 40;

function validateDecomposition(data: AreaDecompositionProblem) {
    validateProblemData('area-distributive-model', data, [
        'height',
        'leftWidth',
        'rightWidth',
        'totalWidth',
        'leftArea',
        'rightArea',
        'totalArea'
    ]);
    if (
        !Number.isInteger(data.height)
        || !Number.isInteger(data.leftWidth)
        || !Number.isInteger(data.rightWidth)
        || data.height < 2
        || data.height > 5
        || data.leftWidth < 2
        || data.leftWidth > 3
        || data.rightWidth < 2
        || data.rightWidth > 3
        || data.totalWidth !== data.leftWidth + data.rightWidth
        || data.leftArea !== data.height * data.leftWidth
        || data.rightArea !== data.height * data.rightWidth
        || data.totalArea !== data.leftArea + data.rightArea
    ) {
        throw new ViewValidationError('area-distributive-model', 'The split rectangle and its partial areas must be mathematically consistent.');
    }
}

function SplitRectangle({data, showAreas}: {data: AreaDecompositionProblem; showAreas: boolean}) {
    const width = data.totalWidth * CELL_SIZE;
    const height = data.height * CELL_SIZE;
    const x = (520 - width) / 2;
    const y = (250 - height) / 2 + 14;
    const splitX = x + data.leftWidth * CELL_SIZE;

    return (
        <svg viewBox="0 0 520 290" className="h-[290px] w-[520px]" aria-label={`A ${data.height}-unit by ${data.totalWidth}-unit rectangle split into widths ${data.leftWidth} and ${data.rightWidth}`}>
            {Array.from({length: data.height}, (_, row) =>
                Array.from({length: data.totalWidth}, (__, column) => (
                    <rect
                        key={`${row}-${column}`}
                        x={x + column * CELL_SIZE}
                        y={y + row * CELL_SIZE}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        fill={column < data.leftWidth ? '#dbeafe' : '#fef3c7'}
                        stroke="#64748b"
                        strokeWidth="1.5"
                    />
                ))
            )}
            <rect x={x} y={y} width={width} height={height} fill="none" stroke="#334155" strokeWidth="4" />
            <line x1={splitX} y1={y} x2={splitX} y2={y + height} stroke="#7c3aed" strokeWidth="5" />

            <text x={x + data.leftWidth * CELL_SIZE / 2} y={y - 13} textAnchor="middle" className="fill-blue-700 text-[15px] font-bold">
                {data.leftWidth} {data.leftWidth === 1 ? 'unit' : 'units'}
            </text>
            <text x={splitX + data.rightWidth * CELL_SIZE / 2} y={y - 13} textAnchor="middle" className="fill-amber-700 text-[15px] font-bold">
                {data.rightWidth} {data.rightWidth === 1 ? 'unit' : 'units'}
            </text>
            <text x={x - 17} y={y + height / 2} textAnchor="middle" transform={`rotate(-90 ${x - 17} ${y + height / 2})`} className="fill-slate-700 text-[15px] font-bold">
                {data.height} units
            </text>
            <text x={x + width / 2} y={y + height + 25} textAnchor="middle" className="fill-slate-600 text-[14px] font-bold">
                Total width: {data.leftWidth} + {data.rightWidth} = {data.totalWidth} units
            </text>

            {showAreas && (
                <>
                    <text x={x + data.leftWidth * CELL_SIZE / 2} y={y + height / 2 + 5} textAnchor="middle" className="fill-blue-800 text-[14px] font-extrabold">
                        {data.height} × {data.leftWidth} = {data.leftArea}
                    </text>
                    <text x={splitX + data.rightWidth * CELL_SIZE / 2} y={y + height / 2 + 5} textAnchor="middle" className="fill-amber-800 text-[14px] font-extrabold">
                        {data.height} × {data.rightWidth} = {data.rightArea}
                    </text>
                </>
            )}
        </svg>
    );
}

const AreaDistributiveModelCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateDecomposition(data);

    return (
        <div className="w-[680px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <div className="text-center text-[1.3rem] font-bold text-slate-700">
                How does splitting the rectangle show the distributive property?
            </div>
            <div className="mt-4 flex justify-center rounded-xl border-2 border-slate-200 bg-slate-50">
                <SplitRectangle data={data} showAreas={isSolutionView} />
            </div>
            <div className={`mt-4 min-h-[70px] rounded-xl border-2 px-5 py-3 text-center font-mono text-[1.16rem] font-bold ${
                isSolutionView
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700'
            }`}>
                <div>{data.height} × ({data.leftWidth} + {data.rightWidth}) = {isSolutionView ? data.totalArea : '?'}</div>
                <div className="mt-1">
                    {isSolutionView
                        ? `(${data.height} × ${data.leftWidth}) + (${data.height} × ${data.rightWidth}) = ${data.leftArea} + ${data.rightArea} = ${data.totalArea} square units`
                        : 'Use the two partial rectangles to explain the total area.'}
                </div>
            </div>
        </div>
    );
};

export const AreaDistributiveModel = withConfig(AreaDistributiveModelViewSchema, AreaDistributiveModelCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'area-distributive-model'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<AreaDistributiveModel payload={payload} />);
};
