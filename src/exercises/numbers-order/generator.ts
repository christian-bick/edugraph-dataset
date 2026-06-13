import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyVariants('includesZero', ['true', 'false'])
        .applyVariants('desc', ['true', 'false'])
        .build()
}

function generateName(params: { [key: string]: any }) {
    return `order-numbers${params.includesZero === 'true' ? '_with-zero' : ''}_${params.desc === 'true' ? 'desc' : 'asc'}`;
}

function generateLabels(params: { [key: string]: any }) {
    return {
        Area: [Area.NumerationWithIntegers],
        Ability: [Ability.ProcedureApplication, Ability.ProcedureExecution],
        Scope: [Scope.ArabicNumerals, Scope.Base10, Scope.NumbersSmaller10, params.includesZero === 'true' ? Scope.NumbersWithZero : Scope.NumbersWithoutZero],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
