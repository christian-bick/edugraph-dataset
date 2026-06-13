import {Ability, Area, Scope} from "edugraph-ts";

function generatePermutations() {
    return [
        {params: {count: 5}},
        {params: {count: 10}},
        {params: {count: 15}},
        {params: {count: 20}},
    ];
}

function generateName(params: { [key: string]: any }) {
    return `counting-${params.count}`;
}

function generateLabels(params: { [key: string]: any }) {
    return {
        Area: [Area.NumerationWithIntegers, Area.IntegerNotation],
        Ability: [Ability.ProcedureExecution],
        Scope: [
            Scope.Base10,
            Scope.ArabicNumerals,
            Scope.NumbersWithoutZero,
            Scope.NumbersWithoutNegatives,
            Scope.CountingSymbols,
            params.count <= 10 ? Scope.NumbersSmaller10 : Scope.NumbersSmaller20
        ],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
