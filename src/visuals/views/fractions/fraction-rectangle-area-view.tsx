import type {FractionRectangleAreaProblem} from '../../../types/problems.ts';
import {formatRectangleRational, rectangleGridGeometry} from './fraction-rectangle-area-helpers.ts';

export type FractionRectangleTask = 'tiling-understanding' | 'area-execution' | 'product-construction';

interface Props {
    data: FractionRectangleAreaProblem;
    task: FractionRectangleTask;
    isSolutionView: boolean;
}

function RectangleDiagram({data, task, isSolutionView}: Props) {
    const constructing = task === 'product-construction';
    const blank = constructing && !isSolutionView;
    const geometry = rectangleGridGeometry(data, constructing);
    const {tilePixels: p, gridRows, gridColumns, plotX, plotY, viewWidth, viewHeight} = geometry;
    const originY = plotY + gridRows * p;
    const {rows, columns, cells} = data.tileGrid;
    const showTiles = task === 'tiling-understanding';
    const showRectangle = !blank;
    const gridLines = constructing
        ? <g data-blank-lattice="true" stroke="#cbd5e1" strokeWidth="1">
            {Array.from({length: gridColumns + 1}, (_, index) => <line key={`x${index}`}
                x1={plotX + index * p} y1={plotY} x2={plotX + index * p} y2={originY} />)}
            {Array.from({length: gridRows + 1}, (_, index) => <line key={`y${index}`}
                x1={plotX} y1={plotY + index * p}
                x2={plotX + gridColumns * p} y2={plotY + index * p} />)}
        </g>
        : null;

    return <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        style={{width: viewWidth, height: viewHeight, maxWidth: '100%'}}
        className="mx-auto block" role="img"
        aria-label={blank
            ? 'Blank square lattice with horizontal length and vertical width axes'
            : `Rectangle with fractional length ${formatRectangleRational(data.outerRectangle.length)} units and width ${formatRectangleRational(data.outerRectangle.width)} units`}>
        <rect width={viewWidth} height={viewHeight} rx="16" fill="#f8fafc" />
        {gridLines}
        {showRectangle && <g>
            {showTiles ? cells.map((cell, index) => <rect key={`${cell.row}-${cell.column}`}
                data-square-tile="true" data-row={cell.row} data-column={cell.column}
                x={plotX + cell.column * p} y={originY - (cell.row + 1) * p}
                width={p} height={p}
                fill={index === 0 ? '#93c5fd' : (cell.row + cell.column) % 2 === 0 ? '#e0f2fe' : '#eff6ff'}
                stroke="#94a3b8" strokeWidth="1" />)
                : <rect x={plotX} y={originY - rows * p} width={columns * p} height={rows * p}
                    fill="#ede9fe" />}
            <rect data-outer-rectangle="true" x={plotX} y={originY - rows * p}
                width={columns * p} height={rows * p} fill="none"
                stroke="#6d28d9" strokeWidth="4" />
        </g>}
        <line x1={plotX} y1={originY} x2={plotX + gridColumns * p + 10} y2={originY}
            stroke="#334155" strokeWidth="2.5" />
        <line x1={plotX} y1={originY} x2={plotX} y2={plotY - 10}
            stroke="#334155" strokeWidth="2.5" />
        <circle cx={plotX} cy={originY} r="4" fill="#334155" />
        <text x={plotX - 9} y={originY + 21} textAnchor="end"
            className="fill-slate-700 text-[14px] font-semibold">0</text>
        <text x={plotX + gridColumns * p / 2} y={originY + 38} textAnchor="middle"
            className="fill-slate-700 text-[15px] font-bold">length →</text>
        <text x="25" y={plotY + gridRows * p / 2} textAnchor="middle"
            transform={`rotate(-90 25 ${plotY + gridRows * p / 2})`}
            className="fill-slate-700 text-[15px] font-bold">width ↑</text>
        {blank && <text x={plotX + gridColumns * p / 2} y={originY + 64}
            textAnchor="middle" className="fill-slate-600 text-[13px]">
            Each lattice step is {formatRectangleRational(data.tileGrid.squareTile.side)} unit.
        </text>}
    </svg>;
}

