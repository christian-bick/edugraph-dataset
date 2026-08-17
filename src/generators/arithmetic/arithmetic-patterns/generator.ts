import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    ArithmeticPatternExplainFeatureProblem,
    ArithmeticPatternProblem,
    ArithmeticPatternProperty,
    ArithmeticPatternTableBase
} from '../../../types/problems.ts';
import {ArithmeticPatternsGeneratorConfig, ArithmeticPatternsGeneratorSchema} from './spec.ts';

const TABLE_HEADERS = [0, 1, 2, 3, 4, 5, 6] as const;

type OperationLabel = typeof Area.Addition | typeof Area.Multiplication;

type PropertyEvidence = Required<Pick<
    ArithmeticPatternTableBase,
    | 'propertyLaw'
    | 'leftExpression'
    | 'rightExpression'
    | 'propertyResult'
    | 'explanation'
    | 'highlightedCells'
>>;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

function shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
}

const buildTerms = (
    startValue: number,
    ruleOperation: 'add' | 'multiply',
    ruleValue: number,
    count: number
): number[] => {
    const terms = [startValue];
    while (terms.length < count) {
        const previous = terms.at(-1)!;
        terms.push(ruleOperation === 'add' ? previous + ruleValue : previous * ruleValue);
    }
    return terms;
};

const createLegacyProperty = (
    operation: OperationLabel,
    propertyLaw: ArithmeticPatternProperty
): PropertyEvidence => {
    const symbol = operation === Area.Addition ? '+' : '×';
    const apply = (left: number, right: number) =>
        operation === Area.Addition ? left + right : left * right;

    if (propertyLaw === 'commutative') {
        const a = randomInteger(2, 5);
        let b = randomInteger(2, 5);
        if (b === a) b = b === 5 ? 2 : b + 1;
        return {
            propertyLaw,
            leftExpression: `${a} ${symbol} ${b}`,
            rightExpression: `${b} ${symbol} ${a}`,
            propertyResult: apply(a, b),
            explanation: `Changing the order does not change the ${operation === Area.Addition ? 'sum' : 'product'}.`,
            highlightedCells: [[a, b], [b, a]]
        };
    }

    if (propertyLaw === 'associative') {
        const [a, b, c] = operation === Area.Addition ? [2, 3, 1] : [2, 2, 2];
        return {
            propertyLaw,
            leftExpression: `(${a} ${symbol} ${b}) ${symbol} ${c}`,
            rightExpression: `${a} ${symbol} (${b} ${symbol} ${c})`,
            propertyResult: apply(apply(a, b), c),
            explanation: `Changing the grouping does not change the ${operation === Area.Addition ? 'sum' : 'product'}.`,
            highlightedCells: [[a, b], [b, c]]
        };
    }

    const a = randomInteger(2, 4);
    const b = randomInteger(1, 2);
    const c = randomInteger(1, 2);
    return {
        propertyLaw,
        leftExpression: `${a} × (${b} + ${c})`,
        rightExpression: `${a} × ${b} + ${a} × ${c}`,
        propertyResult: a * (b + c),
        explanation: 'Multiplying each addend and then adding the partial products gives the same product.',
        highlightedCells: [[a, b + c], [a, b], [a, c]]
    };
};

const createTableBase = (
    operation: OperationLabel,
    propertyLaw?: ArithmeticPatternProperty
): ArithmeticPatternTableBase => {
    const operationName = operation === Area.Addition ? 'addition' : 'multiplication';
    const table = TABLE_HEADERS.map(row => TABLE_HEADERS.map(column =>
        operation === Area.Addition ? row + column : row * column
    ));
    const focusRow = randomInteger(2, 5);
    const sequence = [...table[focusRow]];
    const patternStep = operation === Area.Addition ? 1 : focusRow;
    const patternAnswer = `Increase by ${patternStep}`;
    const patternOptions = shuffle([
        patternAnswer,
        `Increase by ${patternStep + 1}`,
        'Stay the same'
    ]);

    return {
        operation: operationName,
        headers: [...TABLE_HEADERS],
        table,
        focusRow,
        sequence,
        patternStep,
        patternOptions,
        patternAnswer,
        ...(propertyLaw ? createLegacyProperty(operation, propertyLaw) : {})
    };
};

