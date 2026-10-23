import type {FractionalRectangularPrismVolumeProblem, RectangularPrismVolumeProblem} from '../../../types/problems.ts';
import type {PrismTask} from './volume-rectangular-prism-view.tsx';
import {FractionalPrismDrawing, FractionalPrismGroups} from './fractional-prism-drawing.tsx';
import {FractionalFormulaSolution, PhysicalPrismGivens, prismArithmetic, prismFactor, prismScalar} from './fractional-prism-format.tsx';

function Response({solution, label, children}: {solution: boolean; label: string; children: React.ReactNode}) {
    return solution
        ? <div data-role="prism-solution" className="mt-5 rounded-xl border border-emerald-400 bg-emerald-50 p-5 leading-relaxed text-emerald-900">{children}</div>
        : <div data-role="prism-response" className="mt-5 rounded-xl border-2 border-dashed border-slate-300 p-5 text-slate-500">
            {label} <span className="inline-block w-48 border-b border-slate-400">&nbsp;</span>
        </div>;
}

function CubeScale({data}: {data: FractionalRectangularPrismVolumeProblem}) {
    return <p data-role="cube-scale-premise" className="mt-3 text-sm leading-relaxed text-slate-700">
        The reference length unit is u. Every small cube has edge {prismScalar(data.unitCubeEdgeLength)} u.
        The layers fill the prism without gaps or overlaps.
    </p>;
}

function CubeVolume({data}: {data: FractionalRectangularPrismVolumeProblem}) {
    return <div data-role="cube-volume-work">
        <p>One small cube's face area: {prismArithmetic(data.unitCubeProducts.faceArea)} u².</p>
        <p>One small cube's volume: {prismArithmetic(data.unitCubeProducts.volume)} u³.</p>
    </div>;
}

function CountCalculation({data}: {data: FractionalRectangularPrismVolumeProblem}) {
    return <>
        <p>Small cubes per layer: {prismArithmetic(data.countProducts.layerCount)}.</p>
        <p>Total small cubes: {prismArithmetic(data.countProducts.totalCount)}.</p>
        <CubeVolume data={data} />
        <p className="mt-3">Multiply the number of small cubes by the volume of one small cube:</p>
        <p className="font-mono">{prismArithmetic(data.packingVolumeProduct)} u³.</p>
        <p data-role="prism-count-answer" className="mt-3 font-bold">{data.cubeCount} small cubes.</p>
        <p data-role="prism-volume-answer" className="text-xl font-bold">Prism volume: {prismScalar(data.volumeCubicUnits)} u³.</p>
    </>;
}

function Equivalence({data}: {data: FractionalRectangularPrismVolumeProblem}) {
    const proof = data.countedPackingEquivalence;
    return <div className="mt-4 space-y-1" data-role="packing-equivalence-work">
        <p>The physical base area is length times width: {prismArithmetic(data.physicalProducts.baseArea)} u².</p>
        <p>Multiplying that base area by the height gives {prismArithmetic(data.physicalProducts.volume)} u³.</p>
        {proof && <>
            <p className="pt-2">Each count of cube edges gives the corresponding physical edge:</p>
            {proof.edgeScaleProducts.map((work, index) => <p key={index}>{['Length', 'Width', 'Height'][index]}: {prismArithmetic(work)} u.</p>)}
            <p className="pt-2">The same complete layer can be measured in two ways:</p>
            <p>Small-cube count times cube volume: {prismArithmetic(proof.countedLayerVolumeProduct)} u³.</p>
            <p>Physical base area times small-cube height: {prismArithmetic(proof.measuredLayerVolumeProduct)} u³.</p>
            <p>All layers: {prismArithmetic(proof.completeLayerVolumeProduct)} u³.</p>
        </>}
        <p className="pt-2">Counting disjoint small cubes and multiplying physical edge lengths measure the same filled solid in the original unit u³.</p>
    </div>;
}

function Association({data, solution}: {data: FractionalRectangularPrismVolumeProblem; solution: boolean}) {
    const regrouping = data.associativeRegrouping;
    if (!regrouping) return null;
    const {length, width, height} = data.dimensions;
    return <div className={`mt-4 rounded-xl border p-4 ${solution ? 'border-emerald-300 text-emerald-900' : 'border-slate-200 text-slate-800'}`}>
        <p className="mb-3 font-semibold">The same cubes by column slices</p>
        <p className="mb-3 font-mono">({prismFactor(length)} × {prismFactor(width)}) × {prismFactor(height)}
            {' and '}{prismFactor(length)} × ({prismFactor(width)} × {prismFactor(height)})</p>
        <FractionalPrismGroups groups={regrouping.columnSlices} columns={data.packingBounds.rows}
            filled={solution} completed={solution} axis="column" ordinals={undefined} />
        {solution && <div data-role="association-work" className="mt-3">
            <p>Width times height: {prismArithmetic(regrouping.widthHeightArithmetic)} u².</p>
            <p>Length times that area: {prismArithmetic(regrouping.alternativeVolumeProduct)} u³.</p>
            <p>Both groupings fill the same prism, so their physical volume is unchanged.</p>
        </div>}
    </div>;
}

