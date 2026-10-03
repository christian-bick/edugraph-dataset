import type {CompositePrismPart, CompositePrismVolumeProblem} from '../../../types/problems.ts';
import {polygonPoints, prismViewport, projectCubeCorner} from './volume-unit-cube-helpers.ts';
import {compositeBounds, exposedCompositeFaces} from './volume-composite-prism-helpers.ts';

export type CompositeTask = 'additivity-explanation' | 'execution' | 'story';

const COLORS = {
    left: {top: '#bfdbfe', front: '#3b82f6', right: '#2563eb', text: '#1e3a8a'},
    right: {top: '#fde68a', front: '#f59e0b', right: '#d97706', text: '#92400e'}
} as const;

function CompositeDiagram({data}: {data: CompositePrismVolumeProblem}) {
    const [left, right] = data.parts;
    const bounds = compositeBounds(data);
    const viewport = prismViewport(bounds);
    const p = (column: number, row: number, layer: number) =>
        projectCubeCorner(bounds, column, row, layer);
    const frontOutline = (part: CompositePrismPart) => {
        const x0 = part.origin.column;
        const x1 = x0 + part.dimensions.length;
        const d = part.dimensions.depth;
        const h = part.dimensions.height;
        return [p(x0, d, 0), p(x1, d, 0), p(x1, d, h), p(x0, d, h)];
    };
    const topOutline = (part: CompositePrismPart) => {
        const x0 = part.origin.column;
        const x1 = x0 + part.dimensions.length;
        const h = part.dimensions.height;
        return [p(x0, 0, h), p(x1, 0, h), p(x1, bounds.rows, h), p(x0, bounds.rows, h)];
    };
    const seamBottom = p(left.dimensions.length, bounds.rows, 0);
    const seamTop = p(left.dimensions.length, bounds.rows,
        Math.min(left.dimensions.height, right.dimensions.height));
    const leftLabel = p(left.dimensions.length / 2, bounds.rows, left.dimensions.height / 2);
    const rightLabel = p(left.dimensions.length + right.dimensions.length / 2,
        bounds.rows, right.dimensions.height / 2);

    return (
        <svg viewBox={`0 0 ${viewport.width} ${viewport.height}`}
            className="mx-auto h-[290px] w-full max-w-[490px]" role="img"
            aria-label="One connected stepped solid with two colored rectangular-prism parts and a shared boundary">
            {exposedCompositeFaces(data).map((face, index) => {
                const fill = COLORS[face.partId][face.surface];
                return <polygon key={index} points={polygonPoints(face.points)} fill={fill}
                    stroke={fill} strokeWidth="1" strokeLinejoin="round" />;
            })}
            {[left, right].map(part => (
                <g key={part.id} fill="none" stroke="#334155" strokeWidth="1.7" strokeLinejoin="round">
                    <polygon points={polygonPoints(frontOutline(part))} />
                    <polygon points={polygonPoints(topOutline(part))} />
                </g>
            ))}
            <line x1={seamBottom.x} y1={seamBottom.y} x2={seamTop.x} y2={seamTop.y}
                stroke="#0f172a" strokeWidth="3" data-shared-seam="true" />
            <text x={leftLabel.x} y={leftLabel.y + 5} textAnchor="middle" fontSize="20" fontWeight="800"
                fill="#fff" stroke={COLORS.left.text} strokeWidth="0.8" paintOrder="stroke">A</text>
            <text x={rightLabel.x} y={rightLabel.y + 5} textAnchor="middle" fontSize="20" fontWeight="800"
                fill="#fff" stroke={COLORS.right.text} strokeWidth="0.8" paintOrder="stroke">B</text>
        </svg>
    );
}

function PartMeasurements({data}: {data: CompositePrismVolumeProblem}) {
    return (
        <div className="mt-3 grid grid-cols-2 gap-3">
            {data.parts.map(part => (
                <div key={part.id} className={`rounded-xl border-2 px-4 py-3 ${
                    part.id === 'left' ? 'border-blue-300 bg-blue-50' : 'border-amber-300 bg-amber-50'
                }`}>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Part {part.id === 'left' ? 'A' : 'B'}
                    </div>
                    <div className="mt-1 text-lg font-bold text-slate-900">
                        {part.dimensions.length} u long × {part.dimensions.depth} u deep × {part.dimensions.height} u high
                    </div>
                </div>
            ))}
        </div>
    );
}

