import type {
    ContextualCoordinateProblem
} from '../../../types/problems.ts';
import {
    CONTEXT_GRID,
    contextPointPosition,
    locationLetter,
    locationName
} from './coordinate-context-helpers.ts';

export type CoordinateContextTask = 'plot' | 'interpret';

interface Props {
    data: ContextualCoordinateProblem;
    isSolutionView: boolean;
    task: CoordinateContextTask;
}

const grid = CONTEXT_GRID;
const tickValues = Array.from({length: grid.maximum + 1}, (_, index) => index);

function ContextGrid({data, isSolutionView, task}: Props) {
    const selected = data.locations.find(location => location.id === data.referenceLocationId)!;
    const displayed = task === 'plot'
        ? (isSolutionView ? data.locations : [])
        : [selected];
    const selectedPoint = contextPointPosition(selected);
    const showGuides = task === 'interpret' && isSolutionView;
    const end = grid.originX + grid.maximum * grid.cell;
    const top = grid.originY - grid.maximum * grid.cell;
    return <svg viewBox={`0 0 ${grid.width} ${grid.height}`} className="h-[450px] w-[470px]"
        role="img" aria-label={task === 'plot' && !isSolutionView
            ? 'Empty first-quadrant coordinate grid with x and y axes from zero to eight'
            : task === 'plot'
                ? 'First-quadrant coordinate grid with the three park landmarks marked'
                : 'First-quadrant coordinate grid with the selected park landmark marked'}>
        <rect width={grid.width} height={grid.height} rx="18" fill="#f8fafc" />
        {tickValues.map(tick => {
            const x = grid.originX + tick * grid.cell;
            const y = grid.originY - tick * grid.cell;
            return <g key={tick}>
                <line x1={x} y1={top} x2={x} y2={grid.originY} stroke="#dbeafe" strokeWidth="1" />
                <line x1={grid.originX} y1={y} x2={end} y2={y} stroke="#dbeafe" strokeWidth="1" />
                {tick > 0 && <>
                    <text x={x} y={grid.originY + 23} textAnchor="middle" className="fill-slate-700 text-[14px] font-semibold">{tick}</text>
                    <text x={grid.originX - 12} y={y + 5} textAnchor="end" className="fill-slate-700 text-[14px] font-semibold">{tick}</text>
                </>}
            </g>;
        })}
        <line x1={grid.originX} y1={grid.originY} x2={end + 5} y2={grid.originY}
            stroke="#334155" strokeWidth="3" />
        <line x1={grid.originX} y1={grid.originY} x2={grid.originX} y2={top - 5}
            stroke="#334155" strokeWidth="3" />
        <text x={grid.originX - 12} y={grid.originY + 23} textAnchor="end"
            className="fill-slate-900 text-[16px] font-bold">0</text>
        <text x={end + 17} y={grid.originY + 5} className="fill-indigo-700 text-[20px] font-bold">x</text>
        <text x={grid.originX} y={top - 17} textAnchor="middle"
            className="fill-emerald-700 text-[20px] font-bold">y</text>
        {showGuides && <g data-component-guides="true">
            <defs>
                <marker id="context-x-tip" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#4f46e5" />
                </marker>
                <marker id="context-y-tip" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#059669" />
                </marker>
            </defs>
            <line data-component-axis="x" x1={grid.originX + 5} y1={grid.originY}
                x2={selectedPoint.x - 5} y2={grid.originY} stroke="#4f46e5" strokeWidth="5"
                markerEnd="url(#context-x-tip)" />
            <line data-component-axis="y" x1={grid.originX} y1={grid.originY - 5}
                x2={grid.originX} y2={selectedPoint.y + 5} stroke="#059669" strokeWidth="5"
                markerEnd="url(#context-y-tip)" />
            <g stroke="#94a3b8" strokeDasharray="5 5" strokeWidth="1.5">
                <line x1={selectedPoint.x} y1={grid.originY} x2={selectedPoint.x} y2={selectedPoint.y} />
                <line x1={grid.originX} y1={selectedPoint.y} x2={selectedPoint.x} y2={selectedPoint.y} />
            </g>
        </g>}
        {displayed.map(location => {
            const point = contextPointPosition(location);
            return <g key={location.id} data-landmark-marker={location.id}>
                <circle cx={point.x} cy={point.y} r="16" fill="#4338ca" stroke="#ffffff" strokeWidth="3" />
                <text x={point.x} y={point.y + 5} textAnchor="middle" className="fill-white text-[14px] font-bold">
                    {locationLetter(location.id)}
                </text>
            </g>;
        })}
    </svg>;
}

