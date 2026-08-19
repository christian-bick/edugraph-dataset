import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticPatternProblem, ArithmeticPatternProperty} from '../../../types/problems.ts';
import {ArithmeticPatternsGeneratorConfig, ArithmeticPatternsGeneratorSchema} from './spec.ts';

const TABLE_HEADERS = [0, 1, 2, 3, 4, 5, 6] as const;

type OperationLabel = typeof Area.Addition | typeof Area.Multiplication;
type PatternCore = Pick<
    ArithmeticPatternProblem,
    | 'startValue'
    | 'ruleOperation'
    | 'ruleValue'
    | 'ruleText'
    | 'terms'
    | 'inferredFeature'
    | 'featureEvidence'
    | 'explanation'
    | 'propertyLaw'
    | 'leftExpression'
    | 'rightExpression'
    | 'propertyResult'
    | 'highlightedCells'
>;

const randomInteger = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

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

const parityDescription = (value: number): 'odd' | 'even' => value % 2 === 0 ? 'even' : 'odd';

const createDefaultPattern = (operation: OperationLabel): PatternCore => {
    const isAddition = operation === Area.Addition;
    const startValue = isAddition ? randomInteger(1, 10) : 2 * randomInteger(0, 2) + 1;
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const ruleValue = isAddition
        ? [1, 3, 5][randomInteger(0, 2)]!
        : [2, 4][randomInteger(0, 1)]!;
    const terms = buildTerms(startValue, ruleOperation, ruleValue, isAddition ? 6 : 5);
    const ruleText = `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`;
    const inferredFeature = isAddition
        ? 'The terms alternate between odd and even.'
        : 'After the starting term, every term is even.';
    const featureEvidence = isAddition
        ? terms.map(term => `${term} is ${parityDescription(term)}`).join('; ')
        : `${terms.slice(1).join(', ')} are all even.`;
    const explanation = isAddition
        ? `${featureEvidence} Adding the odd number ${ruleValue} changes odd to even and even to odd at every step.`
        : `${featureEvidence} Multiplying any whole number by the even number ${ruleValue} produces an even number.`;

    return {
        startValue,
        ruleOperation,
        ruleValue,
        ruleText,
        terms,
        inferredFeature,
        featureEvidence,
        explanation
    };
};

const createCommutativePattern = (operation: OperationLabel): PatternCore => {
    const isAddition = operation === Area.Addition;
    const startValue = randomInteger(1, 3);
    const ruleValue = randomInteger(2, 3);
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const terms = buildTerms(startValue, ruleOperation, ruleValue, 5);
    const symbol = isAddition ? '+' : '×';
    const propertyResult = terms[1];
    const inferredFeature = `At every step, reversing the current term and ${ruleValue} gives the same next term.`;
    const featureEvidence = `${startValue} ${symbol} ${ruleValue} = ${propertyResult} and ${ruleValue} ${symbol} ${startValue} = ${propertyResult}.`;
    const explanation = `${featureEvidence} The commutative property says the operands may be reversed without changing the ${isAddition ? 'sum' : 'product'}, so the same feature holds at every step.`;

    return {
        startValue,
        ruleOperation,
        ruleValue,
        ruleText: `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`,
        terms,
        inferredFeature,
        featureEvidence,
        explanation,
        propertyLaw: 'commutative',
        leftExpression: `${startValue} ${symbol} ${ruleValue}`,
        rightExpression: `${ruleValue} ${symbol} ${startValue}`,
        propertyResult,
        highlightedCells: [[startValue, ruleValue], [ruleValue, startValue]]
    };
};

