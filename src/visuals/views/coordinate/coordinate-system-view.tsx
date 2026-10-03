import type {CoordinateSystemProblem} from '../../../types/problems.ts';
import {
    COORDINATE_FRAME,
    coordinatePosition
} from './coordinate-system-helpers.ts';

export type CoordinateSystemTask = 'specification' | 'component-interpretation';

interface FrameProps {
    data: CoordinateSystemProblem;
    isSolutionView: boolean;
    task: CoordinateSystemTask;
}

const frame = COORDINATE_FRAME;

/** One square-cell coordinate frame; each axis uses its own supplied tick step. */
export function CoordinateFrame({data, isSolutionView, task}: FrameProps) {
    const specificationQuestion = task === 'specification' && !isSolutionView;
    const horizontal = data.axes.horizontal.tickValues;
    const vertical = data.axes.vertical.tickValues;
    const xEnd = frame.originX + (horizontal.length - 1) * frame.tickPixels;
    const yTop = frame.originY - (vertical.length - 1) * frame.tickPixels;
    const xEndpoint = coordinatePosition(data, data.travel.xUnits, 0);
    const yEndpoint = coordinatePosition(data, 0, data.travel.yUnits);
    const end = coordinatePosition(data, data.travel.xUnits, data.travel.yUnits);
    const showRoute = task === 'component-interpretation' && isSolutionView;
    return <svg viewBox={`0 0 ${frame.width} ${frame.height}`} className="h-[450px] w-[470px]"
        role="img" aria-label={specificationQuestion
            ? 'Two perpendicular axes with incomplete names, origin, and number scales'
            : showRoute
                ? 'Named scaled axes with horizontal and vertical distance arrows measured from the origin'
                : 'Named scaled coordinate axes with a common zero origin'}>
        <rect x="0" y="0" width={frame.width} height={frame.height} rx="18" fill="#f8fafc" />
        {horizontal.map((_, index) => {
            const x = frame.originX + index * frame.tickPixels;
            return <line key={`x-grid-${index}`} x1={x} y1={yTop} x2={x} y2={frame.originY}
                stroke="#dbeafe" strokeWidth="1" />;
        })}
        {vertical.map((_, index) => {
            const y = frame.originY - index * frame.tickPixels;
            return <line key={`y-grid-${index}`} x1={frame.originX} y1={y} x2={xEnd} y2={y}
                stroke="#dbeafe" strokeWidth="1" />;
        })}
        <line x1={frame.originX} y1={frame.originY} x2={xEnd + 5} y2={frame.originY}
            stroke="#334155" strokeWidth="3" />
        <line x1={frame.originX} y1={frame.originY} x2={frame.originX} y2={yTop - 5}
            stroke="#334155" strokeWidth="3" />
        <path d={`M ${frame.originX} ${frame.originY - 13} h 13 v 13`} fill="none"
            stroke="#64748b" strokeWidth="1.5" />
        {horizontal.slice(1).map((value, index) => {
            const x = frame.originX + (index + 1) * frame.tickPixels;
            const visible = !specificationQuestion || index === 0;
            return <g key={`x-tick-${value}`}>
                <line x1={x} y1={frame.originY - 5} x2={x} y2={frame.originY + 5}
                    stroke="#334155" strokeWidth="2" />
                <text x={x} y={frame.originY + 24} textAnchor="middle"
                    className={`font-semibold text-[14px] ${visible ? 'fill-slate-800' : 'fill-slate-400'}`}>
                    {visible ? value : '__'}
                </text>
            </g>;
        })}
        {vertical.slice(1).map((value, index) => {
            const y = frame.originY - (index + 1) * frame.tickPixels;
            const visible = !specificationQuestion || index === 0;
            return <g key={`y-tick-${value}`}>
                <line x1={frame.originX - 5} y1={y} x2={frame.originX + 5} y2={y}
                    stroke="#334155" strokeWidth="2" />
                <text x={frame.originX - 13} y={y + 5} textAnchor="end"
                    className={`font-semibold text-[14px] ${visible ? 'fill-slate-800' : 'fill-slate-400'}`}>
                    {visible ? value : '__'}
                </text>
            </g>;
        })}
        <text x={frame.originX - 13} y={frame.originY + 24} textAnchor="end"
            className={`font-bold text-[16px] ${specificationQuestion ? 'fill-slate-400' : 'fill-slate-900'}`}>
            {specificationQuestion ? '__' : '0'}
        </text>
        <text x={xEnd + 17} y={frame.originY + 5} textAnchor="start"
            className={`font-bold text-[20px] ${specificationQuestion ? 'fill-slate-400' : 'fill-indigo-700'}`}>
            {specificationQuestion ? '__' : data.axes.horizontal.axisName}
        </text>
        <text x={frame.originX} y={yTop - 18} textAnchor="middle"
            className={`font-bold text-[20px] ${specificationQuestion ? 'fill-slate-400' : 'fill-emerald-700'}`}>
            {specificationQuestion ? '__' : data.axes.vertical.axisName}
        </text>
        {showRoute && <g data-coordinate-route="true">
            <defs>
                <marker id="x-travel-tip" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#4f46e5" />
                </marker>
                <marker id="y-travel-tip" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#059669" />
                </marker>
            </defs>
            {data.travel.xUnits > 0 && <line data-route-leg="x"
                x1={frame.originX + 5} y1={frame.originY} x2={xEndpoint.x - 5} y2={xEndpoint.y}
                stroke="#4f46e5" strokeWidth="5" markerEnd="url(#x-travel-tip)" />}
            {data.travel.yUnits > 0 && <line data-route-leg="y"
                x1={frame.originX} y1={frame.originY - 5} x2={yEndpoint.x} y2={yEndpoint.y + 5}
                stroke="#059669" strokeWidth="5" markerEnd="url(#y-travel-tip)" />}
            {data.travel.xUnits > 0 && data.travel.yUnits > 0 && <g
                stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 5">
                <line x1={xEndpoint.x} y1={xEndpoint.y} x2={end.x} y2={end.y} />
                <line x1={yEndpoint.x} y1={yEndpoint.y} x2={end.x} y2={end.y} />
            </g>}
            {(data.travel.xUnits > 0 || data.travel.yUnits > 0) && <circle
                cx={end.x} cy={end.y} r="5" fill="#0f172a" />}
        </g>}
    </svg>;
}

