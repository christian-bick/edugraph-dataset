import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyVariants('digits', [1, 2, 3])
        .applyVariants('includesZero', [true, false])
        .build()
}

function generateName(params: { [key: string]: any }) {
    return `compare-numbers-${params.digits}-digits${params.includesZero ? '_with-zero' : ''}`;
}

function generateLabels(params: { [key: string]: any }) {
    let scope;
    if (params.digits === 1) scope = Scope.NumbersSmaller10;
    else if (params.digits === 2) scope = Scope.NumbersSmaller100;
    else scope = Scope.NumbersSmaller1000;

    return {
        Area: [Area.NumerationWithIntegers],
        Ability: [Ability.ProcedureApplication, Ability.ProcedureExecution],
        Scope: [Scope.ArabicNumerals, Scope.Base10, scope, params.includesZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
