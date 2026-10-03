import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import type {DecimalMultiplicationProblem} from '../../../../types/problems.ts';
import {validateProblemData} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    assertDecimalMultiplication,
    fourPlaceNumeral,
    scaledNumeral
} from '../decimal-multiplication-method-helpers.ts';
import {OperationsDecimalMultiplicationMethodViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'operations-decimal-multiplication-method';
const CELL = 6;
const PALETTE = [
    {fill: '#c7d2fe', border: '#6366f1'},
    {fill: '#bae6fd', border: '#0284c7'},
    {fill: '#bbf7d0', border: '#16a34a'},
    {fill: '#fde68a', border: '#d97706'},
    {fill: '#fbcfe8', border: '#db2777'},
    {fill: '#ddd6fe', border: '#7c3aed'}
] as const;

function AreaGrid({data}: {data: DecimalMultiplicationProblem}) {
    const {areaGrid: grid} = data;
    const width = grid.widthInHundredths;
    const height = grid.heightInHundredths;
    if (width === 0 || height === 0) {
        return <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-600">
            A side has length zero, so the area grid contains no cells.
        </div>;
    }
    const left = 36;
    const top = 24;
    const plotWidth = width * CELL;
    const plotHeight = height * CELL;
    const svgWidth = Math.max(190, left + plotWidth + 20);
    const svgHeight = Math.max(105, top + plotHeight + 42);
    const firstBoundaries = data.first.partitions.slice(0, -1).map(part => part.startInHundredths + part.valueInHundredths);
    const secondBoundaries = data.second.partitions.slice(0, -1).map(part => part.startInHundredths + part.valueInHundredths);

    return <svg className="mx-auto block" width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img" aria-label={`${width} hundredth columns by ${height} hundredth rows, each cell one ten-thousandth square unit`}>
        <rect width={svgWidth} height={svgHeight} rx="12" fill="#f8fafc" />
        {grid.regions.map((region, index) => <rect key={index}
            data-region={index + 1}
            x={left + region.columnStart * CELL} y={top + region.rowStart * CELL}
            width={region.columns * CELL} height={region.rows * CELL}
            fill={PALETTE[index % PALETTE.length].fill} />)}
        {Array.from({length: width + 1}, (_, index) => <line key={`x-${index}`}
            x1={left + index * CELL} x2={left + index * CELL} y1={top} y2={top + plotHeight}
            stroke={index % 10 === 0 ? '#64748b' : '#cbd5e1'} strokeWidth={index % 10 === 0 ? 1.25 : 0.45} />)}
        {Array.from({length: height + 1}, (_, index) => <line key={`y-${index}`}
            x1={left} x2={left + plotWidth} y1={top + index * CELL} y2={top + index * CELL}
            stroke={index % 10 === 0 ? '#64748b' : '#cbd5e1'} strokeWidth={index % 10 === 0 ? 1.25 : 0.45} />)}
        {firstBoundaries.map((boundary, index) => <line key={`part-x-${index}`}
            x1={left + boundary * CELL} x2={left + boundary * CELL} y1={top - 3} y2={top + plotHeight + 3}
            stroke="#312e81" strokeWidth="2.5" />)}
        {secondBoundaries.map((boundary, index) => <line key={`part-y-${index}`}
            x1={left - 3} x2={left + plotWidth + 3} y1={top + boundary * CELL} y2={top + boundary * CELL}
            stroke="#312e81" strokeWidth="2.5" />)}
        <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="none" stroke="#1e293b" strokeWidth="2.5" />
        <text x={left} y={top - 8} className="fill-slate-600 text-[11px] font-bold">0</text>
        <text x={left + plotWidth} y={top + plotHeight + 18} textAnchor="end" className="fill-slate-700 text-[11px] font-bold">
            {width} hundredths →
        </text>
        <text x={left - 6} y={top + plotHeight / 2} textAnchor="middle" transform={`rotate(-90 ${left - 6} ${top + plotHeight / 2})`}
            className="fill-slate-700 text-[10px] font-bold">{height} rows</text>
    </svg>;
}

function RegionLegend({data, isSolution}: {data: DecimalMultiplicationProblem; isSolution: boolean}) {
    if (data.areaGrid.regions.length === 0) return <div className="mt-3 text-sm text-slate-600">No regions fit inside a zero-length side.</div>;
    return <div className="mt-3 grid grid-cols-2 gap-2">
        {data.areaGrid.regions.map((region, index) => {
            const firstPart = data.first.partitions[region.firstPartitionIndex];
            const secondPart = data.second.partitions[region.secondPartitionIndex];
            const color = PALETTE[index % PALETTE.length];
            return <div key={index} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
                <span className="size-5 shrink-0 rounded border-2" style={{backgroundColor: color.fill, borderColor: color.border}} />
                <div className="min-w-0">
                    <div className="font-mono font-bold text-slate-900">{scaledNumeral(firstPart.valueInHundredths, 100)} × {scaledNumeral(secondPart.valueInHundredths, 100)}</div>
                    <div className="text-xs font-semibold text-slate-600">
                        {isSolution
                            ? <>{region.cellCount} cells = {fourPlaceNumeral(region.productInTenThousandths)}</>
                            : <>____ cells = ______</>}
                    </div>
                </div>
            </div>;
        })}
    </div>;
}

function WrittenWork({data, isSolution}: {data: DecimalMultiplicationProblem; isSolution: boolean}) {
    const partials = data.areaGrid.regions.map(region => fourPlaceNumeral(region.productInTenThousandths));
    return <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
        <div className="text-xs font-bold uppercase tracking-wide text-indigo-800">Written multiplication</div>
        <div className="mt-2 font-mono text-2xl font-bold text-indigo-950">
            {data.first.canonicalNumeral} × {data.second.canonicalNumeral} = <span className={`inline-flex min-h-10 min-w-24 items-center justify-center rounded-lg border-2 px-2 ${isSolution ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-400 bg-white'}`}>
                {isSolution ? data.product.canonicalNumeral : ''}
            </span>
        </div>
        <div className="mt-2 text-sm font-semibold text-indigo-900">
            {data.areaGrid.widthInHundredths} hundredths × {data.areaGrid.heightInHundredths} hundredths = {isSolution ? `${data.areaGrid.cellCount} small cells` : '_____ small cells'}
        </div>
        <div className="mt-1 font-mono text-sm font-bold text-indigo-900">
            Region areas: {isSolution ? `${partials.join(' + ')} = ${data.product.canonicalNumeral}` : '____________________________'}
        </div>
    </div>;
}

export const OperationsDecimalMultiplicationMethodCore = ({payload}: {
    payload: ViewRenderPayload<typeof VIEW_ID>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'base', 'operandScale', 'productScale', 'first', 'second', 'product', 'areaGrid']);
    assertDecimalMultiplication(VIEW_ID, data);
    const isSolution = payload.isSolutionView;

    return <main className="w-[920px] max-w-[96vw] rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">Multiply decimals with an area grid</div>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Find the partial products and explain the area</h1>
        <p className="mt-1 text-sm">Use the rows and columns in each place-value region to find its area. Complete the multiplication and explain how the grid gives the product.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Horizontal side · first factor</div>
                <div className="mt-1 font-mono text-lg font-black">{data.first.canonicalNumeral} = {data.areaGrid.widthInHundredths} hundredths</div>
                <div className="text-xs text-indigo-900">{data.first.partitions.map(part => scaledNumeral(part.valueInHundredths, 100)).join(' + ') || '0'}</div>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Vertical side · second factor</div>
                <div className="mt-1 font-mono text-lg font-black">{data.second.canonicalNumeral} = {data.areaGrid.heightInHundredths} hundredths</div>
                <div className="text-xs text-sky-900">{data.second.partitions.map(part => scaledNumeral(part.valueInHundredths, 100)).join(' + ') || '0'}</div>
            </div>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <AreaGrid data={data} />
            <div className="mt-2 text-center text-xs font-semibold text-slate-600">
                {isSolution
                    ? 'Each tiny square has side 0.01 by 0.01 unit and area 1/10,000 square unit.'
                    : 'Each tiny square has side 0.01 unit in both directions.'}
            </div>
            <RegionLegend data={data} isSolution={isSolution} />
        </div>
        <div className="mt-4 grid grid-cols-[1fr_1fr] gap-3">
            <WrittenWork data={data} isSolution={isSolution} />
            <div className={`rounded-xl border-2 px-4 py-3 ${isSolution ? 'border-emerald-300 bg-emerald-50' : 'border-dashed border-slate-300 bg-white'}`}>
                <div className="text-xs font-bold uppercase tracking-wide text-emerald-800">Place-value explanation</div>
                {isSolution
                    ? <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
                        Each side is measured in hundredths, so one small cell represents 1/100 × 1/100 = 1/10,000 square unit.
                        {' '}The disjoint regions contain {data.areaGrid.cellCount} cells altogether, giving {fourPlaceNumeral(data.product.valueInTenThousandths)} square unit, or {data.product.canonicalNumeral}.
                    </p>
                    : <div className="mt-3"><p className="text-sm text-slate-500">Explain why the region areas add to the product.</p><div className="mt-5 space-y-5"><div className="border-b border-slate-300" /><div className="border-b border-slate-300" /></div></div>}
            </div>
        </div>
    </main>;
};

export const OperationsDecimalMultiplicationMethod = withConfig(
    OperationsDecimalMultiplicationMethodViewSchema,
    OperationsDecimalMultiplicationMethodCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsDecimalMultiplicationMethod payload={payload} />);
    }
};