const createGenerateProblem = (
    operation: OperationLabel,
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternProblem => {
    const isAddition = operation === Area.Addition;
    const startValue = isAddition ? randomInteger(1, 20) : randomInteger(1, 3);
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const ruleValue = isAddition ? randomInteger(2, 9) : randomInteger(2, 4);
    const terms = buildTerms(startValue, ruleOperation, ruleValue, isAddition ? 6 : 5);
    const missingTermIndex = randomInteger(2, terms.length - 1);
    const ruleText = `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`;

    return {
        ...tableBase,
        task: 'generate',
        startValue,
        ruleOperation,
        ruleValue,
        ruleText,
        terms,
        prompt: `Follow the rule to find the missing term in the pattern.`,
        missingTermIndex,
        response: terms[missingTermIndex]
    };
};

const parityDescription = (value: number): 'odd' | 'even' => value % 2 === 0 ? 'even' : 'odd';

const createIdentifyProblem = (
    operation: OperationLabel,
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternProblem => {
    const isAddition = operation === Area.Addition;
    const startValue = isAddition ? randomInteger(1, 10) : 2 * randomInteger(0, 2) + 1;
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const ruleValue = isAddition ? [1, 3, 5][randomInteger(0, 2)]! : [2, 4][randomInteger(0, 1)]!;
    const terms = buildTerms(startValue, ruleOperation, ruleValue, isAddition ? 6 : 5);
    const ruleText = `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`;
    const inferredFeature = isAddition
        ? 'The terms alternate between odd and even.'
        : 'After the starting term, every term is even.';
    const featureEvidence = isAddition
        ? terms.map(term => `${term} is ${parityDescription(term)}`).join('; ')
        : `${terms.slice(1).join(', ')} are all even.`;
    const featureOptions = shuffle(isAddition
        ? [inferredFeature, 'Every term is odd.', 'Every term is even.']
        : [inferredFeature, 'Every term is odd.', 'The terms alternate between odd and even.']);

    return {
        ...tableBase,
        task: 'identify-feature',
        startValue,
        ruleOperation,
        ruleValue,
        ruleText,
        terms,
        prompt: 'Which feature appears in the generated terms but is not stated in the rule?',
        patternOptions: featureOptions,
        patternAnswer: inferredFeature,
        featureOptions,
        inferredFeature,
        featureEvidence,
        response: inferredFeature
    };
};

const createCommutativeExplanation = (
    operation: OperationLabel,
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternExplainFeatureProblem => {
    const isAddition = operation === Area.Addition;
    const startValue = randomInteger(1, 3);
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const ruleValue = randomInteger(2, 3);
    const terms = buildTerms(startValue, ruleOperation, ruleValue, 5);
    const symbol = isAddition ? '+' : '×';
    const propertyResult = terms[1];
    const inferredFeature = `At every step, reversing the current term and ${ruleValue} gives the same next term.`;
    const featureEvidence = `${startValue} ${symbol} ${ruleValue} = ${propertyResult} and ${ruleValue} ${symbol} ${startValue} = ${propertyResult}.`;
    const explanation = `The visible first step gives ${featureEvidence} The commutative property says the two operands may be reversed without changing the ${isAddition ? 'sum' : 'product'}. Because that law applies at every step, reversing the current term and ${ruleValue} will always produce the same next term.`;

    return {
        ...tableBase,
        task: 'explain-feature',
        startValue,
        ruleOperation,
        ruleValue,
        ruleText: `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`,
        terms,
        prompt: `Explain why this feature continues: ${inferredFeature}`,
        inferredFeature,
        featureEvidence,
        response: explanation,
        propertyLaw: 'commutative',
        leftExpression: `${startValue} ${symbol} ${ruleValue}`,
        rightExpression: `${ruleValue} ${symbol} ${startValue}`,
        propertyResult,
        explanation,
        highlightedCells: [[startValue, ruleValue], [ruleValue, startValue]]
    };
};

const createAssociativeExplanation = (
    operation: OperationLabel,
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternExplainFeatureProblem => {
    const isAddition = operation === Area.Addition;
    const startValue = randomInteger(1, 2);
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const ruleValue = randomInteger(2, 3);
    const terms = buildTerms(startValue, ruleOperation, ruleValue, 5);
    const symbol = isAddition ? '+' : '×';
    const twoStepValue = isAddition ? ruleValue + ruleValue : ruleValue * ruleValue;
    const propertyResult = terms[2];
    const relation = isAddition
        ? `${twoStepValue} greater than`
        : `${twoStepValue} times`;
    const inferredFeature = `Every second term is ${relation} the term two positions before it.`;
    const featureEvidence = `${terms[0]}, ${terms[2]}, and ${terms[4]} show the same two-step change of ${twoStepValue}.`;
    const explanation = `${featureEvidence} The associative property rewrites (${startValue} ${symbol} ${ruleValue}) ${symbol} ${ruleValue} as ${startValue} ${symbol} (${ruleValue} ${symbol} ${ruleValue}). Thus every pair of consecutive steps combines into one ${isAddition ? `addition of ${twoStepValue}` : `multiplication by ${twoStepValue}`}, so the every-second-term feature continues.`;

    return {
        ...tableBase,
        task: 'explain-feature',
        startValue,
        ruleOperation,
        ruleValue,
        ruleText: `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`,
        terms,
        prompt: `Explain why this feature continues: ${inferredFeature}`,
        inferredFeature,
        featureEvidence,
        response: explanation,
        propertyLaw: 'associative',
        leftExpression: `(${startValue} ${symbol} ${ruleValue}) ${symbol} ${ruleValue}`,
        rightExpression: `${startValue} ${symbol} (${ruleValue} ${symbol} ${ruleValue})`,
        propertyResult,
        explanation,
        highlightedCells: [[startValue, ruleValue], [terms[1], ruleValue]]
    };
};

const createDistributiveExplanation = (
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternExplainFeatureProblem => {
    const ruleValue = randomInteger(2, 6);
    const terms = [...tableBase.table[ruleValue]];
    const column = randomInteger(1, 5);
    const propertyResult = terms[column + 1];
    const inferredFeature = `Each term is ${ruleValue} greater than the preceding term.`;
    const featureEvidence = `${ruleValue} × ${column} = ${terms[column]} and ${ruleValue} × ${column + 1} = ${propertyResult}.`;
    const explanation = `${featureEvidence} The distributive property rewrites ${ruleValue} × (${column} + 1) as ${ruleValue} × ${column} + ${ruleValue} × 1. The extra product is always ${ruleValue}, so every next term in this multiplication pattern is ${ruleValue} greater.`;

    return {
        ...tableBase,
        task: 'explain-feature',
        startValue: 0,
        ruleOperation: 'multiply-position',
        ruleValue,
        ruleText: `Multiply each successive whole-number position by ${ruleValue}.`,
        terms,
        prompt: `Explain why this feature continues: ${inferredFeature}`,
        inferredFeature,
        featureEvidence,
        response: explanation,
        propertyLaw: 'distributive',
        leftExpression: `${ruleValue} × (${column} + 1)`,
        rightExpression: `${ruleValue} × ${column} + ${ruleValue} × 1`,
        propertyResult,
        explanation,
        highlightedCells: [[ruleValue, column], [ruleValue, column + 1], [ruleValue, 1]]
    };
};

const createExplainProblem = (
    operation: OperationLabel,
    propertyLaw: ArithmeticPatternProperty,
    tableBase: ArithmeticPatternTableBase
): ArithmeticPatternExplainFeatureProblem => {
    if (propertyLaw === 'commutative') {
        return createCommutativeExplanation(operation, tableBase);
    }
    if (propertyLaw === 'associative') {
        return createAssociativeExplanation(operation, tableBase);
    }
    return createDistributiveExplanation(tableBase);
};

export class ArithmeticPatternsGenerator implements ProblemGenerator<
    ArithmeticPatternProblem,
    ArithmeticPatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPatternsGeneratorSchema;

    generate(config: ArithmeticPatternsGeneratorConfig): ProblemStub<ArithmeticPatternProblem> | null {
        validateConfigFields('arithmetic-patterns', config, [
            'task',
            'operation',
            'useCommutativeLaw',
            'useAssociativeLaw',
            'useDistributiveLaw'
        ]);

        const operation = config.operation;
        if (operation !== Area.Addition && operation !== Area.Multiplication) return null;

        const requestedProperties = [
            config.useCommutativeLaw ? 'commutative' : null,
            config.useAssociativeLaw ? 'associative' : null,
            config.useDistributiveLaw ? 'distributive' : null
        ].filter((value): value is ArithmeticPatternProperty => value !== null);
        if (requestedProperties.length > 1) return null;
        if (requestedProperties[0] === 'distributive' && operation !== Area.Multiplication) return null;

        const propertyLaw = requestedProperties[0];
        if ((config.task === 'legacy-identify'
            || config.task === 'generate'
            || config.task === 'identify-feature') && propertyLaw) {
            return null;
        }
        if ((config.task === 'legacy-explain' || config.task === 'explain-feature') && !propertyLaw) {
            return null;
        }
        if (!config.task || ![
            'legacy-identify',
            'legacy-explain',
            'generate',
            'identify-feature',
            'explain-feature'
        ].includes(config.task)) {
            return null;
        }

        const isLegacy = config.task === 'legacy-identify' || config.task === 'legacy-explain';
        const tableBase = createTableBase(operation, isLegacy ? propertyLaw : undefined);
        if (config.task === 'legacy-identify') return {data: tableBase};
        if (config.task === 'legacy-explain') return {data: tableBase};
        if (config.task === 'generate') {
            return {data: createGenerateProblem(operation, tableBase)};
        }
        if (config.task === 'identify-feature') {
            return {data: createIdentifyProblem(operation, tableBase)};
        }
        return {data: createExplainProblem(operation, propertyLaw!, tableBase)};
    }
}
