import type {NumericalDataProblem, NumericalDataRelation, NumericalDataScalar, NumericalDataSummaryCore, NumericalMiddle, NumericalMiddleProof, NumericalSensitivityProof} from '../../../types/problems.ts';
import {distributionArithmetic, distributionUnit, distributionValue, observationName} from './numerical-distribution-format.tsx';

const atomic = (value: NumericalDataScalar) => value.numerator < 0 || value.denominator !== 1 ? `(${distributionValue(value)})` : distributionValue(value);
const middle = (value: NumericalMiddle, proof: NumericalMiddleProof | undefined) => {
    if (proof?.arithmetic.kind === 'single-central-value') return distributionValue(proof.arithmetic.value);
    const operands = proof?.arithmetic.kind === 'central-pair-average' ? proof.arithmetic.operands : value.centralValues;
    return operands.length === 1 ? distributionValue(value.value) : `(${operands.map(distributionValue).join(' + ')}) ÷ 2 = ${distributionValue(value.value)}`;
};

/** Projection of supplied method operands/results only, including valid commuted pair averages. */
export function SelectionMethodWork({data, summary, proofs, replacement, heading}: {
    data: NumericalDataProblem; summary: NumericalDataSummaryCore; proofs: readonly NumericalDataRelation[];
    replacement: NumericalSensitivityProof | undefined; heading: string;
}) {
    const mean = proofs.find(row => row.kind === 'arithmetic-mean'), median = proofs.find(row => row.kind === 'median');
    const mad = proofs.find(row => row.kind === 'mean-absolute-deviation'), iqr = proofs.find(row => row.kind === 'interquartile-range');
    const valueOf = (id: string) => replacement && id === replacement.recordId ? replacement.replacementValue : data.records.find(row => row.id === id)!.value;
    return <div className="space-y-2" data-role="summary-selection-method-work"><p className="font-semibold">{heading}</p>
        <p>Mean: <span className="font-mono">{mean ? distributionArithmetic(mean.quotient) : `${distributionValue(summary.sum)} ÷ ${summary.count} = ${distributionValue(summary.mean)}`}</span>. This is the per-record numerical average, in {distributionUnit(data.study)}.</p>
        <p>Ordered observations: {summary.orderedRecordIds.map(id => `${observationName(data, id)}=${distributionValue(valueOf(id))}`).join(', ')}.</p>
        <p>Median at position{summary.median.positions.length === 1 ? '' : 's'} {summary.median.positions.join(' and ')}: <span className="font-mono">{middle(summary.median, median?.positional)}</span>. It describes the ordered middle.</p>
        <div><p>Distances from the arithmetic mean {distributionValue(summary.mean)} {distributionUnit(data.study)}:</p>
            <ul className="list-disc pl-5 text-sm">{mad ? mad.deviations.map(row => <li key={row.recordId}>{observationName(data, row.recordId)}: <span className="font-mono">{distributionArithmetic(row.subtraction)}</span>; absolute distance {distributionValue(row.absoluteDifference)}.</li>)
                : summary.deviations.map(row => <li key={row.recordId}>{observationName(data, row.recordId)}: <span className="font-mono">{atomic(row.value)} - {atomic(summary.mean)} = {distributionValue(row.signedDifference)}</span>; absolute distance {distributionValue(row.absoluteDifference)}.</li>)}</ul>
            <p>MAD: <span className="font-mono">{mad ? distributionArithmetic(mad.quotient) : `${distributionValue(summary.absoluteDeviationSum)} ÷ ${summary.count} = ${distributionValue(summary.mad)}`}</span>. This is the average absolute distance from the arithmetic mean.</p>
        </div>
        <p>Lower-half middle: <span className="font-mono">{middle(summary.quartiles.lowerHalf, iqr?.quartiles.lowerHalf)}</span>. Upper-half middle: <span className="font-mono">{middle(summary.quartiles.upperHalf, iqr?.quartiles.upperHalf)}</span>.</p>
        <p>IQR: <span className="font-mono">{iqr ? distributionArithmetic(iqr.subtraction) : `${atomic(summary.quartiles.q3)} - ${atomic(summary.quartiles.q1)} = ${distributionValue(summary.iqr)}`}</span>. This is the span of the middle half under the stated quartile convention, in {distributionUnit(data.study)}.</p>
        {summary.iqr.numerator === 0 && <p>Q1 and Q3 coincide here; observations outside that middle-half span can still differ.</p>}
    </div>;
}
