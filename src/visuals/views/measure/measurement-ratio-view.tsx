import type {ReactNode} from 'react';
import type {
    MeasurementRatioRelationProblem, RatioRational, UnitDimensionRelationProblem
} from '../../../types/problems.ts';
import {
    conversionProjection, dimensionUnitText, measurementRationalText, physicalDimensionText,
    type ConversionDirection
} from './measurement-ratio-presentation.ts';

function MeasurementCard({title, children}: {title: string; children: ReactNode}) {
    return <main className="w-[870px] rounded-3xl bg-white p-7 font-sans text-slate-900 shadow-lg">
        <h1 className="mb-5 text-center text-2xl font-bold text-indigo-900">{title}</h1>
        <div className="flex flex-col gap-5">{children}</div>
    </main>;
}

function Fraction({numerator, denominator}: {numerator: ReactNode; denominator: ReactNode}) {
    return <span className="mx-1 inline-flex flex-col items-stretch text-center align-middle">
        <span className="border-b-2 border-current px-3 pb-1">{numerator}</span>
        <span className="px-3 pt-1">{denominator}</span>
    </span>;
}

function ConvertedResult({value, unit, solution}: {value: RatioRational; unit: string; solution: boolean}) {
    return solution ? <span className="rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 font-bold text-emerald-800" data-result="converted-quantity">
        {measurementRationalText(value)} {unit}
    </span> : <span className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 px-3 py-2 text-amber-900">□ {unit}</span>;
}

export function MeasurementRatioConversionBody({data, direction, isSolutionView}: {
    data: MeasurementRatioRelationProblem; direction: ConversionDirection; isSolutionView: boolean;
}) {
    const projection = conversionProjection(data, direction);
    const cancelledClass = isSolutionView ? 'text-slate-500 line-through decoration-2' : '';
    return <MeasurementCard title="Convert using an equivalent ratio">
        <p className="text-center text-xl">Convert {measurementRationalText(projection.sourceValue)} {projection.sourceUnit.symbol} to {projection.targetUnit.symbol}. Explain why the physical {projection.sourceUnit.dimension} stays the same.</p>
        <section className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
            <p className="mb-2 text-base font-semibold">Equal {projection.sourceUnit.dimension} quantities</p>
            <p className="font-mono text-2xl">{measurementRationalText(data.unitEquality.first)} {data.units.first.symbol} = {measurementRationalText(data.unitEquality.second)} {data.units.second.symbol}</p>
        </section>
        <section className="flex flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-slate-200 px-4 py-6 font-mono text-2xl">
            <span>{measurementRationalText(projection.sourceValue)} <span className={cancelledClass}>{projection.sourceUnit.symbol}</span></span>
            <span>×</span>
            <Fraction numerator={<>{measurementRationalText(projection.ratioNumerator)} {projection.targetUnit.symbol}</>}
                denominator={<>{measurementRationalText(projection.ratioDenominator)} <span className={cancelledClass}>{projection.sourceUnit.symbol}</span></>} />
            <span>=</span>
            <ConvertedResult value={projection.targetValue} unit={projection.targetUnit.symbol} solution={isSolutionView} />
        </section>
        {isSolutionView ? <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-lg leading-relaxed text-emerald-950" data-response="conversion-explanation">
            The ratio compares equal {projection.sourceUnit.dimension} quantities, so the dimensioned ratio equals 1. The {projection.sourceUnit.symbol} units cancel, leaving {projection.targetUnit.symbol}. Multiplication by this ratio preserves the physical {projection.sourceUnit.dimension}; only its unit and numerical measure change.
        </section> : <section className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-lg" data-response="conversion-explanation">
            Explain the conversion ratio and which units cancel:
            <span className="mt-5 block h-8 border-b border-slate-400" />
        </section>}
    </MeasurementCard>;
}

function RawUnitFactors({data, solution}: {data: UnitDimensionRelationProblem; solution: boolean}) {
    const numeratorCancelled = new Set(data.cancellations.map(pair => pair.numeratorIndex));
    const denominatorCancelled = new Set(data.cancellations.map(pair => pair.denominatorIndex));
    const factors = (side: 'numerator' | 'denominator', cancelled: Set<number>) =>
        data.unitFactors[side].length === 0 ? <span>1</span> : data.unitFactors[side].map((symbol, index) => <span key={index}>
            {index > 0 && <span> · </span>}
            <span className={solution && cancelled.has(index) ? 'text-slate-500 line-through decoration-2' : ''}>{symbol}</span>
        </span>);
    return <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-center">
        <p className="mb-3 text-base font-semibold text-indigo-950">Unit factors before simplification</p>
        <div className="font-mono text-2xl"><Fraction numerator={factors('numerator', numeratorCancelled)} denominator={factors('denominator', denominatorCancelled)} /></div>
    </div>;
}

export function UnitCompositionBody({data, isSolutionView}: {data: UnitDimensionRelationProblem; isSolutionView: boolean}) {
    const operation = data.operation === 'multiplication' ? '×' : '÷';
    const resultUnits = dimensionUnitText(data.result.units);
    const physicalDimension = physicalDimensionText(data.result.dimensions);
    return <MeasurementCard title={data.operation === 'multiplication' ? 'Multiply quantities and explain their units' : 'Divide quantities and explain their units'}>
        <p className="text-center text-xl">Calculate the result with simplified units. Explain any unit cancellation and the physical dimension of the result.</p>
        <section className="flex flex-wrap items-center justify-center gap-3 rounded-xl border-2 border-slate-200 px-4 py-6 font-mono text-2xl">
            <span>({measurementRationalText(data.left.value)} {dimensionUnitText(data.left.units)})</span>
            <span>{operation}</span>
            <span>({measurementRationalText(data.right.value)} {dimensionUnitText(data.right.units)})</span>
            <span>=</span>
            {isSolutionView ? <span className="rounded-lg border-2 border-emerald-400 bg-emerald-50 px-3 py-2 font-bold text-emerald-800" data-result="dimensioned-quantity">
                {measurementRationalText(data.result.value)}{resultUnits === '1' ? ' (dimensionless)' : ` ${resultUnits}`}
            </span> : <span className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 px-5 py-2 text-amber-900">□</span>}
        </section>
        <RawUnitFactors data={data} solution={isSolutionView} />
        {isSolutionView ? <section className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5 text-lg leading-relaxed text-emerald-950" data-response="unit-dimension-explanation">
            {data.operation === 'division' && <>Dividing by the right-hand unit expression multiplies by its reciprocal, exchanging its numerator and denominator factors. </>}
            {data.cancellations.length === 0 ? 'There are no common numerator and denominator unit factors to cancel.'
                : 'An identical unit factor in the numerator and denominator has quotient 1, so each crossed-out pair cancels.'}
            {' '}The remaining unit expression is <strong>{resultUnits}</strong>, so the physical dimension is <strong>{physicalDimension}</strong>.
        </section> : <section className="rounded-xl border-2 border-dashed border-slate-300 p-5 text-lg" data-response="unit-dimension-explanation">
            Simplified units and physical dimension:
            <span className="mt-5 block h-8 border-b border-slate-400" />
            <p className="mt-4">Explain which unit factors cancel, or why none cancel.</p>
            <span className="mt-5 block h-8 border-b border-slate-400" />
        </section>}
    </MeasurementCard>;
}
