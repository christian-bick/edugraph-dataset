import type {
    RectangularPrismCellGroup, RectangularPrismVolumeProblem
} from '../../../types/problems.ts';
import {
    assembledPrismFaces, polygonPoints, prismViewport, projectCubeCorner
} from './volume-unit-cube-helpers.ts';
import {prismExpression} from './volume-rectangular-prism-helpers.ts';

export type PrismTask = 'packing-explanation' | 'product-model' | 'formula-execution' | 'formula-story';

const FACE_COLOR = {left: '#818cf8', right: '#4f46e5', top: '#c7d2fe'} as const;

function CubeGlyph({small}: {small: boolean}) {
    return (
        <svg aria-hidden="true" viewBox="0 0 74 78"
            className={small ? 'h-[29px] w-[27px]' : 'h-[36px] w-[34px]'}>
            <polygon points="37,3 68,20 37,37 6,20" fill="#c7d2fe" stroke="#334155" strokeWidth="1.5" />
            <polygon points="6,20 37,37 37,72 6,55" fill="#818cf8" stroke="#334155" strokeWidth="1.5" />
            <polygon points="37,37 68,20 68,55 37,72" fill="#4f46e5" stroke="#334155" strokeWidth="1.5" />
        </svg>
    );
}

type PrismDrawingMode = 'packed' | 'outline';
type DimensionLabels = 'three-edges' | 'base-area-height' | 'none';

function PrismDrawing({data, mode, labels}: {
    data: RectangularPrismVolumeProblem;
    mode: PrismDrawingMode;
    labels: DimensionLabels;
}) {
    const {length, width, height} = data.dimensions;
    const bounds = {columns: length, rows: width, layers: height};
    const viewport = prismViewport(bounds);
    const p = (column: number, row: number, layer: number) =>
        projectCubeCorner(bounds, column, row, layer);
    const top = [p(0, 0, height), p(length, 0, height), p(length, width, height), p(0, width, height)];
    const left = [p(0, width, 0), p(length, width, 0), p(length, width, height), p(0, width, height)];
    const right = [p(length, 0, 0), p(length, width, 0), p(length, width, height), p(length, 0, height)];
    const lengthEdge = p(length / 2, width, 0);
    const widthEdge = p(length, width / 2, 0);
    const heightEdge = p(length, width, height / 2);
    return (
        <svg role="img" aria-label={mode === 'packed' ? 'Rectangular prism with unit-cube seams' : 'Empty rectangular prism outline'}
            viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            className="mx-auto h-[225px] w-full max-w-[340px]">
            {mode === 'packed' ? assembledPrismFaces(bounds).map((face, index) => (
                <polygon key={index} points={polygonPoints(face.points)} fill={FACE_COLOR[face.surface]}
                    stroke="#334155" strokeWidth="1.3" strokeLinejoin="round" />
            )) : (
                <>
                    <polygon points={polygonPoints(left)} fill="#e0e7ff" stroke="#334155" strokeWidth="2" />
                    <polygon points={polygonPoints(right)} fill="#c7d2fe" stroke="#334155" strokeWidth="2" />
                    <polygon points={polygonPoints(top)} fill="#eef2ff" stroke="#334155" strokeWidth="2" />
                </>
            )}
            {labels === 'three-edges' && (
                <>
                    <text x={lengthEdge.x} y={lengthEdge.y + 14} textAnchor="middle"
                        fontSize="13" fontWeight="700" fill="#312e81">{length} u</text>
                    <text x={widthEdge.x + 11} y={widthEdge.y + 7}
                        fontSize="13" fontWeight="700" fill="#312e81">{width} u</text>
                    <text x={heightEdge.x + 9} y={heightEdge.y}
                        fontSize="13" fontWeight="700" fill="#312e81">{height} u</text>
                </>
            )}
            {labels === 'base-area-height' && (
                <>
                    <text x={viewport.width / 2} y="16" textAnchor="middle"
                        fontSize="13" fontWeight="700" fill="#312e81">Base area {data.baseAreaSquareUnits} u²</text>
                    <text x={heightEdge.x + 9} y={heightEdge.y}
                        fontSize="13" fontWeight="700" fill="#312e81">{height} u high</text>
                </>
            )}
        </svg>
    );
}

