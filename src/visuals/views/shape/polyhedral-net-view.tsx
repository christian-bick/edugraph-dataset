import type {PolyhedralNetProblem as Problem} from '../../../types/problems.ts';
import {NetFaceCard, NetPlanarDiagram, NetSolidDiagram} from './polyhedral-net-diagram.tsx';
import {netFace, netFaceName, netVertexName, NetDimensionPremises, NetSurfaceWork} from './polyhedral-net-format.tsx';

export type PolyhedralNetTask = 'construction' | 'surface-area';

function SourceAdjacency({data}: {data: Problem}) {
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" data-role="net-source-adjacency">
        <p className="mb-2 font-semibold">Shared edges on the solid</p>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1">{data.solid.edges.map(edge => <p key={edge.edgeId}>{edge.vertexIds.map(id => netVertexName(data, id)).join('')}: {edge.incidences.map(value => netFaceName(data, value.faceId)).join(' and ')}</p>)}</div>
    </div>;
}

export function PolyhedralNetBody({data, task, story, isSolutionView, seed}: {data: Problem; task: PolyhedralNetTask; story: boolean; isSolutionView: boolean; seed: number}) {
    const construction = task === 'construction';
    return <main className="w-[780px] max-w-full space-y-5 rounded-2xl bg-white p-7 font-sans text-[17px] text-slate-800 shadow-sm">
        <p className="text-xl font-semibold">{construction ? 'Draw a connected net for this solid.' : 'Find the surface area of the solid from this net.'}</p>
        <NetDimensionPremises data={data} story={story} construction={construction} />
        {construction && <>
            <NetSolidDiagram data={data} seed={seed} />
            <SourceAdjacency data={data} />
            <p className="text-sm text-slate-600">Each detached card is one face. Matching vertex names identify its place on the solid; the cards are separate shape references.</p>
            <div className="grid grid-cols-3 gap-3" data-role="net-source-face-inventory">{data.solid.faces.map(face => <NetFaceCard key={face.faceId} data={data} face={netFace(data, face.faceId)} construction />)}</div>
        </>}
        {!construction && <>
            <NetPlanarDiagram data={data} solved={false} />
            <p className="text-sm text-slate-600">Dashed shared edges are folds. Short-dashed perpendiculars mark triangle face heights; supporting-line extensions are dotted.</p>
        </>}
        {construction ? isSolutionView ? <section className="rounded-lg border border-emerald-300 p-3 text-emerald-700" data-role="net-construction-answer">
            <p className="font-semibold">One connected net</p><NetPlanarDiagram data={data} solved />
            <p>Each face occurs once. Dashed shared edges are folds; the remaining boundary edges meet at their matching named edges on the closed solid.</p>
        </section> : <section className="rounded-lg border-2 border-dashed border-slate-300 p-4" data-role="net-construction-blank">
            <p className="text-sm text-slate-500">Draw the faces joined along matching edges.</p><div style={{height: 130}} />
        </section> : isSolutionView ? <NetSurfaceWork data={data} /> : <div className="rounded-lg border-2 border-dashed border-slate-300 p-4" data-role="net-area-blank"><p>Face areas: ____________________</p><p className="mt-4">Total surface area: ____________________</p></div>}
    </main>;
}
