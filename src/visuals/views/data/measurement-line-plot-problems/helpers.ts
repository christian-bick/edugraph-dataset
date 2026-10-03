import type {
    MeasurementLinePlotFractionProblem,
    MeasurementLinePlotFractionRelation
} from '../../../../types/problems.ts';

type Denominator = MeasurementLinePlotFractionProblem['denominator'];

const fractionGlyphs: Record<Denominator, readonly string[]> = {
    2: ['', '½'],
    4: ['', '¼', '½', '¾'],
    8: ['', '⅛', '¼', '⅜', '½', '⅝', '¾', '⅞']
};

const isTickNumerator = (value: number, denominator: Denominator): boolean =>
    Number.isSafeInteger(value) && value >= denominator && value <= 3 * denominator;

const countsFor = (values: readonly number[]): Map<number, number> => {
    const counts = new Map<number, number>();
    values.forEach(value => counts.set(value, (counts.get(value) ?? 0) + 1));
    return counts;
};

const hasSelectedWitness = (numerators: readonly number[], resultNumerator: number): boolean =>
    numerators.some(numerator => numerator % 2 === 1) && resultNumerator % 2 === 1;

export const isValidMeasurementLinePlotFractionProblem = (
    data: MeasurementLinePlotFractionProblem
): boolean => {
    if (!data || data.kind !== 'beaker-liquid-line-plot' || data.unit !== 'cup'
        || !([2, 4, 8] as const).includes(data.denominator)
        || !Array.isArray(data.observationNumerators)
        || data.observationNumerators.length !== 5
        || !data.observationNumerators.every(value => isTickNumerator(value, data.denominator))
        || !data.observationNumerators.some(value => value % 2 === 1)
        || !data.relation) return false;

    const values = [...data.observationNumerators].sort((left, right) => left - right);
    const relation = data.relation;
    if (relation.operation === 'addition') {
        return Array.isArray(relation.operandNumerators)
            && relation.operandNumerators.length === 2
            && values[1]! < values[2]!
            && relation.operandNumerators[0] === values[0]
            && relation.operandNumerators[1] === values[1]
            && Number.isSafeInteger(relation.resultNumerator)
            && relation.resultNumerator === values[0]! + values[1]!
            && hasSelectedWitness(relation.operandNumerators, relation.resultNumerator);
    }
    if (relation.operation === 'subtraction') {
        return values[0]! < values[1]! && values[1]! < values[2]!
            && values[3]! < values[4]!
            && relation.minuendNumerator === values[4]
            && relation.subtrahendNumerator === values[1]
            && Number.isSafeInteger(relation.resultNumerator)
            && relation.resultNumerator === values[4]! - values[1]!
            && hasSelectedWitness(
                [relation.minuendNumerator, relation.subtrahendNumerator],
                relation.resultNumerator
            );
    }
    if (relation.operation === 'multiplication') {
        const counts = countsFor(values);
        const frequency = counts.get(relation.operandNumerator);
        return Number.isSafeInteger(relation.operandNumerator)
            && Number.isSafeInteger(relation.frequency)
            && frequency === relation.frequency
            && relation.frequency >= 2 && relation.frequency < 5
            && [...counts.entries()].every(([numerator, count]) =>
                numerator === relation.operandNumerator || count < relation.frequency)
            && Number.isSafeInteger(relation.resultNumerator)
            && relation.resultNumerator === relation.operandNumerator * relation.frequency
            && hasSelectedWitness([relation.operandNumerator], relation.resultNumerator);
    }
    if (relation.operation === 'division') {
        const total = values.reduce((sum, value) => sum + value, 0);
        return relation.recipientCount === 5
            && Number.isSafeInteger(relation.totalNumerator)
            && relation.totalNumerator === total
            && Number.isSafeInteger(relation.shareNumerator)
            && relation.shareNumerator > 0
            && relation.shareNumerator * relation.recipientCount === total
            && hasSelectedWitness(values, relation.shareNumerator);
    }
    return false;
};

export const formatFractionValue = (numerator: number, denominator: Denominator): string => {
    const whole = Math.floor(numerator / denominator);
    const fraction = fractionGlyphs[denominator][numerator % denominator]!;
    return whole === 0 && fraction ? fraction : `${whole}${fraction}`;
};

export const formatCupAmount = (numerator: number, denominator: Denominator): string =>
    `${formatFractionValue(numerator, denominator)} ${numerator === denominator ? 'cup' : 'cups'}`;

export const fractionStep = (denominator: Denominator): string => fractionGlyphs[denominator][1]!;

export const plotTicks = (data: MeasurementLinePlotFractionProblem): readonly {
    numerator: number;
    label: string;
    count: number;
}[] => {
    const counts = countsFor(data.observationNumerators);
    return Array.from({length: 2 * data.denominator + 1}, (_, index) => {
        const numerator = data.denominator + index;
        return {
            numerator,
            label: formatFractionValue(numerator, data.denominator),
            count: counts.get(numerator) ?? 0
        };
    });
};

export type FractionLinePlotPresentation = {
    story: string;
    equations: readonly string[];
    answer: string;
};

export const buildFractionLinePlotPresentation = (
    data: MeasurementLinePlotFractionProblem
): FractionLinePlotPresentation => {
    const d = data.denominator;
    const relation: MeasurementLinePlotFractionRelation = data.relation;
    switch (relation.operation) {
        case 'addition':
            return {
                story: 'A cook pours together the two least-filled beakers shown on the plot. How many cups of liquid are there altogether?',
                equations: [`${formatCupAmount(relation.operandNumerators[0], d)} + ${formatCupAmount(relation.operandNumerators[1], d)} = ${formatCupAmount(relation.resultNumerator, d)}`],
                answer: formatCupAmount(relation.resultNumerator, d)
            };
        case 'subtraction':
            return {
                story: 'A student compares the fullest beaker with the second least-filled beaker shown on the plot. How many more cups are in the fuller beaker?',
                equations: [`${formatCupAmount(relation.minuendNumerator, d)} − ${formatCupAmount(relation.subtrahendNumerator, d)} = ${formatCupAmount(relation.resultNumerator, d)}`],
                answer: formatCupAmount(relation.resultNumerator, d)
            };
        case 'multiplication':
            return {
                story: 'All beakers at the most common fill level are poured into a pitcher. How many cups of liquid does the pitcher receive?',
                equations: [`${relation.frequency} × ${formatCupAmount(relation.operandNumerator, d)} = ${formatCupAmount(relation.resultNumerator, d)}`],
                answer: formatCupAmount(relation.resultNumerator, d)
            };
        case 'division':
            return {
                story: 'The liquid in all five plotted beakers is poured together, then redistributed equally into the same five beakers. How many cups will each beaker contain?',
                equations: [
                    `${data.observationNumerators.map(value => formatCupAmount(value, d)).join(' + ')} = ${formatCupAmount(relation.totalNumerator, d)}`,
                    `${formatCupAmount(relation.totalNumerator, d)} ÷ ${relation.recipientCount} = ${formatCupAmount(relation.shareNumerator, d)} per beaker`
                ],
                answer: `${formatCupAmount(relation.shareNumerator, d)} per beaker`
            };
    }
};