function AnswerPanel({isSolutionView, blankLabel, children}: {
    isSolutionView: boolean;
    blankLabel: string;
    children: React.ReactNode;
}) {
    return isSolutionView ? (
        <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-lg font-semibold leading-snug text-emerald-950">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">Solution</div>
            {children}
        </div>
    ) : (
        <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-500">
            {blankLabel} <span className="inline-block w-64 border-b-2 border-slate-300">&nbsp;</span>
        </div>
    );
}

function ProductEquations({data}: {data: CompositePrismVolumeProblem}) {
    const [left, right] = data.parts;
    const sum = data.volumeSum;
    return (
        <div className="space-y-1 font-mono text-base">
            <div>V<sub>A</sub> = {left.dimensions.length} × {left.dimensions.depth} × {left.dimensions.height} = {left.volumeCubicUnits} u³</div>
            <div>V<sub>B</sub> = {right.dimensions.length} × {right.dimensions.depth} × {right.dimensions.height} = {right.volumeCubicUnits} u³</div>
            <div className="font-extrabold">V<sub>whole</sub> = {sum.addendsCubicUnits[0]} + {sum.addendsCubicUnits[1]} = {sum.totalCubicUnits} u³</div>
        </div>
    );
}

function AdditivityExplanation({data, isSolutionView}: {
    data: CompositePrismVolumeProblem; isSolutionView: boolean;
}) {
    return (
        <div className="w-[820px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Why the volumes add</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                Parts A and B form one stepped solid. Explain why adding their volumes gives the whole volume.
            </p>
            <p className="mt-1 text-sm text-slate-600">u is one length unit. The measurements describe the two parts.</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CompositeDiagram data={data} />
            </div>
            <PartMeasurements data={data} />
            <AnswerPanel isSolutionView={isSolutionView} blankLabel="Explain:">
                A and B meet at a face, but their interiors do not overlap. Together they fill the whole solid.
                The shared face has area {data.sharedFace.areaSquareUnits} u² but zero volume,
                so V<sub>whole</sub> = V<sub>A</sub> + V<sub>B</sub>
                = {data.volumeSum.addendsCubicUnits[0]} u³ + {data.volumeSum.addendsCubicUnits[1]} u³
                = {data.volumeSum.totalCubicUnits} u³.
            </AnswerPanel>
        </div>
    );
}

function CompositeExecution({data, isSolutionView}: {
    data: CompositePrismVolumeProblem; isSolutionView: boolean;
}) {
    return (
        <div className="w-[860px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Calculate a composite volume</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                Find the volume of each rectangular-prism part, then add them to find the whole volume.
            </p>
            <p className="mt-1 text-sm text-slate-600">u is one length unit. Give each volume in u³.</p>
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CompositeDiagram data={data} />
            </div>
            <PartMeasurements data={data} />
            <AnswerPanel isSolutionView={isSolutionView} blankLabel="Part A, Part B, total:">
                <ProductEquations data={data} />
            </AnswerPanel>
        </div>
    );
}

function CompositeStory({data, isSolutionView}: {
    data: CompositePrismVolumeProblem; isSolutionView: boolean;
}) {
    const [left, right] = data.parts;
    return (
        <div className="w-[860px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">A two-part storage platform</div>
            <div className="mt-4 rounded-xl border-l-4 border-indigo-500 bg-slate-50 px-5 py-4 text-lg font-semibold leading-relaxed text-slate-900">
                A storage platform is built from two joined rectangular blocks. The blue left part A is
                {' '}{left.dimensions.length} u long, {left.dimensions.depth} u deep, and {left.dimensions.height} u high.
                The gold right part B is {right.dimensions.length} u long, the same {right.dimensions.depth} u deep,
                and {right.dimensions.height} u high. How many cubic units of space does the entire platform occupy?
            </div>
            <p className="mt-2 text-sm text-slate-600">u is one length unit. Read each part’s dimensions from the story.</p>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2">
                <CompositeDiagram data={data} />
            </div>
            <AnswerPanel isSolutionView={isSolutionView} blankLabel="Two products and their sum:">
                <ProductEquations data={data} />
            </AnswerPanel>
        </div>
    );
}

export function CompositePrismBody({data, isSolutionView, task}: {
    data: CompositePrismVolumeProblem;
    isSolutionView: boolean;
    task: CompositeTask;
}) {
    if (task === 'additivity-explanation') return <AdditivityExplanation data={data} isSolutionView={isSolutionView} />;
    if (task === 'execution') return <CompositeExecution data={data} isSolutionView={isSolutionView} />;
    return <CompositeStory data={data} isSolutionView={isSolutionView} />;
}
