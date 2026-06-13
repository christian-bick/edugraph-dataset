import {Ability, Area, Scope} from "edugraph-ts";
import PermutationBuilder from "../../lib/permutation-builder.ts";
import {numScopes, withNegativesScope} from "../../lib/labels.ts";

function generatePermutations() {
    return [
        // Same operations with same problem digits
        ...new PermutationBuilder()
            .applyRange(['digitsNum1', "digitsNum2"], [2, 3])
            .applyVariants('operations', ['add', 'subtract', 'multiply'])
            .applyVariants('allowNegatives', [false, true])
            .build(),

        // Mixed operations with same digits
        ...new PermutationBuilder()
            .applyRange(['digitsNum1', "digitsNum2"], [2, 3])
            .applyVariants('operations', ['add,subtract', 'add,subtract,multiply'])
            .applyVariants('allowNegatives', [false, true])
            .build(),
    ]
}

function generateName(params: { [key: string]: any }) {
    const {digitsNum1, digitsNum2, operations, allowNegatives} = params;
    let name = `${digitsNum1}x${digitsNum2}_for_${operations.replaceAll(',', '-')}`;
    if (allowNegatives) {
        name += '_neg';
    }
    return name;
}

function generateLabels(params: { [key: string]: any }) {
    const scopes = [
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        withNegativesScope(params.allowNegatives),
        ...numScopes([params.digitsNum1 || 3, params.digitsNum2 || 3]),
    ]

    const areas = params.operations.split(',').map((op: string) => {
        const mapping: { [key: string]: Area } = {
            add: Area.IntegerAddition,
            subtract: Area.IntegerSubtraction,
            multiply: Area.IntegerMultiplication
        }
        return mapping[op]
    })

    return {
        Area: areas,
        Scope: scopes,
        Ability: [Ability.ProcedureExecution],
    }
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
};
