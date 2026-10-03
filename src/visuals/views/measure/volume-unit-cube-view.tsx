import type {UnitCubeVolumeProblem} from '../../../types/problems.ts';
import {
    assembledPrismFaces, polygonPoints, prismViewport, volumeUnit
} from './volume-unit-cube-helpers.ts';

export type UnitCubeTask = 'specification' | 'interpretation' | 'count';

const FACE_COLOR = {left: '#818cf8', right: '#4f46e5', top: '#c7d2fe'} as const;

function CubeGlyph() {
    return (
        <svg aria-hidden="true" viewBox="0 0 74 78" className="h-[48px] w-[46px]">
            <polygon points="37,3 68,20 37,37 6,20" fill="#c7d2fe" stroke="#334155" strokeWidth="1.5" />
            <polygon points="6,20 37,37 37,72 6,55" fill="#818cf8" stroke="#334155" strokeWidth="1.5" />
            <polygon points="37,37 68,20 68,55 37,72" fill="#4f46e5" stroke="#334155" strokeWidth="1.5" />
        </svg>
    );
}

function SingleUnitCube({edgeUnit}: {edgeUnit: string}) {
    return (
        <svg viewBox="0 0 330 225" className="mx-auto h-[225px] w-[330px]" role="img"
            aria-label={`A cube with three visible one-${edgeUnit} edge directions; every edge is one ${edgeUnit}`}>
            <polygon points="165,20 243,65 165,110 87,65" fill="#c7d2fe" stroke="#334155" strokeWidth="2" />
            <polygon points="87,65 165,110 165,200 87,155" fill="#818cf8" stroke="#334155" strokeWidth="2" />
            <polygon points="165,110 243,65 243,155 165,200" fill="#4f46e5" stroke="#334155" strokeWidth="2" />
            <line x1="165" y1="20" x2="243" y2="65" stroke="#f59e0b" strokeWidth="4" />
            <line x1="87" y1="65" x2="165" y2="20" stroke="#f59e0b" strokeWidth="4" />
            <line x1="243" y1="65" x2="243" y2="155" stroke="#f59e0b" strokeWidth="4" />
            <text x="100" y="32" fontSize="16" fontWeight="700" fill="#92400e">1 {edgeUnit}</text>
            <text x="236" y="31" fontSize="16" fontWeight="700" fill="#92400e">1 {edgeUnit}</text>
            <text x="253" y="119" fontSize="16" fontWeight="700" fill="#92400e">1 {edgeUnit}</text>
        </svg>
    );
}

function AssembledPrism({bounds}: {bounds: UnitCubeVolumeProblem['bounds']}) {
    const {width, height} = prismViewport(bounds);
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="mx-auto h-[240px] w-full max-w-[330px]"
            role="img" aria-label="Assembled solid with unit-cube seams on its outside faces">
            {assembledPrismFaces(bounds).map((face, index) => (
                <polygon key={index} points={polygonPoints(face.points)} fill={FACE_COLOR[face.surface]}
                    stroke="#334155" strokeWidth="1.4" strokeLinejoin="round" />
            ))}
        </svg>
    );
}

function ExplodedLayers({data, isSolutionView, countingTrace}: {
    data: UnitCubeVolumeProblem;
    isSolutionView: boolean;
    countingTrace?: NonNullable<UnitCubeVolumeProblem['countingTrace']>;
}) {
    const {columns, layers} = data.bounds;
    const traceByCell = countingTrace === undefined ? null : new Map(
        countingTrace.map(step => [`${step.cell.layer}-${step.cell.row}-${step.cell.column}`, step.ordinal])
    );
    return (
        <div className="flex flex-wrap justify-center gap-3" aria-label="Separated aligned layers showing every unit cube">
            {Array.from({length: layers}, (_, layer) => {
                const cells = data.occupiedCells.filter(cell => cell.layer === layer);
                const layerCount = countingTrace === undefined ? cells.length
                    : countingTrace.filter(step => step.cell.layer === layer).length;
                return <div key={layer} className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-xs font-bold text-indigo-900">
                        <span>Layer {layer + 1}</span>
                        {isSolutionView && <span>{layerCount} cubes</span>}
                    </div>
                    <div className="grid gap-x-0.5 gap-y-0.5" style={{gridTemplateColumns: `repeat(${columns}, 46px)`}}>
                        {cells.map(cell => (
                            <div key={`${cell.layer}-${cell.row}-${cell.column}`}
                                data-unit-cell={`${cell.layer}-${cell.row}-${cell.column}`}
                                className="relative flex h-[49px] w-[46px] items-center justify-center rounded border border-indigo-100 bg-white">
                                <CubeGlyph />
                                {traceByCell && <span data-cube-ordinal="true"
                                    className="absolute bottom-0 right-0 rounded bg-white px-0.5 text-[10px] font-extrabold leading-[13px] text-indigo-950">
                                    {traceByCell.get(`${cell.layer}-${cell.row}-${cell.column}`)}
                                </span>}
                            </div>
                        ))}
                    </div>
                </div>;
            })}
        </div>
    );
}

function PackingDiagram({data, isSolutionView, countingTrace}: {
    data: UnitCubeVolumeProblem;
    isSolutionView: boolean;
    countingTrace?: NonNullable<UnitCubeVolumeProblem['countingTrace']>;
}) {
    return (
        <div className="mt-4 grid grid-cols-[330px_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-600">Assembled solid</div>
                <AssembledPrism bounds={data.bounds} />
            </div>
            <div className="text-center">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Same cubes, separated by layer</div>
                <ExplodedLayers data={data} isSolutionView={isSolutionView} countingTrace={countingTrace} />
            </div>
        </div>
    );
}

