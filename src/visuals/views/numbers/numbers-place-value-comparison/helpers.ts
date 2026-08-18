import {ComparisonProblem, LegacyComparisonProblem} from '../../../../types/problems.ts';

export type TensAndOnesDecomposition = {
    tens: number;
    ones: number;
};

export type DecidingPlace = 'tens' | 'ones' | 'all';

const isSupportedInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) >= 10 && (value as number) <= 100;

const resolvedRelation = (
    num1: number,
    num2: number
): LegacyComparisonProblem['relation'] => {
    if (num1 < num2) return 'less';
    if (num1 > num2) return 'greater';
    return 'equal';
};

export const isValidPlaceValueComparisonProblem = (
    data: ComparisonProblem
): data is LegacyComparisonProblem =>
    !('task' in data)
    && isSupportedInteger(data.num1)
    && isSupportedInteger(data.num2)
    && (data.relation === 'less' || data.relation === 'greater' || data.relation === 'equal')
    && data.relation === resolvedRelation(data.num1, data.num2);

export const decomposeTensAndOnes = (value: number): TensAndOnesDecomposition => ({
    tens: Math.floor(value / 10),
    ones: value % 10
});

export const findDecidingPlace = (
    left: TensAndOnesDecomposition,
    right: TensAndOnesDecomposition
): DecidingPlace => {
    if (left.tens !== right.tens) return 'tens';
    if (left.ones !== right.ones) return 'ones';
    return 'all';
};

export const relationSymbol = (
    relation: LegacyComparisonProblem['relation']
): '<' | '>' | '=' => {
    if (relation === 'less') return '<';
    if (relation === 'greater') return '>';
    return '=';
};