function SpecificationContent({data, isSolutionView}: {
    data: CoordinateSystemProblem; isSolutionView: boolean;
}) {
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Coordinate system</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Complete the coordinate frame</h1>
        <p className="mt-2 text-base text-slate-700">Label both perpendicular axes, mark their shared zero, and complete each number scale from its given first tick. Then name the axis used by each coordinate position.</p>
        <div className="mt-4 grid grid-cols-[470px_1fr] items-center gap-5">
            <CoordinateFrame data={data} task="specification" isSolutionView={isSolutionView} />
            <div className="space-y-3 text-base">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-800">Axes and origin</div>
                    {isSolutionView
                        ? <p className="mt-2 text-emerald-900">Horizontal: <strong>x</strong> &nbsp; Vertical: <strong>y</strong><br />Their common zero is the origin <strong>(0, 0)</strong>.</p>
                        : <p className="mt-2 text-slate-600">Horizontal: ____ &nbsp; Vertical: ____<br />Common zero: ____</p>}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-800">Coordinate convention</div>
                    {isSolutionView
                        ? <p className="mt-2 text-emerald-900">First coordinate → <strong>horizontal x-axis</strong><br />Second coordinate → <strong>vertical y-axis</strong></p>
                        : <p className="mt-2 text-slate-600">First coordinate → ____ axis<br />Second coordinate → ____ axis</p>}
                </div>
                {isSolutionView && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
                    Each axis increases by its displayed first-tick value at every equally spaced tick.
                </div>}
            </div>
        </div>
    </>;
}

function InterpretationContent({data, isSolutionView}: {
    data: CoordinateSystemProblem; isSolutionView: boolean;
}) {
    const {xUnits, yUnits} = data.travel;
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Coordinates</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Interpret the ordered pair</h1>
        <p className="mt-2 text-base text-slate-700">What does each number in <strong>({xUnits}, {yUnits})</strong> mean as travel from the origin? Explain the first and second components in order.</p>
        <div className="mt-4 grid grid-cols-[470px_1fr] items-center gap-5">
            <CoordinateFrame data={data} task="component-interpretation" isSolutionView={isSolutionView} />
            <div className="space-y-3">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center font-mono text-3xl font-bold text-indigo-950">
                    ({xUnits}, {yUnits})
                </div>
                {isSolutionView ? <>
                    <div className="rounded-xl border border-indigo-200 bg-white p-4 text-base text-slate-800">
                        <div className="font-bold text-indigo-700">First component: {xUnits}</div>
                        <p className="mt-1">Travel {xUnits} {xUnits === 1 ? 'unit' : 'units'} right from the origin along the horizontal x-axis.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-white p-4 text-base text-slate-800">
                        <div className="font-bold text-emerald-700">Second component: {yUnits}</div>
                        <p className="mt-1">Measured from the common zero, travel {yUnits} {yUnits === 1 ? 'unit' : 'units'} up along the vertical y-axis.</p>
                    </div>
                </> : <>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">First component means: ____________________</div>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">Second component means: ____________________</div>
                </>}
            </div>
        </div>
    </>;
}

export function CoordinateSystemBody({data, isSolutionView, task}: FrameProps) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm"
        style={{width: 960, maxWidth: '95vw'}}>
        {task === 'specification'
            ? <SpecificationContent data={data} isSolutionView={isSolutionView} />
            : <InterpretationContent data={data} isSolutionView={isSolutionView} />}
    </main>;
}
