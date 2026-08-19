import {FractionArithmeticProblem} from '../../../types/problems.ts';

export type FractionArithmeticPresentation =
    | 'interpretation'
    | 'understanding'
    | 'execution-model'
    | 'execution-word';

export const presentFractionArithmeticProblem = (
    data: FractionArithmeticProblem,
    presentation: FractionArithmeticPresentation
): FractionArithmeticProblem | null => {
    if (data.task === 'fraction-operation') {
        if (presentation === 'execution-model' || presentation === 'execution-word') return data;
        if (presentation !== 'interpretation') return null;
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
        if (presentation === 'understanding' || presentation === 'execution-model') return data;
        if (presentation !== 'execution-word') return null;
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
        return presentation === 'understanding' ? data : null;
    }
    if (data.task === 'mixed-operation' || data.task === 'tenths-hundredths-addition') {
        return presentation === 'execution-model' || presentation === 'execution-word'
            ? data
            : null;
    }
    if (data.task === 'unit-fraction-multiple') {
        return presentation === 'interpretation' ? data : null;
    }
    return null;
};
