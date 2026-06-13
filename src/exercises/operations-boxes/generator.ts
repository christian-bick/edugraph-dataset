import PermutationBuilder from "../../lib/permutation-builder.ts";
import {Area, Scope, Ability} from "edugraph-ts";
import {withNegativesScope} from "../../lib/labels.ts";

function generatePermutations() {
    return [
        ...new PermutationBuilder()
            .applyVariants('operations', ['add', 'subtract', 'multiply', 'divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'random'])
            .applyVariants('includeZero', [true, false])
            .applyVariants('allowNegatives', [false, true])
            .build(),

        ...new PermutationBuilder()
            .applyVariants('operations', ['add', 'subtract', 'multiply', 'divide'])
            .applyVariants('blankPart', ['answer', 'problem', 'problem-answer', 'random'])
            .applyVariants('includeTenCarry', [true, false])
            .applyVariants('allowNegatives', [false, true])
            .build(),
    ]
}

function generateName(params: { [key: string]: any }) {
    const {operations = 'all', allowNegatives, blankPart = 'answer', includeTenCarry, includeZero} = params;
    let name = `single-digit_${operations.replaceAll(',', '-')}`;
    name += `_${blankPart}`;
    if (Object.prototype.hasOwnProperty.call(params, 'includeTenCarry')) {
        name += includeTenCarry ? '_with-carry' : '_no-carry';
    }
    if (Object.prototype.hasOwnProperty.call(params, 'includeZero')) {
        name += includeZero ? '_with-zero' : '_no-zero';
    }
    if (allowNegatives) {
        name += '_neg';
    }
    return name;
}

function generateLabels(params: { [key: string]: any }) {

    let numScopes;
    if (!params.includeTenCarry) {
        numScopes = [Scope.NumbersSmaller10]
    } else if (params.operations.includes('multiply') || params.operations.includes('divide')) {
        numScopes = [Scope.NumbersSmaller100]
    } else {
        numScopes = [Scope.NumbersSmaller20]
    }

    const scopes = [
        Scope.ArabicNumerals,
        Scope.Base10,
        params.includeZero ? Scope.NumbersWithZero : Scope.NumbersWithoutZero,
        withNegativesScope(params.allowNegatives),
        ...numScopes
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
