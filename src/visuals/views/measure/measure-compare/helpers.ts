import {MeasurementCompareProblem} from '../../../../types/problems.ts';

export type MeasurementCompareProjection = {
    val1: number;
    val2: number;
    answer: 'A' | 'B';
};

export function getMeasurementRelationWord(
    {attribute, relation}: Pick<MeasurementCompareProblem, 'attribute' | 'relation'>
): 'longer' | 'shorter' | 'heavier' | 'lighter' {
    if (attribute === 'length') return relation === 'greater' ? 'longer' : 'shorter';
    return relation === 'greater' ? 'heavier' : 'lighter';
}

export function resolveMeasurementComparison(
    data: MeasurementCompareProblem,
    seed: number
): MeasurementCompareProjection {
    const smallerIsA = Math.abs(Math.trunc(seed)) % 2 === 0;
    const val1 = smallerIsA ? data.magnitudes.smaller : data.magnitudes.larger;
    const val2 = smallerIsA ? data.magnitudes.larger : data.magnitudes.smaller;
    const asksForLarger = data.relation === 'greater';
    const answerIsA = asksForLarger ? !smallerIsA : smallerIsA;
    return {val1, val2, answer: answerIsA ? 'A' : 'B'};
}

export interface WeightLayout {
    leftBeamY: number;
    rightBeamY: number;
    leftPanY: number;
    rightPanY: number;
}

export function getWeightLayout(val1: number, val2: number): WeightLayout {
    const leftHeavier = val1 > val2;
    const leftBeamY = leftHeavier ? 105 : 75;
    const rightBeamY = leftHeavier ? 75 : 105;
    const leftPanY = leftHeavier ? 135 : 105;
    const rightPanY = leftHeavier ? 105 : 135;
    return {leftBeamY, rightBeamY, leftPanY, rightPanY};
}
