import type {PolygonAreaDissectionProblem as Problem} from '../../../types/problems.ts';
import {exactNumericNotation, exactNumericValue} from '../operations/numerical-power-expression-format.tsx';
import {areaBounds, areaScreenPoint, PolygonAreaDiagram, PolygonAreaTray} from './polygon-area-diagram.tsx';
import {areaCellName, areaDimensionName, areaMeasure, areaPointName, PolygonAreaArithmetic, PolygonAreaLengthWork, PolygonAreaPremises, PolygonAreaSumWork} from './polygon-area-format.tsx';

export type PolygonAreaTask = 'composition' | 'decomposition';
const green = 'rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900';

function PolygonAreaTriangleWork({data}: {data: Problem}) {
    return <div className="grid grid-cols-2 gap-3" data-role="polygon-area-triangle-work">{data.source.cells.map(cell => <section className="rounded-lg border border-emerald-200 p-3" key={cell.cellId}>
        <h3 className="font-semibold">{areaCellName(data, cell.cellId)}</h3>
        <div><PolygonAreaDiagram data={data} boundary={cell.vertices} cells={[]} sourceCuts={false} showDimensions={false} shapeMarks={false} solution heightCell={cell} scale={Math.min(160 / (areaBounds(cell.vertices.map(id => areaScreenPoint(data, id))).maxX - areaBounds(cell.vertices.map(id => areaScreenPoint(data, id))).minX), 110 / (areaBounds(cell.vertices.map(id => areaScreenPoint(data, id))).maxY - areaBounds(cell.vertices.map(id => areaScreenPoint(data, id))).minY))} />
            <div className="space-y-2"><p>Base {areaDimensionName(data, cell.base.measureId)}: {exactNumericNotation(areaMeasure(data, cell.base.measureId).notation)} {data.units.length.name}.</p>
                <p>Perpendicular height {areaDimensionName(data, cell.height.measureId)}: {exactNumericNotation(areaMeasure(data, cell.height.measureId).notation)} {data.units.length.name}.</p>
                {cell.height.footLocation === 'base-line-extension' && <p className="text-sm">The height meets the extended base line; the dotted extension is not a partition cut.</p>}
                <p><PolygonAreaArithmetic value={cell.baseHeightProduct} /></p><p><PolygonAreaArithmetic value={cell.halfProduct} /></p>
                <p>Triangle area: {exactNumericValue(cell.area)} {data.units.area.name}.</p>
            </div>
        </div>
    </section>)}</div>;
}

function PolygonAreaAssemblyWork({data}: {data: Problem}) {
    const derivation = data.assembly.areaDerivation;
    return <div className="space-y-3" data-role="polygon-area-assembly-work">
        {derivation.kind === 'rectangle-product' ? <><p>The assembled outline is a rectangle. Its adjacent perpendicular full edges are:</p>
            {[derivation.firstMeasureId, derivation.secondMeasureId].map(id => {const measure = areaMeasure(data, id); return <p key={id}>{areaDimensionName(data, id)} ({areaPointName(data, measure.segment.fromId)} to {areaPointName(data, measure.segment.toId)}): {exactNumericNotation(measure.notation)} {data.units.length.name}.</p>;})}
            <p>Rectangle area: <PolygonAreaArithmetic value={derivation.product} /> {data.units.area.name}.</p></>
            : <PolygonAreaSumWork data={data} value={data.assembly.areaSum} assembled />}
        <p>The assembled area accounts for {data.assembly.copyCount} {data.assembly.copyCount === 1 ? 'copy' : 'copies'} of the original region:</p>
        <p><PolygonAreaArithmetic value={data.assembly.copyAreaProduct} /></p>
        <p>Recover the area of ONE original region: <PolygonAreaArithmetic value={data.assembly.sourceAreaNormalization} />.</p>
    </div>;
}