function GroupPanels({groups, columns, showCubes, compact, heading}: {
    groups: readonly RectangularPrismCellGroup[];
    columns: number;
    showCubes: boolean;
    compact: boolean;
    heading: string;
}) {
    const size = compact ? 30 : 37;
    return (
        <div className="min-w-0">
            <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-indigo-800">{heading}</div>
            <div className="flex flex-wrap justify-center gap-2.5">
                {groups.map(group => (
                    <div key={group.index} className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-1.5">
                        <div className="mb-1 text-center text-xs font-bold text-indigo-900">
                            {heading === 'Base layers' ? 'Layer' : 'Slice'} {group.index + 1}
                        </div>
                        <div className="grid gap-0.5" style={{gridTemplateColumns: `repeat(${columns}, ${size}px)`}}>
                            {group.cells.map((cell, cellIndex) => (
                                <div key={`${cell.layer}-${cell.row}-${cell.column}-${cellIndex}`}
                                    data-prism-cell={showCubes ? `${cell.layer}-${cell.row}-${cell.column}` : undefined}
                                    data-empty-slot={!showCubes ? 'true' : undefined}
                                    className={`${compact ? 'h-[32px] w-[30px]' : 'h-[39px] w-[37px]'} flex items-center justify-center rounded border ${
                                        showCubes ? 'border-indigo-100 bg-white' : 'border-dashed border-indigo-400 bg-white'
                                    }`}>
                                    {showCubes && <CubeGlyph small={compact} />}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ResponsePanel({isSolutionView, blankLabel, children}: {
    isSolutionView: boolean;
    blankLabel: string;
    children: React.ReactNode;
}) {
    return isSolutionView ? (
        <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-3 text-base font-semibold leading-snug text-emerald-950">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Solution</div>
            {children}
        </div>
    ) : (
        <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 text-base font-semibold text-slate-500">
            {blankLabel} <span className="inline-block w-52 border-b-2 border-slate-300">&nbsp;</span>
        </div>
    );
}

function PackingExplanation({data, isSolutionView}: {
    data: RectangularPrismVolumeProblem; isSolutionView: boolean;
}) {
    const {length, width, height} = data.dimensions;
    return (
        <div className="w-[1030px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">From packing to a product</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                The unit cubes fill this rectangular prism. Explain why the cube count, three-edge product,
                and base-area product give the same volume. Write both equations.
            </p>
            <p className="mt-1 text-sm text-slate-600">Here 1 u is one cube edge, so each cube occupies 1 u³.</p>
            <div className="mt-4 grid grid-cols-[320px_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                    <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-600">Packed prism</div>
                    <PrismDrawing data={data} mode="packed" labels="three-edges" />
                </div>
                <GroupPanels groups={data.heightLayers} columns={length} showCubes compact={false}
                    heading="Base layers" />
            </div>
            <ResponsePanel isSolutionView={isSolutionView} blankLabel="Explanation and equations:">
                <p>Each layer has {length} × {width} = {data.baseAreaSquareUnits} cubes, and all {height} layers fill the solid without gaps or overlaps.</p>
                <p className="mt-1 font-mono">V = ({length} × {width}) × {height} = {data.baseAreaSquareUnits} × {height} = {data.cubeCount} u³</p>
                <p className="mt-1">{data.cubeCount} cubes × 1 u³ per cube = {data.volumeCubicUnits} u³.</p>
            </ResponsePanel>
        </div>
    );
}

function ProductModel({data, isSolutionView}: {
    data: RectangularPrismVolumeProblem; isSolutionView: boolean;
}) {
    const {length, width, height} = data.dimensions;
    const regrouping = data.associativeRegrouping;
    return (
        <div className="w-[1000px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Build a product model</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                Build a {length} × {width} × {height} unit-cube prism. Fill the empty cube slots by layer
                {regrouping && ' and show the same cubes regrouped into column slices'}.
            </p>
            <p className="mt-1 text-sm text-slate-600">Each edge unit u is one small cube edge.</p>
            <div className="mt-4 grid grid-cols-[280px_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div>
                    <div className="text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                        {isSolutionView ? 'Completed prism' : 'Prism to build'}
                    </div>
                    <PrismDrawing data={data} mode={isSolutionView ? 'packed' : 'outline'} labels="three-edges" />
                </div>
                <GroupPanels groups={data.heightLayers} columns={length} showCubes={isSolutionView}
                    compact heading="Base layers" />
            </div>
            {regrouping && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="mb-1 text-sm font-bold text-amber-900">
                        Regroup the same cubes: ({length} × {width}) × {height} and {length} × ({width} × {height})
                    </div>
                    <GroupPanels groups={regrouping.columnSlices} columns={width} showCubes={isSolutionView}
                        compact heading="Column slices" />
                </div>
            )}
            <ResponsePanel isSolutionView={isSolutionView} blankLabel="Model and product:">
                <p>Each base layer has {data.baseAreaSquareUnits} cubes, and {height} layers make {data.volumeCubicUnits} unit cubes.</p>
                <p className="mt-1 font-mono">({length} × {width}) × {height} = {data.baseAreaSquareUnits} × {height} = {data.volumeCubicUnits}</p>
                {regrouping && <p className="mt-1 font-mono">{length} × ({width} × {height}) = {length} × {regrouping.widthHeightProduct} = {data.volumeCubicUnits}</p>}
            </ResponsePanel>
        </div>
    );
}

function FormulaExecution({data, isSolutionView}: {
    data: RectangularPrismVolumeProblem; isSolutionView: boolean;
}) {
    const expression = prismExpression(data);
    const input = data.measuredInput;
    return (
        <div className="w-[790px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Calculate prism volume</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                Use {input.kind === 'three-edges' ? 'the three edge lengths' : 'the base area and height'} to find the volume of this rectangular prism.
            </p>
            <p className="mt-1 text-sm text-slate-600">u is one length unit; report volume in u³.</p>
            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                <PrismDrawing data={data} mode="outline" labels={input.kind} />
            </div>
            <ResponsePanel isSolutionView={isSolutionView} blankLabel="Formula, substitution, volume:">
                <div className="space-y-1 font-mono">
                    <div>{expression.formula}</div>
                    <div>{expression.substitution}</div>
                    <div className="font-extrabold">{expression.answer}</div>
                </div>
            </ResponsePanel>
        </div>
    );
}

function FormulaStory({data, isSolutionView}: {
    data: RectangularPrismVolumeProblem; isSolutionView: boolean;
}) {
    const input = data.measuredInput;
    const expression = prismExpression(data);
    const story = input.kind === 'three-edges'
        ? `A rectangular storage crate has an inside length of ${input.lengthUnits} u, an inside width of ${input.widthUnits} u, and an inside height of ${input.heightUnits} u.`
        : `A rectangular storage crate has a base area of ${input.baseAreaSquareUnits} u² and an inside height of ${input.heightUnits} u.`;
    return (
        <div className="w-[790px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Volume in a situation</div>
            <div className="mt-4 rounded-xl border-l-4 border-indigo-500 bg-slate-50 px-5 py-5 text-xl font-semibold leading-relaxed text-slate-900">
                <p>{story}</p>
                <p className="mt-3">How many cubic units of space are inside the crate?</p>
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                <PrismDrawing data={data} mode="outline" labels="none" />
            </div>
            <p className="mt-3 text-sm text-slate-600">u is one length unit. Read the measurements in the story, then calculate the volume in u³.</p>
            <ResponsePanel isSolutionView={isSolutionView} blankLabel="Formula, substitution, answer:">
                <div className="space-y-1 font-mono">
                    <div>{expression.formula}</div>
                    <div>{expression.substitution}</div>
                    <div className="font-extrabold">The crate holds {data.volumeCubicUnits} u³.</div>
                </div>
            </ResponsePanel>
        </div>
    );
}

export function RectangularPrismBody({data, isSolutionView, task}: {
    data: RectangularPrismVolumeProblem;
    isSolutionView: boolean;
    task: PrismTask;
}) {
    if (task === 'packing-explanation') return <PackingExplanation data={data} isSolutionView={isSolutionView} />;
    if (task === 'product-model') return <ProductModel data={data} isSolutionView={isSolutionView} />;
    if (task === 'formula-execution') return <FormulaExecution data={data} isSolutionView={isSolutionView} />;
    return <FormulaStory data={data} isSolutionView={isSolutionView} />;
}
