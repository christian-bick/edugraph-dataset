import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {EquationJudgmentProblem} from '../../../types/problems.ts';
import {ArithmeticEquationJudgmentGeneratorConfig, ArithmeticEquationJudgmentGeneratorSchema, spec} from './spec.ts';
import {adjacentFalseAnswer, type ExactJudgmentRelation} from './claims.ts';

function drawExactRelation(operation: 'addition' | 'subtraction', requireZero: boolean,
    min: number, max: number): ExactJudgmentRelation | null {
    const integer = (lower: number, upper: number): number | null => lower > upper ? null
        : lower + Math.floor(random() * (upper - lower + 1));
    if (requireZero) {
        const magnitude = integer(min, max);
        if (magnitude === null) return null;
        return operation === 'addition' ? {num1: 0, num2: magnitude, operation, answer: magnitude}
            : {num1: magnitude, num2: magnitude, operation, answer: 0};
    }
    const first = integer(min, max - min);
    const second = first === null ? null : integer(min, max - first);
    if (first === null || second === null) return null;
    return operation === 'addition' ? {num1: first, num2: second, operation, answer: first + second}
        : {num1: first + second, num2: first, operation, answer: second};
}

export class ArithmeticEquationJudgmentGenerator implements ProblemGenerator<EquationJudgmentProblem, ArithmeticEquationJudgmentGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticEquationJudgmentGeneratorSchema;
    readonly spec = spec;

    generate(config: ArithmeticEquationJudgmentGeneratorConfig): ProblemStub<EquationJudgmentProblem> | null {
        validateConfigFields('arithmetic-equation-judgment', config, ['relation', 'range']);
        const relation = config.relation!;
        if (!['addition-positive', 'addition-zero', 'subtraction-positive', 'subtraction-zero'].includes(relation)) return null;
        const operation = relation.startsWith('addition-') ? 'addition' : 'subtraction';
        const zero = relation.endsWith('-zero');
        const range = config.range!;
        const min = Math.max(1, Math.ceil(range.min));
        const max = Math.floor(range.max);
        if (min > max) return null;

        // Preserve every old exact relation and bounded neighboring claim. A selected
        // zero profile conditions these mathematical cases before emitting the payload.
        for (let attempt = 0; attempt < 4096; attempt++) {
            const requireZero = zero && (operation === 'addition' || random() < 0.5);
            const exact = drawExactRelation(operation, requireZero, min, max);
            if (!exact) return null;
            const claimedAnswer = random() < 0.5 ? exact.answer : adjacentFalseAnswer(exact);
            if (claimedAnswer === undefined || [exact.num1, exact.num2, exact.answer, claimedAnswer].includes(0) !== zero) continue;
            return {data: {...exact, claimedAnswer}};
        }
        return null;
    }
}
