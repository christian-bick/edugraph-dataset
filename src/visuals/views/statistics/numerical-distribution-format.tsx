import type {ExactCoefficientArithmetic, NumericalDataProblem, NumericalDataScalar, NumericalDataStudy, NumericalMiddle, NumericalShapeProof} from '../../../types/problems.ts';
import {exactNumericValue} from '../operations/numerical-power-expression-format.tsx';

export const distributionValue = (value: NumericalDataScalar): string => exactNumericValue(value);
const atomic = (value: NumericalDataScalar): string => value.numerator < 0 || value.denominator !== 1 ? `(${distributionValue(value)})` : distributionValue(value);
const arithmeticSymbols = {addition: '+', subtraction: '-', multiplication: '×', division: '÷'} as const;
export const distributionArithmetic = (value: ExactCoefficientArithmetic): string => `${atomic(value.operands[0])} ${arithmeticSymbols[value.operation]} ${atomic(value.operands[1])} = ${distributionValue(value.result)}`;
export const distributionUnit = (study: NumericalDataStudy): string => study.attribute.unit === 'degrees-celsius' ? 'degrees Celsius' : study.attribute.unit;
export const observationName = (data: NumericalDataProblem, id: string): string => `R${data.records.findIndex(row => row.id === id) + 1}`;
export const observationValue = (data: NumericalDataProblem, id: string): string => distributionValue(data.records.find(row => row.id === id)!.value);

/** Priority is mathematical and independent of relation-array order. */
export function distributionSummaries(data: NumericalDataProblem) {
    return {
        center: data.relations.some(row => row.kind === 'arithmetic-mean') ? 'mean' as const
            : data.relations.some(row => row.kind === 'median') ? 'median' as const : 'mean' as const,
        spread: data.relations.some(row => row.kind === 'mean-absolute-deviation') ? 'mad' as const
            : data.relations.some(row => row.kind === 'interquartile-range') ? 'iqr' as const : 'mad' as const
    };
}

export function DistributionStudy({data}: {data: NumericalDataProblem}) {
    const study = data.study, attribute = study.attribute;
    return <div className="space-y-2" data-role="distribution-study">
        <p className="font-semibold">{study.populationName}</p>
        <p>Observational unit: {study.observationalUnitName}. Recorded attribute: {attribute.name}, in {distributionUnit(study)}.</p>
        <p className="text-sm text-slate-600">Method: {attribute.method}{attribute.kind === 'count' ? ` (${attribute.countedObject})` : `; recording precision ${distributionValue(attribute.precision)} ${distributionUnit(study)}`}.</p>
        <p className="text-sm text-slate-600">{study.selection === 'distinct-units' ? 'The records concern distinct observational units.' : 'The records include observations of a unit on different occasions.'}</p>
        <p className="text-sm text-slate-600">Units: {study.units.map((row, index) => `U${index + 1}: ${row.name}`).join('; ')}.</p>
        <p className="text-sm text-slate-600">Occasions: {study.occasions.map((row, index) => `O${index + 1}: ${row.name}`).join('; ')}.</p>
    </div>;
}

export function DistributionRecords({data}: {data: NumericalDataProblem}) {
    return <table className="w-full border-collapse text-sm" data-role="distribution-records">
        <thead><tr>{['Record', 'Unit', 'Occasion', `Value (${distributionUnit(data.study)})`].map(value => <th key={value} className="border border-slate-200 bg-slate-50 px-3 py-2 text-left">{value}</th>)}</tr></thead>
        <tbody>{data.records.map((row, index) => <tr key={row.id}><td className="border border-slate-200 px-3 py-1.5">R{index + 1}</td><td className="border border-slate-200 px-3 py-1.5">U{data.study.units.findIndex(unit => unit.id === row.unitId) + 1}</td><td className="border border-slate-200 px-3 py-1.5">O{data.study.occasions.findIndex(occasion => occasion.id === row.occasionId) + 1}</td><td className="border border-slate-200 px-3 py-1.5 font-mono">{distributionValue(row.value)}</td></tr>)}</tbody>
    </table>;
}

export function DistributionSummaryGivens({data}: {data: NumericalDataProblem}) {
    const selected = distributionSummaries(data);
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="distribution-summary-givens">
        <p>Given {selected.center === 'mean' ? 'arithmetic mean' : 'median'}: <span className="font-mono">{distributionValue(selected.center === 'mean' ? data.summary.mean : data.summary.median.value)}</span> {distributionUnit(data.study)}.</p>
        <p>Given {selected.spread === 'mad' ? 'mean absolute deviation (MAD)' : 'interquartile range (IQR)'}: <span className="font-mono">{distributionValue(selected.spread === 'mad' ? data.summary.mad : data.summary.iqr)}</span> {distributionUnit(data.study)}.</p>
        {selected.spread === 'iqr' && <p className="text-sm">Quartiles use medians of the lower and upper halves, excluding the central observation when the record count is odd.</p>}
    </div>;
}