const createAssociativePattern = (operation: OperationLabel): PatternCore => {
    const isAddition = operation === Area.Addition;
    const startValue = randomInteger(1, 2);
    const ruleValue = randomInteger(2, 3);
    const ruleOperation = isAddition ? 'add' : 'multiply';
    const terms = buildTerms(startValue, ruleOperation, ruleValue, 5);
    const symbol = isAddition ? '+' : '×';
    const twoStepValue = isAddition ? ruleValue + ruleValue : ruleValue * ruleValue;
    const propertyResult = terms[2];
    const relation = isAddition ? `${twoStepValue} greater than` : `${twoStepValue} times`;
    const inferredFeature = `Every second term is ${relation} the term two positions before it.`;
    const featureEvidence = `${terms[0]}, ${terms[2]}, and ${terms[4]} show the same two-step change of ${twoStepValue}.`;
    const explanation = `${featureEvidence} The associative property rewrites (${startValue} ${symbol} ${ruleValue}) ${symbol} ${ruleValue} as ${startValue} ${symbol} (${ruleValue} ${symbol} ${ruleValue}), combining every two consecutive steps into one equivalent change.`;

    return {
        startValue,
        ruleOperation,
        ruleValue,
        ruleText: `${isAddition ? 'Add' : 'Multiply by'} ${ruleValue} to get each next term.`,
        terms,
        inferredFeature,
        featureEvidence,
        explanation,
        propertyLaw: 'associative',
        leftExpression: `(${startValue} ${symbol} ${ruleValue}) ${symbol} ${ruleValue}`,
        rightExpression: `${startValue} ${symbol} (${ruleValue} ${symbol} ${ruleValue})`,
        propertyResult,
        highlightedCells: [[startValue, ruleValue], [terms[1], ruleValue]]
    };
};

const createDistributivePattern = (table: number[][]): PatternCore => {
    const ruleValue = randomInteger(2, 6);
    const terms = [...table[ruleValue]];
    const column = randomInteger(1, 5);
    const propertyResult = terms[column + 1];
    const inferredFeature = `Each term is ${ruleValue} greater than the preceding term.`;
    const featureEvidence = `${ruleValue} × ${column} = ${terms[column]} and ${ruleValue} × ${column + 1} = ${propertyResult}.`;
    const explanation = `${featureEvidence} The distributive property rewrites ${ruleValue} × (${column} + 1) as ${ruleValue} × ${column} + ${ruleValue} × 1. The extra product is always ${ruleValue}, so every next term is ${ruleValue} greater.`;

    return {
        startValue: 0,
        ruleOperation: 'multiply-position',
        ruleValue,
        ruleText: `Multiply each successive whole-number position by ${ruleValue}.`,
        terms,
        inferredFeature,
        featureEvidence,
        explanation,
        propertyLaw: 'distributive',
        leftExpression: `${ruleValue} × (${column} + 1)`,
        rightExpression: `${ruleValue} × ${column} + ${ruleValue} × 1`,
        propertyResult,
        highlightedCells: [[ruleValue, column], [ruleValue, column + 1], [ruleValue, 1]]
    };
};

const createProblem = (
    operation: OperationLabel,
    propertyLaw?: ArithmeticPatternProperty
): ArithmeticPatternProblem => {
    const operationName = operation === Area.Addition ? 'addition' : 'multiplication';
    const table = TABLE_HEADERS.map(row => TABLE_HEADERS.map(column =>
        operation === Area.Addition ? row + column : row * column
    ));
    const focusRow = randomInteger(2, 5);
    const pattern = propertyLaw === 'commutative'
        ? createCommutativePattern(operation)
        : propertyLaw === 'associative'
            ? createAssociativePattern(operation)
            : propertyLaw === 'distributive'
                ? createDistributivePattern(table)
                : createDefaultPattern(operation);

    return {
        operation: operationName,
        headers: [...TABLE_HEADERS],
        table,
        focusRow,
        sequence: [...table[focusRow]],
        patternStep: operation === Area.Addition ? 1 : focusRow,
        ...pattern
    };
};

export class ArithmeticPatternsGenerator implements ProblemGenerator<
    ArithmeticPatternProblem,
    ArithmeticPatternsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = ArithmeticPatternsGeneratorSchema;

    generate(config: ArithmeticPatternsGeneratorConfig): ProblemStub<ArithmeticPatternProblem> | null {
        validateConfigFields('arithmetic-patterns', config, [
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

        return {data: createProblem(operation, requestedProperties[0])};
    }
}
