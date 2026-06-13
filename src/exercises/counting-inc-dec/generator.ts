import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyVariants('max', [9])
        .applyVariants('type', ['inc', 'dec', 'mixed'])
        .build()
}

function generateName(params: { [key: string]: any }) {
    return `counting-${params.type}-${params.max}`;
}

function generateLabels(params: { [key: string]: any }) {
    return {
        Area: [Area.NumerationWithIntegers],
        Ability: [Ability.ProcedureApplication, Ability.ProcedureExecution],
        Scope: [Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