function middleEquation(value: NumericalMiddle): string {
    return value.centralValues.length === 1 ? distributionValue(value.value)
        : `(${distributionValue(value.centralValues[0])} + ${distributionValue(value.centralValues[1])}) ÷ 2 = ${distributionValue(value.value)}`;
}

export function DistributionSummaryMeaning({data}: {data: NumericalDataProblem}) {
    const selected = distributionSummaries(data), unit = distributionUnit(data.study), summary = data.summary;
    const mean = data.relations.find(row => row.kind === 'arithmetic-mean'), mad = data.relations.find(row => row.kind === 'mean-absolute-deviation');
    const iqr = data.relations.find(row => row.kind === 'interquartile-range');
    return <div className="space-y-3" data-role="distribution-summary-meaning">
        {selected.center === 'mean' ? <div><p className="font-mono">{mean ? distributionArithmetic(mean.quotient) : `${distributionValue(summary.sum)} ÷ ${summary.count} = ${distributionValue(summary.mean)}`}</p><p>The arithmetic mean is {distributionValue(summary.mean)} {unit}: the total of the recorded values divided equally among the {summary.count} records.</p></div>
            : <div><p>Ordered records: {summary.orderedRecordIds.map(id => `${observationName(data, id)}=${observationValue(data, id)}`).join(', ')}.</p><p className="font-mono">Central position{summary.median.positions.length === 1 ? '' : 's'} {summary.median.positions.join(' and ')}: {middleEquation(summary.median)}</p><p>The median {distributionValue(summary.median.value)} {unit} locates the middle of the ordered collection.</p></div>}
        {selected.spread === 'mad' ? <div><p>Absolute distances from the mean {distributionValue(summary.mean)}: {summary.deviations.map(row => `${observationName(data, row.recordId)}: ${distributionValue(row.absoluteDifference)}`).join('; ')} {unit}.</p><p className="font-mono">{mad ? distributionArithmetic(mad.quotient) : `${distributionValue(summary.absoluteDeviationSum)} ÷ ${summary.count} = ${distributionValue(summary.mad)}`}</p><p>The MAD {distributionValue(summary.mad)} {unit} is the average absolute distance of the recorded values from their arithmetic mean.</p></div>
            : <div><p>Lower-half middle: {middleEquation(summary.quartiles.lowerHalf)}. Upper-half middle: {middleEquation(summary.quartiles.upperHalf)}.</p><p className="font-mono">{iqr ? distributionArithmetic(iqr.subtraction) : `${distributionValue(summary.quartiles.q3)} - ${atomic(summary.quartiles.q1)} = ${distributionValue(summary.iqr)}`}</p><p>The IQR {distributionValue(summary.iqr)} {unit} is the span from Q1={distributionValue(summary.quartiles.q1)} to Q3={distributionValue(summary.quartiles.q3)}, describing the middle half under this quartile convention.</p></div>}
    </div>;
}

export function DistributionVariability({data}: {data: NumericalDataProblem}) {
    const proof = data.relations.find(row => row.kind === 'observed-variability');
    return <div data-role="distribution-variability-meaning">{proof ? <><p>{observationName(data, proof.orderedRecordIds[0])} has value {distributionValue(proof.lower)}, while {observationName(data, proof.orderedRecordIds[1])} has value {distributionValue(proof.upper)}.</p><p className="font-mono">{distributionArithmetic(proof.positiveDifference)}</p><p>These different recorded values show observed variability.</p></>
        : data.frequencies.length === 1 ? <p>Every record has value {distributionValue(data.frequencies[0].value)}; this collection has no observed variability.</p>
            : <p>The recorded values range from {distributionValue(data.summary.minimum)} to {distributionValue(data.summary.maximum)} {distributionUnit(data.study)}.</p>}</div>;
}

function ShapeSymmetry({proof, data}: {proof: NumericalShapeProof; data: NumericalDataProblem}) {
    const symmetry = proof.symmetry;
    return symmetry.kind === 'reflection-equality' ? <p>The displayed frequencies are symmetric about {distributionValue(symmetry.center)}: reflected values have matching frequencies.</p>
        : <p>The displayed frequencies are asymmetric about {distributionValue(symmetry.center)}: {distributionValue(data.frequencies.find(row => row.id === symmetry.frequencyId)!.value)} has frequency {symmetry.firstCount}, while its reflection {distributionValue(symmetry.reflectedValue)} has frequency {symmetry.secondCount}.</p>;
}

