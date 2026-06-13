import PermutationBuilder from "../../lib/permutation-builder.ts";
import {Area, Scope, Ability} from "edugraph-ts";
import {numScopes, withNegativesScope} from "../../lib/labels.ts";

function generatePermutations() {
    return [
        // Same operations with same problem digits
        ...new PermutationBuilder()
            .applyRange(['digitsNum1', "digitsNum2"], [2, 3])
            .applyVariants('operations', ['add', 'subtract', 'multiply', 'divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'random'])
            .applyVariants('allowNegatives', [false, true])
            .build(),

        // Same operations with random problem digits
        ...new PermutationBuilder()
            .applyVariants('operations', ['add', 'subtract', 'multiply', 'divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer'])
            .applyVariants('allowNegatives', [false, true])
            .build(),

        // Mixed operations with same digits
        ...new PermutationBuilder()
            .applyRange(['digitsNum1', "digitsNum2"], [2, 3])
            .applyVariants('operations', ['add,subtract', 'multiply,divide', 'add,subtract,multiply', 'add,subtract,multiply,divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'operator', 'random'])
            .applyVariants('allowNegatives', [false, true])
            .build(),

        // Mixed operations with random digits
        ...new PermutationBuilder()
            .applyVariants('operations', ['add,subtract', 'multiply,divide', 'add,subtract,multiply', 'add,subtract,multiply,divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'operator', 'random'])
            .applyVariants('allowNegatives', [false, true])
            .build(),
    ]
}

function generateName(params: { [key: string]: any }) {
    const {digitsNum1, digitsNum2, operations, allowNegatives, blankPart} = params;
    let name = `${digitsNum1 || 'R'}x${digitsNum2 || 'R'}_hide_${blankPart}_for_${operations.replaceAll(',', '-')}`;
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
            divide: Area.IntegerDivision,
            multiply: Area.IntegerMultiplication
        }
        return mapping[op]
    })

    const blank = params.blankPart
    const abilities = (blank === 'operator' || blank === 'random') ? [Ability.ProcedureIdentification] : []
    abilities.push(Ability.ProcedureApplication)

    return {
        Area: areas,
        Scope: scopes,
        Ability: abilities,
    }
}

export default {
    generatePermutations,
    generateName,
    generateLabels,
}
