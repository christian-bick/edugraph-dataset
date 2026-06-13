import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";

function generatePermutations() {
    return new PermutationBuilder()
        .applyVariants('bandLength', [10, 20])
        .applyVariants('decimal', ['true', 'false'])
        .applyVariants('reverse', ['true', 'false'])
        .build()
}

function generateName(params: { [key: string]: any }) {
    return `measure-length-${params.bandLength}cm_in-${params.decimal === 'true' ? 'cm' : 'mm'}${params.reverse === 'true' ? '_reverse' : ''}`;
}

function generateLabels(params: { [key: string]: any }) {
    return {
        Area: [Area.MeasuringObjects, Area.DigitNotation],
        Ability: [Ability.ProcedureApplication, Ability.ProcedureExecution],
        Scope: [Scope.CentimeterScale, Scope.MillimeterScale, Scope.Tapemeter],
    };
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
