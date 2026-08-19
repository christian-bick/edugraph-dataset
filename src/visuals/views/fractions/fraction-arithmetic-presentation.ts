import {Ability} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';
import {FractionArithmeticProblem} from '../../../types/problems.ts';

export const FractionArithmeticViewSchema = {
    abilities: [[
        Ability.Interpretation,
        Ability.ProcedureUnderstanding,
        Ability.Formalization,
        Ability.ProcedureExecution
    ], matchAllExactLabels]
} as const;

const hasExactly = (actual: readonly string[], expected: readonly string[]): boolean =>
    actual.length === expected.length && expected.every(label => actual.includes(label));

export const presentFractionArithmeticProblem = (
    data: FractionArithmeticProblem,
    abilities: readonly string[]
): FractionArithmeticProblem | null => {
    if (data.task === 'fraction-operation') {
        if (hasExactly(abilities, [Ability.ProcedureExecution])) return data;
        if (!hasExactly(abilities, [Ability.Interpretation])) return null;
        const action = data.action === 'join' ? 'joining' : 'separating';
        const question = data.operation === 'addition'
            ? 'Which joining operation and equation describe the colored parts?'
            : 'Which separating operation and equation describe the change?';
        return {
            ...data,
            task: 'interpret-operation',
            story: {...data.story, question, unknownRole: 'operation'},
            prompt: `Interpret the model as ${action} equal parts of the same whole.`,
            questionEquation: `${data.first.notation} ? ${data.second.notation} = ?`,
            answer: data.solutionEquation,
            answerStatement: `The ${action} operation is ${data.operation}: ${data.solutionEquation}.`
        };
    }

    if (data.task === 'whole-number-fraction-product') {
        if (hasExactly(abilities, [Ability.ProcedureUnderstanding])) return data;
        if (!hasExactly(abilities, [Ability.ProcedureExecution])) return null;
        const question = 'How many meters of ribbon do the craft kits use altogether?';
        return {
            ...data,
            task: 'fraction-multiplication-problem',
            story: {...data.story, question},
            prompt: question,
            answerStatement: `The craft kits use ${data.product.notation} meters of ribbon.`
        };
    }

    if (data.task === 'decompose') {
        return hasExactly(abilities, [
            Ability.ProcedureUnderstanding,
            Ability.Formalization
        ]) ? data : null;
    }
    if (data.task === 'mixed-operation' || data.task === 'tenths-hundredths-addition') {
        return hasExactly(abilities, [Ability.ProcedureExecution]) ? data : null;
    }
    if (data.task === 'unit-fraction-multiple') {
        return hasExactly(abilities, [Ability.Interpretation]) ? data : null;
    }
    return null;
};
