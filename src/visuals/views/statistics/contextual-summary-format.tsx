import type {NumericalDataProblem, NumericalDataScalar, NumericalMiddle, NumericalMiddleProof} from '../../../types/problems.ts';
import {distributionArithmetic, distributionUnit, distributionValue, observationName, observationValue} from './numerical-distribution-format.tsx';
import {centerSummaryKind, variationSummaryKind} from './summary-meaning-format.tsx';

const atomic = (value: NumericalDataScalar): string => value.numerator < 0 || value.denominator !== 1
    ? `(${distributionValue(value)})` : distributionValue(value);
const sumWork = (values: readonly NumericalDataScalar[], sum: NumericalDataScalar): string =>
    `${values.map(atomic).join(' + ')} = ${distributionValue(sum)}`;
const ordered = (data: NumericalDataProblem, ids: readonly string[]): string =>
    ids.map(id => `${observationName(data, id)}=${observationValue(data, id)}`).join(', ');

function middleWork(value: NumericalMiddle, proof: NumericalMiddleProof | undefined): string {
    if (proof?.arithmetic.kind === 'single-central-value') return distributionValue(proof.arithmetic.value);
    const operands = proof?.arithmetic.kind === 'central-pair-average' ? proof.arithmetic.operands : value.centralValues;
    return operands.length === 1 ? distributionValue(value.value)
        : `(${distributionValue(operands[0])} + ${distributionValue(operands[1])}) ÷ 2 = ${distributionValue(value.value)}`;
}

function MeanCalculation({data}: {data: NumericalDataProblem}) {
    const proof = data.relations.find(row => row.kind === 'arithmetic-mean'), summary = data.summary;
    return <div className="space-y-1" data-role="contextual-mean-calculation">
        <p>Each observation contributes once, including repeated equal values. Number of records: {summary.count}.</p>
        <p className="font-mono">{sumWork(data.records.map(row => row.value), summary.sum)}</p>
        <p className="font-mono">{proof ? distributionArithmetic(proof.quotient)
            : `${atomic(summary.sum)} ÷ ${summary.count} = ${distributionValue(summary.mean)}`}</p>
    </div>;
}

export function ContextualCenterSolution({data}: {data: NumericalDataProblem}) {
    const kind = centerSummaryKind(data), summary = data.summary, unit = distributionUnit(data.study);
    const median = data.relations.find(row => row.kind === 'median');
    return <div className="space-y-3" data-role="contextual-center-solution">
        {kind === 'mean' ? <>
            <MeanCalculation data={data} />
            <p>The arithmetic mean is {distributionValue(summary.mean)} {unit}. It gives the per-record numerical average of {data.study.attribute.name} for this recorded collection: the sum of the actual values divided by their observation count.</p>
            <p>This is a center summary of the recorded values; it is not their observation count or a measure of their spread.</p>
        </> : <>
            <p>Ordered records: {ordered(data, summary.orderedRecordIds)}.</p>
            <p>Number of records: {summary.count}. Central position{summary.median.positions.length === 1 ? '' : 's'}: {summary.median.positions.join(' and ')}.</p>
            <p className="font-mono">{middleWork(summary.median, median?.positional)}</p>
            <p>The median is {distributionValue(summary.median.value)} {unit}. It locates the middle of the ordered {data.study.attribute.name} values.{summary.median.centralValues.length === 2 && <> With an even number of observations, the two central values are averaged.</>}</p>
        </>}
    </div>;
}

export function ContextualVariationSolution({data}: {data: NumericalDataProblem}) {
    const kind = variationSummaryKind(data), summary = data.summary, unit = distributionUnit(data.study);
    const mad = data.relations.find(row => row.kind === 'mean-absolute-deviation'), iqr = data.relations.find(row => row.kind === 'interquartile-range');
    return <div className="space-y-3" data-role="contextual-variation-solution">
        {kind === 'mad' ? <>
            <MeanCalculation data={data} />
            <p>Use the arithmetic mean {distributionValue(summary.mean)} {unit} as the distance reference.</p>
            <table className="w-full border-collapse text-sm" data-role="contextual-mad-distances">
                <thead><tr>{['Record', 'Value', 'Value minus mean', `Absolute distance (${unit})`].map(label => <th key={label} className="border border-emerald-200 px-2 py-1 text-left">{label}</th>)}</tr></thead>
                <tbody>{summary.deviations.map(row => {
                    const proof = mad?.deviations.find(item => item.recordId === row.recordId);
                    return <tr key={row.recordId}><td className="border border-emerald-200 px-2 py-1">{observationName(data, row.recordId)}</td>
                        <td className="border border-emerald-200 px-2 py-1 font-mono">{distributionValue(row.value)}</td>
                        <td className="border border-emerald-200 px-2 py-1 font-mono">{proof ? distributionArithmetic(proof.subtraction)
                            : `${atomic(row.value)} - ${atomic(summary.mean)} = ${distributionValue(row.signedDifference)}`}</td>
                        <td className="border border-emerald-200 px-2 py-1 font-mono">|{distributionValue(row.signedDifference)}| = {distributionValue(row.absoluteDifference)}</td></tr>;
                })}</tbody>
            </table>
            <p className="font-mono">{sumWork(summary.deviations.map(row => row.absoluteDifference), summary.absoluteDeviationSum)}</p>
            <p className="font-mono">{mad ? distributionArithmetic(mad.quotient)
                : `${atomic(summary.absoluteDeviationSum)} ÷ ${summary.count} = ${distributionValue(summary.mad)}`}</p>
            <p>The MAD is {distributionValue(summary.mad)} {unit}: the average absolute distance of these {data.study.attribute.name} observations from their arithmetic mean. It expresses how far the recorded values lie from that mean on average, in the original units.</p>
            {summary.mad.numerator === 0 && <p>Every recorded value equals the mean, so every absolute distance and the MAD are zero.</p>}
        </> : <>
            <p>Ordered records: {ordered(data, summary.orderedRecordIds)}.</p>
            {summary.median.centralRecordIds.length === 1 && <p>The central observation {observationName(data, summary.median.centralRecordIds[0])}={distributionValue(summary.median.value)} is excluded from both halves.</p>}
            <p>Lower half: {ordered(data, summary.quartiles.lowerHalf.orderedRecordIds)}.</p>
            <p className="font-mono">Q1, lower-half central position{summary.quartiles.lowerHalf.positions.length === 1 ? '' : 's'} {summary.quartiles.lowerHalf.positions.join(' and ')}: {middleWork(summary.quartiles.lowerHalf, iqr?.quartiles.lowerHalf)}</p>
            <p>Upper half: {ordered(data, summary.quartiles.upperHalf.orderedRecordIds)}.</p>
            <p className="font-mono">Q3, upper-half central position{summary.quartiles.upperHalf.positions.length === 1 ? '' : 's'} {summary.quartiles.upperHalf.positions.join(' and ')}: {middleWork(summary.quartiles.upperHalf, iqr?.quartiles.upperHalf)}</p>
            <p className="font-mono">{iqr ? distributionArithmetic(iqr.subtraction)
                : `${atomic(summary.quartiles.q3)} - ${atomic(summary.quartiles.q1)} = ${distributionValue(summary.iqr)}`}</p>
            <p>The IQR is {distributionValue(summary.iqr)} {unit}. It is the Q1-to-Q3 span of the middle half of the recorded {data.study.attribute.name} values under the stated quartile convention, rather than the full minimum-to-maximum range.</p>
            {summary.iqr.numerator === 0 && <p>Q1 and Q3 coincide; outer recorded values can still differ.</p>}
        </>}
    </div>;
}
