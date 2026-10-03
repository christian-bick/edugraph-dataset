import type {MeasurementLinePlotFractionProblem} from '../../../../types/problems.ts';

export const fixtureFor = (
    denominator: 2 | 4 | 8,
    operation: MeasurementLinePlotFractionProblem['relation']['operation']
): MeasurementLinePlotFractionProblem => {
    const d = denominator;
    if (operation === 'addition') return {
        kind: 'beaker-liquid-line-plot', unit: 'cup', denominator,
        observationNumerators: [d, d + 1, d + 2, d + 2, d + 4],
        relation: {operation, operandNumerators: [d, d + 1], resultNumerator: 2 * d + 1}
    };
    if (operation === 'subtraction') return {
        kind: 'beaker-liquid-line-plot', unit: 'cup', denominator,
        observationNumerators: [d, d + 1, d + 2, d + 2, d + 4],
        relation: {operation, minuendNumerator: d + 4, subtrahendNumerator: d + 1, resultNumerator: 3}
    };
    if (operation === 'multiplication') return {
        kind: 'beaker-liquid-line-plot', unit: 'cup', denominator,
        observationNumerators: [d, d + 1, d + 1, d + 1, d + 2],
        relation: {operation, operandNumerator: d + 1, frequency: 3, resultNumerator: 3 * (d + 1)}
    };
    return {
        kind: 'beaker-liquid-line-plot', unit: 'cup', denominator,
        observationNumerators: [d, d + 1, d + 1, d + 1, d + 2],
        relation: {operation, totalNumerator: 5 * (d + 1), recipientCount: 5, shareNumerator: d + 1}
    };
};

export const cases = ([2, 4, 8] as const).flatMap(denominator =>
    (['addition', 'subtraction', 'multiplication', 'division'] as const)
        .map(operation => ({denominator, operation}))
);