export function PolygonAreaBody({data, task, story, isSolutionView, seed}: {data: Problem; task: PolygonAreaTask; story: boolean; isSolutionView: boolean; seed: number}) {
    const composition = task === 'composition';
    const sourceCells = data.source.cells.map(cell => ({id: cell.cellId, vertices: cell.vertices, label: areaCellName(data, cell.cellId)}));
    const targetCells = data.assembly.placements.map(placement => ({id: placement.placementId, vertices: placement.vertices, label: `${areaCellName(data, placement.sourceCellId)}.${placement.copyIndex + 1}`}));
    const targetBounds = areaBounds(data.assembly.targetBoundary.map(id => areaScreenPoint(data, id)));
    const pieceBounds = data.source.cells.map(cell => areaBounds(cell.vertices.map(id => areaScreenPoint(data, id))));
    const commonScale = Math.min(460 / (targetBounds.maxX - targetBounds.minX), 240 / (targetBounds.maxY - targetBounds.minY), 180 / Math.max(...pieceBounds.map(box => box.maxX - box.minX)), 170 / Math.max(...pieceBounds.map(box => box.maxY - box.minY)));
    return <main className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900" style={{width: 800, maxWidth: '96vw'}}>
        <h1 className="text-xl font-semibold">{composition ? 'Compose a shape and find the original area' : 'Decompose the polygon and find its area'}</h1>
        <p className="mt-3">{composition ? 'Arrange all the detached triangular pieces to match the target outline. Use the arrangement to calculate the area of ONE original region.' : 'Draw a partition into triangles. Use perpendicular bases and heights to calculate the area of the original region.'}</p>
        <div className="mt-4 rounded-xl bg-slate-100 p-5"><PolygonAreaPremises data={data} story={story} />
            {composition && <p className="mt-3 font-semibold" data-role="polygon-area-copy-given">The pieces come from {data.assembly.copyCount} {data.assembly.copyCount === 1 ? 'copy' : 'copies'} of the original region.</p>}
        </div>
        <section className="mt-5 rounded-xl border border-slate-200 p-3"><h2 className="font-semibold">Original region</h2>
            <PolygonAreaDiagram data={data} boundary={data.source.boundary} cells={!composition && isSolutionView ? sourceCells : []} sourceCuts={!composition && isSolutionView} showDimensions shapeMarks solution={isSolutionView} />
            <p className="text-sm text-slate-500">Letters identify dimension endpoints. Matching side ticks mark equal lengths; matching chevrons mark parallel sides.</p>
        </section>
        {composition && <section className="mt-5 space-y-4" data-role="polygon-area-composition-geometry">
            {!isSolutionView && <div><h2 className="mb-2 font-semibold">Detached pieces</h2><PolygonAreaTray data={data} seed={seed} scale={commonScale} /></div>}
            <div className={isSolutionView ? green : 'rounded-xl border border-slate-200 p-3'}><h2 className="font-semibold">{isSolutionView ? 'Completed assembly' : 'Target outline'}</h2>
                <PolygonAreaDiagram data={data} boundary={data.assembly.targetBoundary} cells={isSolutionView ? targetCells : []} sourceCuts={false} showDimensions={false} shapeMarks={false} solution={isSolutionView} scale={commonScale} />
                {isSolutionView && <p className="text-sm">A piece label Tn.k means triangle Tn from copy k. All pieces retain their lengths and angles.</p>}
            </div>
        </section>}
        {isSolutionView ? <section className={`mt-5 space-y-5 ${green}`} data-role="polygon-area-solution">
            <h2 className="font-semibold">Exact area calculation</h2>
            <PolygonAreaLengthWork data={data} />
            {composition ? <PolygonAreaAssemblyWork data={data} /> : <><PolygonAreaTriangleWork data={data} /><PolygonAreaSumWork data={data} value={data.source.areaSum} assembled={false} /></>}
            <p className="text-xl font-semibold" data-role="polygon-area-answer">Area of the original region: {exactNumericValue(data.source.area)} {data.units.area.name}.</p>
        </section> : <div className="mt-5 min-h-24 rounded-xl border-2 border-dashed border-slate-300 p-4 text-slate-500" data-role="polygon-area-response"><p>{composition ? 'Arrangement' : 'Partition'} and calculation: ____________________</p><p className="mt-4">Area of the original region: ____________________</p></div>}
    </main>;
}
