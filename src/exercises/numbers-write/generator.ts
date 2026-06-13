import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyRange(['number'], [1, 9])
        .applyVariants('outline', ['true', 'false'])
        .build()
}

function generateName(params: { [key: string]: any }) {
    return `write-number-${params.number}${params.outline === 'true' ? '_outline' : ''}`;
}

function generateLabels(params: { [key: string]: any }) {
    return {
        Area: [Area.IntegerNotation],
        Ability: [Ability.ProcedureExecution],
        Scope: [Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, Scope.NumbersWithoutZero],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
