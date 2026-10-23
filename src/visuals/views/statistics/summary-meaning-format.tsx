import type {NumericalDataProblem, NumericalDataScalar, NumericalMiddle, NumericalMiddleProof} from '../../../types/problems.ts';
import {distributionArithmetic, distributionUnit, distributionValue, observationName, observationValue} from './numerical-distribution-format.tsx';

/** Actual top-level proofs determine one fixed task's mathematical instance, independently of array order. */
export const centerSummaryKind = (data: NumericalDataProblem): 'mean' | 'median' =>
    data.relations.some(row => row.kind === 'arithmetic-mean') ? 'mean'
        : data.relations.some(row => row.kind === 'median') ? 'median' : 'mean';
export const variationSummaryKind = (data: NumericalDataProblem): 'mad' | 'iqr' =>
    data.relations.some(row => row.kind === 'mean-absolute-deviation') ? 'mad'
        : data.relations.some(row => row.kind === 'interquartile-range') ? 'iqr' : 'mad';

const atomic = (value: NumericalDataScalar): string => value.numerator < 0 || value.denominator !== 1
    ? `(${distributionValue(value)})` : distributionValue(value);
function middleWork(value: NumericalMiddle, proof: NumericalMiddleProof | undefined): string {
    if (proof?.arithmetic.kind === 'single-central-value') return distributionValue(proof.arithmetic.value);
    const operands = proof?.arithmetic.kind === 'central-pair-average' ? proof.arithmetic.operands : value.centralValues;
    return operands.length === 1 ? distributionValue(value.value)
        : `(${distributionValue(operands[0])} + ${distributionValue(operands[1])}) ÷ 2 = ${distributionValue(value.value)}`;
}

export function CenterSummaryGiven({data}: {data: NumericalDataProblem}) {
    const kind = centerSummaryKind(data);
    return <div className="rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="center-summary-given">
        Given {kind === 'mean' ? 'arithmetic mean' : 'median'}: <span className="font-mono">{distributionValue(kind === 'mean' ? data.summary.mean : data.summary.median.value)}</span> {distributionUnit(data.study)}.
    </div>;
}

export function VariationSummaryGiven({data}: {data: NumericalDataProblem}) {
    const kind = variationSummaryKind(data);
    return <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3" data-role="variation-summary-given">
        <p>Given {kind === 'mad' ? 'mean absolute deviation (MAD)' : 'interquartile range (IQR)'}: <span className="font-mono">{distributionValue(kind === 'mad' ? data.summary.mad : data.summary.iqr)}</span> {distributionUnit(data.study)}.</p>
        {kind === 'iqr' && <p className="text-sm">Quartiles use medians of the lower and upper halves, excluding the central observation when the record count is odd.</p>}
    </div>;
}

export function CenterSummaryMeaning({data}: {data: NumericalDataProblem}) {
    const kind = centerSummaryKind(data), summary = data.summary, unit = distributionUnit(data.study);
    const mean = data.relations.find(row => row.kind === 'arithmetic-mean'), median = data.relations.find(row => row.kind === 'median');
    return <div className="space-y-2" data-role="center-summary-meaning">
        {kind === 'mean' ? <>
            <p className="font-mono">{mean ? distributionArithmetic(mean.quotient) : `${distributionValue(summary.sum)} ÷ ${summary.count} = ${distributionValue(summary.mean)}`}</p>
            <p>The arithmetic mean is {distributionValue(summary.mean)} {unit}. The total of the recorded values, {distributionValue(summary.sum)} {unit}, is divided by the {summary.count} records to give the per-record numerical average for this collection.</p>
            <p>The mean summarizes the values at a central numerical balance; it need not equal any individual recorded value.</p>
        </> : <>
            <p>Ordered records: {summary.orderedRecordIds.map(id => `${observationName(data, id)}=${observationValue(data, id)}`).join(', ')}.</p>
            <p className="font-mono">Central position{summary.median.positions.length === 1 ? '' : 's'} {summary.median.positions.join(' and ')}: {middleWork(summary.median, median?.positional)}</p>
            <p>The median {distributionValue(summary.median.value)} {unit} locates the middle of the ordered recorded values.{summary.median.centralValues.length === 2 && <> With an even number of records, it averages the two central values.</>}</p>
        </>}
        <p>This center summarizes {data.study.attribute.name} for this recorded collection, in {unit}. The number of observations is {summary.count}; a center summarizes their values, rather than counting them or measuring their spread. Collections can share a center while having different spreads.</p>
    </div>;
}

export function VariationSummaryMeaning({data}: {data: NumericalDataProblem}) {
    const kind = variationSummaryKind(data), summary = data.summary, unit = distributionUnit(data.study);
    const mad = data.relations.find(row => row.kind === 'mean-absolute-deviation'), iqr = data.relations.find(row => row.kind === 'interquartile-range');
    return <div className="space-y-2" data-role="variation-summary-meaning">
        {kind === 'mad' ? <>
            <p>Arithmetic mean used as the distance reference: {distributionValue(summary.mean)} {unit}.</p>
            <p>Absolute distances from that mean: {summary.deviations.map(row => `${observationName(data, row.recordId)}: ${distributionValue(row.absoluteDifference)}`).join('; ')} {unit}.</p>
            <p className="font-mono">{mad ? distributionArithmetic(mad.quotient) : `${distributionValue(summary.absoluteDeviationSum)} ÷ ${summary.count} = ${distributionValue(summary.mad)}`}</p>
            <p>The MAD {distributionValue(summary.mad)} {unit} is the average absolute distance of these recorded values from their arithmetic mean. It describes how far values lie from that mean on average, in the original units.</p>
            <p>These are absolute distances from the mean, rather than signed differences or distances from the median.</p>
            {summary.mad.numerator === 0 && <p>Here every absolute distance is zero, so all recorded values coincide.</p>}
        </> : <>
            <p>Lower-half middle: {middleWork(summary.quartiles.lowerHalf, iqr?.quartiles.lowerHalf)}. Upper-half middle: {middleWork(summary.quartiles.upperHalf, iqr?.quartiles.upperHalf)}.</p>
            <p className="font-mono">{iqr ? distributionArithmetic(iqr.subtraction) : `${distributionValue(summary.quartiles.q3)} - ${atomic(summary.quartiles.q1)} = ${distributionValue(summary.iqr)}`}</p>
            <p>The IQR {distributionValue(summary.iqr)} {unit} is the span from Q1={distributionValue(summary.quartiles.q1)} to Q3={distributionValue(summary.quartiles.q3)}. It summarizes the spread of the middle half under the stated quartile convention, in the original units.</p>
            {summary.iqr.numerator === 0 && <p>Here Q1 and Q3 coincide. Values outside this middle-half span can still differ.</p>}
        </>}
        <p>This spread summary is neither the number of observations ({summary.count}) nor a central value. It is not the full minimum-to-maximum range. Collections can have the same center and different spread summaries.</p>
    </div>;
}