function AnswerPanel({isSolutionView, children, questionLabel}: {
    isSolutionView: boolean;
    children: React.ReactNode;
    questionLabel: string;
}) {
    return isSolutionView ? (
        <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 px-5 py-4 text-lg font-semibold leading-snug text-emerald-950">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-700">Solution</div>
            {children}
        </div>
    ) : (
        <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 text-lg font-semibold text-slate-500">
            {questionLabel} <span className="inline-block w-56 border-b-2 border-slate-300">&nbsp;</span>
        </div>
    );
}

function SpecificationBody({data, isSolutionView}: {
    data: UnitCubeVolumeProblem; isSolutionView: boolean;
}) {
    const unit = volumeUnit(data.unitId);
    return (
        <div className="w-[760px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Define a measuring cube</div>
            <p className="mt-3 text-xl font-semibold text-slate-900">
                All the edges of this cube measure 1 {unit.length}. Name the solid and state its volume.
            </p>
            {data.unitId === 'generic' && <p className="mt-1 text-sm text-slate-600">{unit.definition}</p>}
            <div className="mt-4 grid grid-cols-[360px_1fr] items-center gap-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                <SingleUnitCube edgeUnit={unit.length} />
                <div className="space-y-3 text-lg font-semibold text-slate-800">
                    <div className="rounded-lg bg-white p-3">Edge length: <b>1 {unit.length}</b> <span className="text-sm text-slate-500">(length)</span></div>
                    <div className="rounded-lg bg-white p-3">One square face: <b>1 {unit.square}</b> <span className="text-sm text-slate-500">(area)</span></div>
                    <div className="rounded-lg bg-white p-3">Whole solid: <b>{isSolutionView ? `1 ${unit.cubic}` : '?'}</b> <span className="text-sm text-slate-500">(volume)</span></div>
                </div>
            </div>
            <AnswerPanel isSolutionView={isSolutionView} questionLabel="Name and volume:">
                A cube with every edge 1 {unit.length} is a unit cube. Its face has area 1 {unit.square},
                and the whole cube has volume <strong>1 {unit.cubic}</strong>.
            </AnswerPanel>
        </div>
    );
}

function InterpretationBody({data, isSolutionView}: {
    data: UnitCubeVolumeProblem; isSolutionView: boolean;
}) {
    const unit = volumeUnit(data.unitId);
    return (
        <div className="w-[900px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Interpret a cube packing</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                The separated layers show every cube in the solid. Why does counting them give its volume?
            </p>
            <p className="mt-1 text-sm text-slate-600">
                {data.unitId === 'generic' ? `${unit.definition} Each small cube represents 1 ${unit.cubic}.` :
                    `Every small cube has 1-${unit.length} edges and volume 1 ${unit.cubic}.`}
            </p>
            <PackingDiagram data={data} isSolutionView={isSolutionView} />
            <AnswerPanel isSolutionView={isSolutionView} questionLabel="Explain:">
                The congruent cubes fill the solid without gaps or overlaps. Each cube occupies 1 {unit.cubic},
                so {data.cubeCount} cubes × 1 {unit.cubic} per cube = <strong>{data.cubeCount} {unit.cubic}</strong>.
            </AnswerPanel>
        </div>
    );
}

function CountBody({data, isSolutionView}: {
    data: UnitCubeVolumeProblem; isSolutionView: boolean;
}) {
    const unit = volumeUnit(data.unitId);
    const trace = data.countingTrace;
    const layerCounts = Array.from({length: data.bounds.layers}, (_, layer) =>
        trace === undefined ? data.occupiedCells.filter(cell => cell.layer === layer).length
            : trace.filter(step => step.cell.layer === layer).length
    );
    return (
        <div className="w-[900px] rounded-2xl bg-white p-6 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.09)]">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">Count unit cubes</div>
            <p className="mt-3 text-lg font-semibold text-slate-900">
                Count every small cube in the separated layers. What is the solid’s volume in {unit.name}?
            </p>
            <p className="mt-1 text-sm text-slate-600">
                {data.unitId === 'generic' ? `${unit.definition} Each small cube defines 1 ${unit.cubic}.` :
                    `Each small cube has 1-${unit.length} edges and occupies 1 ${unit.cubic}.`}
            </p>
            <PackingDiagram data={data} isSolutionView={isSolutionView}
                countingTrace={isSolutionView ? trace : undefined} />
            <AnswerPanel isSolutionView={isSolutionView} questionLabel={`Volume in ${unit.cubic}:`}>
                {data.bounds.layers === 1 ? `${layerCounts[0]} cubes` : `${layerCounts.join(' + ')} = ${data.cubeCount} cubes`}
                {' = '}<strong>{data.cubeCount} {unit.cubic}</strong>.
            </AnswerPanel>
        </div>
    );
}

export function VolumeUnitCubeBody({data, isSolutionView, task}: {
    data: UnitCubeVolumeProblem;
    isSolutionView: boolean;
    task: UnitCubeTask;
}) {
    if (task === 'specification') return <SpecificationBody data={data} isSolutionView={isSolutionView} />;
    if (task === 'interpretation') return <InterpretationBody data={data} isSolutionView={isSolutionView} />;
    return <CountBody data={data} isSolutionView={isSolutionView} />;
}