export function FractionalRectangularPrismBody({data, isSolutionView, task}: {
    data: FractionalRectangularPrismVolumeProblem; isSolutionView: boolean; task: PrismTask;
}) {
    const formula = task === 'formula-execution' || task === 'formula-story';
    const story = task === 'formula-story';
    const model = task === 'product-model';
    const titles = {
        'packing-explanation': 'From fractional cube packing to volume products',
        'product-model': 'Build a fractional prism model',
        'formula-execution': 'Calculate the prism volume',
        'formula-story': 'Find the crate capacity'
    } as const;
    return <div className="w-[800px] rounded-2xl bg-white p-6 font-sans text-slate-900">
        <h1 className="text-xl font-bold">{titles[task]}</h1>
        <p className="mt-3 leading-relaxed">{formula
            ? 'Write the matching volume formula, substitute the measurements, and calculate the volume in cubic units.'
            : model ? 'Fill the empty small-cube slots to build the prism and show its physical three-edge product.'
                : 'Explain why the cube count times small-cube volume agrees with the three-edge product and base-area-times-height product. Write the equations.'}</p>
        <div className="mt-4 rounded-xl bg-slate-50 p-4"><PhysicalPrismGivens data={data} story={story} />
            {!formula && <CubeScale data={data} />}
        </div>
        <FractionalPrismDrawing bounds={data.packingBounds} packed={!formula && (!model || isSolutionView)}
            completed={model && isSolutionView} />
        {!formula && <>
            <FractionalPrismGroups groups={data.heightLayers} columns={data.packingBounds.columns}
                filled={!model || isSolutionView} completed={model && isSolutionView} axis="layer"
                ordinals={isSolutionView ? data.countingTrace : undefined} />
            <Association data={data} solution={isSolutionView} />
        </>}
        <Response solution={isSolutionView} label={formula ? 'Formula, substitution and volume:' : model ? 'Model and product:' : 'Explanation and equations:'}>
            {formula ? <FractionalFormulaSolution data={data} story={story} /> : <>
                <CountCalculation data={data} />
                <p className="mt-3 font-mono">V = ({prismFactor(data.dimensions.length)} × {prismFactor(data.dimensions.width)}) × {prismFactor(data.dimensions.height)}
                    {' = '}{prismFactor(data.baseAreaSquareUnits)} × {prismFactor(data.dimensions.height)}
                    {' = '}{prismScalar(data.volumeCubicUnits)} u³.</p>
                <Equivalence data={data} />
            </>}
        </Response>
    </div>;
}

/** The new count identity also accepts every unchanged side-one integer member. */
export function PrismPackingCountBody({data, isSolutionView}: {
    data: RectangularPrismVolumeProblem; isSolutionView: boolean;
}) {
    const fractional = data.kind === 'fractional-rectangular-prism-volume';
    const bounds = fractional ? data.packingBounds
        : {columns: data.dimensions.length, rows: data.dimensions.width, layers: data.dimensions.height};
    return <div className="w-[800px] rounded-2xl bg-white p-6 font-sans text-slate-900">
        <h1 className="text-xl font-bold">Count small cubes and find the prism volume</h1>
        <p className="mt-3 leading-relaxed">Count the small cubes in all the complete layers. Multiply the count by the volume of one small cube. Give the prism volume in the original cubic unit u³.</p>
        {fractional ? <><PhysicalPrismGivens data={data} story={false} /><CubeScale data={data} /></>
            : <p className="mt-3">The reference length unit is u. Every small cube has edge 1 u.</p>}
        <FractionalPrismDrawing bounds={bounds} packed completed={false} />
        <FractionalPrismGroups groups={data.heightLayers} columns={bounds.columns} filled completed={false} axis="layer"
            ordinals={fractional && isSolutionView ? data.countingTrace : undefined} />
        <Response solution={isSolutionView} label="Total cube count and volume calculation:">
            {fractional ? <CountCalculation data={data} /> : <>
                <p>Each layer: {data.dimensions.length} × {data.dimensions.width} = {data.baseAreaSquareUnits} small cubes.</p>
                <p>All layers: {data.baseAreaSquareUnits} × {data.dimensions.height} = {data.cubeCount} small cubes.</p>
                <p>One small cube occupies 1 u³.</p>
                <p>{data.cubeCount} × 1 = {data.volumeCubicUnits} u³.</p>
                <p data-role="prism-count-answer" className="mt-3 font-bold">{data.cubeCount} small cubes.</p>
                <p data-role="prism-volume-answer" className="text-xl font-bold">Prism volume: {data.volumeCubicUnits} u³.</p>
            </>}
        </Response>
    </div>;
}