function StoryContext() {
    return <p className="text-base leading-relaxed text-slate-700">
        The park gate is the starting point. On this map, <strong>x</strong> measures distance east of the gate,
        and <strong>y</strong> measures distance north of the gate. Both distances are measured in blocks.
    </p>;
}

function PlotTask({data, isSolutionView}: Omit<Props, 'task'>) {
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Park map</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Plot the park landmarks</h1>
        <p className="mt-2 text-base text-slate-700">Read each location description, then mark A, B, and C on the grid.</p>
        <div className="mt-4 grid grid-cols-[1fr_470px] items-start gap-5">
            <div className="space-y-3">
                <StoryContext />
                {data.locations.map(location => <div key={location.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800">
                    <span className="mr-2 inline-block rounded-full bg-indigo-600 px-2.5 py-1 text-sm font-bold text-white">{locationLetter(location.id)}</span>
                    <strong>{locationName(location.id)}</strong> is {location.xValue} {location.xValue === 1 ? 'block' : 'blocks'} east
                    and {location.yValue} {location.yValue === 1 ? 'block' : 'blocks'} north of the park gate.
                    {isSolutionView && <div className="mt-1 font-mono font-bold text-emerald-800">
                        {locationLetter(location.id)} = ({location.xValue}, {location.yValue})
                    </div>}
                </div>)}
            </div>
            <ContextGrid data={data} task="plot" isSolutionView={isSolutionView} />
        </div>
    </>;
}

function InterpretationTask({data, isSolutionView}: Omit<Props, 'task'>) {
    const selected = data.locations.find(location => location.id === data.referenceLocationId)!;
    const letter = locationLetter(selected.id);
    const name = locationName(selected.id);
    return <>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Park map</div>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Interpret a landmark's coordinates</h1>
        <p className="mt-2 text-base text-slate-700">What do the first and second values of point {letter}'s ordered pair mean for the {name.toLowerCase()}? Give each distance, direction, and unit.</p>
        <div className="mt-4 grid grid-cols-[1fr_470px] items-start gap-5">
            <div className="space-y-3">
                <StoryContext />
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <div className="text-sm font-bold text-indigo-800">{letter} marks the {name.toLowerCase()}</div>
                    <div className="mt-1 font-mono text-3xl font-bold text-indigo-950">{letter} = ({selected.xValue}, {selected.yValue})</div>
                </div>
                {isSolutionView ? <>
                    <div className="rounded-xl border border-indigo-200 bg-white p-4 text-base text-slate-800">
                        <strong className="text-indigo-700">First component: {selected.xValue}</strong>
                        <p className="mt-1">The {name.toLowerCase()} is {selected.xValue} {selected.xValue === 1 ? 'block' : 'blocks'} east of the park gate, measured from zero on the x-axis.</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-white p-4 text-base text-slate-800">
                        <strong className="text-emerald-700">Second component: {selected.yValue}</strong>
                        <p className="mt-1">The {name.toLowerCase()} is {selected.yValue} {selected.yValue === 1 ? 'block' : 'blocks'} north of the park gate, measured from zero on the y-axis.</p>
                    </div>
                </> : <>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">First component means: ____________________</div>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-base text-slate-600">Second component means: ____________________</div>
                </>}
            </div>
            <ContextGrid data={data} task="interpret" isSolutionView={isSolutionView} />
        </div>
    </>;
}

/** The leaf fixes whether the learner constructs points or reads a shown pair. */
export function CoordinateContextBody({data, isSolutionView, task}: Props) {
    return <main className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-sm"
        style={{width: 1010, maxWidth: '95vw'}}>
        {task === 'plot'
            ? <PlotTask data={data} isSolutionView={isSolutionView} />
            : <InterpretationTask data={data} isSolutionView={isSolutionView} />}
    </main>;
}