function SideFacts({data, task}: {data: FractionRectangleAreaProblem; task: FractionRectangleTask}) {
    return <div className="flex flex-wrap justify-center gap-3 text-[17px] font-semibold text-slate-800">
        <span className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2">
            Length: {formatRectangleRational(data.outerRectangle.length)} units
        </span>
        <span className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2">
            Width: {formatRectangleRational(data.outerRectangle.width)} units
        </span>
        {task === 'tiling-understanding' && <span className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2">
            Small square: side {formatRectangleRational(data.tileGrid.squareTile.side)} unit;
            {' '}area {formatRectangleRational(data.tileGrid.squareTile.areaSquareUnits)} square unit
        </span>}
    </div>;
}

function SolutionProof({data, task}: {data: FractionRectangleAreaProblem; task: FractionRectangleTask}) {
    const {tileGrid: grid, tileProof: proof, outerRectangle: outer} = data;
    const tileArea = formatRectangleRational(grid.squareTile.areaSquareUnits);
    const total = formatRectangleRational(data.areaSquareUnits);
    const length = formatRectangleRational(outer.length);
    const width = formatRectangleRational(outer.width);
    if (task !== 'tiling-understanding') {
        return <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3 text-[18px] leading-relaxed text-emerald-950">
            <div className="font-bold">{task === 'product-construction' ? 'Completed rectangle and product' : 'Area calculation'}</div>
            <div>Length × width = {length} × {width} = <strong>{total} square units</strong>.</div>
        </div>;
    }
    return <div className="space-y-1 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-5 py-3 text-[16px] leading-relaxed text-emerald-950">
        <div className="font-bold">Why the two areas agree</div>
        <div>Each blue-grid square has side {formatRectangleRational(grid.squareTile.side)} unit and area {tileArea} square unit.</div>
        <div>{grid.columns} {grid.columns === 1 ? 'column' : 'columns'} × {grid.rows} {grid.rows === 1 ? 'row' : 'rows'} = {grid.tileCount} square tiles.</div>
        {proof && <div>One row: {grid.columns} × {tileArea} = {formatRectangleRational(proof.oneRowAreaSquareUnits)} square units;
            {' '}{grid.rows} rows give {formatRectangleRational(proof.countedAreaSquareUnits)} square units.</div>}
        <div className="font-semibold">Tile count: {grid.tileCount} × {tileArea} = {formatRectangleRational(grid.tiledAreaSquareUnits)} square units.</div>
        <div className="font-bold">Side product: {length} × {width} = {total} square units.</div>
        <div>The small square tiles cover the whole purple rectangle without gaps or overlaps, so both ways give the same area.</div>
    </div>;
}

const prompt: Record<FractionRectangleTask, string> = {
    'tiling-understanding': 'Explain why the square tiles give the same area as multiplying the rectangle’s side lengths.',
    'area-execution': 'Multiply the fractional side lengths to find the rectangle’s area in square units.',
    'product-construction': 'Draw and label a rectangle from 0 on the lattice for these two side lengths. Show its area as their product.'
};

export function FractionRectangleAreaBody({data, task, isSolutionView}: Props) {
    return <main className="w-[840px] rounded-2xl bg-white p-5 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-[22px] font-bold leading-snug text-slate-900">{prompt[task]}</h1>
        <div className="mt-3"><SideFacts data={data} task={task} /></div>
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
            <RectangleDiagram data={data} task={task} isSolutionView={isSolutionView} />
        </div>
        {!isSolutionView
            ? <div className="mt-3 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-3 text-[17px] font-semibold text-slate-700">
                {task === 'tiling-understanding' ? 'Explain why counting the square tiles and multiplying the side lengths give the same area: ____________________'
                    : task === 'product-construction' ? 'Product: ____________________   Area: ______ square units'
                        : 'Length × width = ____________________   Area = ______ square units'}
            </div>
            : <div className="mt-3"><SolutionProof data={data} task={task} /></div>}
    </main>;
}