export function DistributionShapeMeaning({data}: {data: NumericalDataProblem}) {
    const facts = data.shapeFacts, proof = data.relations.find(row => row.kind === 'empirical-shape');
    const frequency = new Map(data.frequencies.map(row => [row.id, row]));
    return <div className="space-y-2" data-role="distribution-shape-meaning">
        <p className="font-semibold">Empirical pattern</p>
        {proof && <ShapeSymmetry proof={proof} data={data} />}
        <p>{facts.maximumFrequencyIds.length === data.frequencies.length ? 'Across the occupied values, all frequencies tie' : 'The highest recorded frequency occurs'} at {facts.maximumFrequencyIds.map(id => distributionValue(frequency.get(id)!.value)).join(', ')}; frequency {facts.maximumFrequency}.</p>
        <p>Reflection comparisons about {distributionValue(facts.midrange)}: {facts.reflections.map(row => `${distributionValue(frequency.get(row.frequencyId)!.value)} (frequency ${row.count}) with ${distributionValue(row.reflectedValue)} (frequency ${row.reflectedCount})`).join('; ')}.</p>
        <p>From the median, the left extent is {distributionValue(facts.leftMedianExtent)} and the right extent is {distributionValue(facts.rightMedianExtent)} {distributionUnit(data.study)}.{proof && <> The left extent is {proof.medianTailComparison.relation === 'less' ? 'less than' : proof.medianTailComparison.relation === 'greater' ? 'greater than' : 'equal to'} the right extent.</>}</p>
        {facts.gaps.length > 0 ? <p>Consecutive occupied values and their separations: {facts.gaps.map(row => `${distributionValue(frequency.get(row.leftFrequencyId)!.value)} to ${distributionValue(frequency.get(row.rightFrequencyId)!.value)}: ${distributionValue(row.width)}`).join('; ')} {distributionUnit(data.study)}.</p>
            : <p>There is a single occupied value.</p>}
        <p className="text-sm">These describe the recorded collection.</p>
    </div>;
}

export function DistributionCriterion({data}: {data: NumericalDataProblem}) {
    const facts = data.departureFacts;
    return <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="distribution-criterion-given">{facts ? <>
        <p>Routine reference band: [{distributionValue(facts.criterion.lower)}, {distributionValue(facts.criterion.upper)}] {distributionUnit(data.study)}, including both endpoints.</p>
        <p>A departure must lie outside this band and be separated from its closest recorded in-band observation by at least {distributionValue(facts.criterion.minimumSeparation)} {distributionUnit(data.study)}. The in-band observations form a strict majority of this collection.</p>
    </> : <p>No routine-band departure criterion was specified for this collection.</p>}</div>;
}

export function DistributionDepartureMeaning({data}: {data: NumericalDataProblem}) {
    const facts = data.departureFacts;
    return <div className="space-y-2" data-role="distribution-departure-meaning">{facts ? <>
        <p>The in-band majority consists of {facts.ordinaryRecordIds.map(id => `${observationName(data, id)}=${observationValue(data, id)}`).join(', ')} {distributionUnit(data.study)}.</p>
        {facts.separations.map(row => <div key={row.recordId}><p>{observationName(data, row.recordId)}={observationValue(data, row.recordId)} is outside the routine band. A closest in-band observation is {observationName(data, row.nearestOrdinaryRecordId)}={observationValue(data, row.nearestOrdinaryRecordId)}.</p><p className="font-mono">{distributionArithmetic(row.subtraction)}; absolute gap = {distributionValue(row.absoluteDifference)} {distributionUnit(data.study)}.</p><p>This gap is {row.thresholdRelation === 'less' ? 'less than' : row.thresholdRelation === 'greater' ? 'greater than' : 'equal to'} the required {distributionValue(facts.criterion.minimumSeparation)} {distributionUnit(data.study)}.</p></div>)}
        <p className="font-semibold">{facts.exceptionalRecordIds.length > 0 ? <>Qualifying departure{facts.exceptionalRecordIds.length === 1 ? '' : 's'}: {facts.exceptionalRecordIds.map(id => `${observationName(data, id)}=${observationValue(data, id)}`).join(', ')} {distributionUnit(data.study)}. These observations meet both parts of the stated criterion.</> : <>No recorded observation meets both parts of the stated departure criterion.</>}</p>
    </> : <p>No criterion-backed departure can be designated because no departure criterion was specified.</p>}</div>;
}
