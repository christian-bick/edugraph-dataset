import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {ArithmeticPatternProblem, ArithmeticPatternProperty} from '../../../types/problems.ts';
import {ArithmeticPatternsGeneratorConfig, ArithmeticPatternsGeneratorSchema} from './spec.ts';

const TABLE_HEADERS = [0, 1, 2, 3, 4, 5, 6] as const;

function shuffle<T>(values: T[]): T[] {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
    }
    return values;
}

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

        const operationName = operation === Area.Addition ? 'addition' : 'multiplication';
        const table = TABLE_HEADERS.map(row => TABLE_HEADERS.map(column =>
            operation === Area.Addition ? row + column : row * column
        ));
        const focusRow = 2 + Math.floor(random() * 4);
        const sequence = [...table[focusRow]];
        const patternStep = operation === Area.Addition ? 1 : focusRow;
        const answer = `Increase by ${patternStep}`;
        const patternOptions = shuffle([
            answer,
            `Increase by ${patternStep + 1}`,
            'Stay the same'
        ]);

        const propertyLaw = requestedProperties[0];
        const property = propertyLaw
            ? this.createProperty(operation, propertyLaw)
            : undefined;

        return {
            data: {
                operation: operationName,
                headers: [...TABLE_HEADERS],
                table,
                focusRow,
                sequence,
                patternStep,
                patternOptions,
                patternAnswer: answer,
                ...property
            }
        };
    }

    private createProperty(
        operation: typeof Area.Addition | typeof Area.Multiplication,
        propertyLaw: ArithmeticPatternProperty
    ): Pick<
        ArithmeticPatternProblem,
        'propertyLaw' | 'leftExpression' | 'rightExpression' | 'propertyResult' | 'explanation' | 'highlightedCells'
    > {
        const symbol = operation === Area.Addition ? '+' : '×';
        const apply = (left: number, right: number) =>
            operation === Area.Addition ? left + right : left * right;

        if (propertyLaw === 'commutative') {
            const a = 2 + Math.floor(random() * 4);
            let b = 2 + Math.floor(random() * 4);
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
            const result = apply(apply(a, b), c);
            return {
                propertyLaw,
                leftExpression: `(${a} ${symbol} ${b}) ${symbol} ${c}`,
                rightExpression: `${a} ${symbol} (${b} ${symbol} ${c})`,
                propertyResult: result,
                explanation: `Changing the grouping does not change the ${operation === Area.Addition ? 'sum' : 'product'}.`,
                highlightedCells: [[a, b], [b, c]]
            };
        }

        const a = 2 + Math.floor(random() * 3);
        const b = 1 + Math.floor(random() * 2);
        const c = 1 + Math.floor(random() * 2);
        return {
            propertyLaw,
            leftExpression: `${a} × (${b} + ${c})`,
            rightExpression: `${a} × ${b} + ${a} × ${c}`,
            propertyResult: a * (b + c),
            explanation: 'Multiplying each addend and then adding the partial products gives the same product.',
            highlightedCells: [[a, b + c], [a, b], [a, c]]
        };
    }
}
