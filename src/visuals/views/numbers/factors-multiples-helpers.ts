import {PositiveFactorEvidence} from '../../../types/problems.ts';

export function hasCompletePositiveFactorEvidence(data: PositiveFactorEvidence): boolean {
    if (!Number.isInteger(data.number) || data.number < 1 || data.number >= 100) return false;
    if (!Array.isArray(data.factors) || !Array.isArray(data.factorPairs)) return false;

    const expectedFactors = Array.from(
        {length: data.number},
        (_, index) => index + 1
    ).filter(factor => data.number % factor === 0);
    if (data.factorCount !== expectedFactors.length
        || data.factors.length !== expectedFactors.length
        || data.factors.some((factor, index) => factor !== expectedFactors[index])) {
        return false;
    }

    const expectedPairs = expectedFactors
        .filter(lowerFactor => lowerFactor <= data.number / lowerFactor)
        .map(lowerFactor => ({
            lowerFactor,
            upperFactor: data.number / lowerFactor,
            equation: `${lowerFactor} × ${data.number / lowerFactor} = ${data.number}`
        }));

    return data.factorPairs.length === expectedPairs.length
        && data.factorPairs.every((pair, index) => (
            pair.lowerFactor === expectedPairs[index].lowerFactor
            && pair.upperFactor === expectedPairs[index].upperFactor
            && pair.equation === expectedPairs[index].equation
        ));
}
