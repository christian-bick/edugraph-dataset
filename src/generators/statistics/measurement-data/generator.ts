import {Area, Scope} from 'edugraph-ts';
import {random} from '../../../lib/random.ts';
import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementDataProblem,
    MeasurementExtremaRelation,
    MeasurementObservation
} from '../../../types/problems.ts';
import {MeasurementDataGeneratorConfig, MeasurementDataGeneratorSchema} from './spec.ts';

const objects: MeasurementObservation['object'][] = ['pencil', 'crayon', 'ribbon', 'key', 'brush', 'block'];

const shuffle = <T>(values: T[]): T[] => {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = Math.floor(random() * (index + 1));
        [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
    }
    return values;
};

const makeObservations = (lengths: readonly number[]): MeasurementObservation[] =>
    objects.map((object, index) => ({object, value: lengths[index]!}));

const makeEighthInchObservations = (): MeasurementObservation[] => {
    const axisStartEighths = (1 + Math.floor(random() * 2)) * 8;
    const interiorOffset = 5 + Math.floor(random() * 10);
    const offsets = shuffle([1, 2, 4, 4, interiorOffset, 16]);
    return makeObservations(offsets.map(offset => (axisStartEighths + offset) / 8));
};

const makeExtremaRelation = (
    observations: readonly MeasurementObservation[],
    operation: Area.Addition | Area.Subtraction
): MeasurementExtremaRelation => {
    const lengths = observations.map(({value}) => value);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    const isAddition = operation === Area.Addition;
    const leftOperand = isAddition ? shortest : longest;
    const rightOperand = isAddition ? longest : shortest;
    return {
        operation: isAddition ? 'addition' : 'subtraction',
        shortest,
        longest,
        leftOperand,
        rightOperand,
        answer: isAddition ? leftOperand + rightOperand : leftOperand - rightOperand
    };
};

export class MeasurementDataGenerator implements ProblemGenerator<MeasurementDataProblem, MeasurementDataGeneratorConfig> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementDataGeneratorSchema;

    generate(config: MeasurementDataGeneratorConfig): ProblemStub<MeasurementDataProblem> {
        validateConfigFields('measurement-data', config, ['numberKind']);

        const usesSingleFrame = config.useSingleFrame === true;
        const usesFractionArithmetic = config.includeFractionArithmetic === true;
        const operation = config.operation === Area.Addition || config.operation === Area.Subtraction
            ? config.operation
            : undefined;

        if (usesSingleFrame && config.numberKind !== Scope.FractionNumbers) {
            throw new GeneratorValidationError('measurement-data', 'A single-frame fractional dataset requires fractional measurements.');
        }
        if (usesFractionArithmetic && !usesSingleFrame) {
            throw new GeneratorValidationError('measurement-data', 'Fraction arithmetic requires a single measurement frame.');
        }
        if (usesFractionArithmetic && operation === undefined) {
            throw new GeneratorValidationError('measurement-data', 'Fraction arithmetic requires addition or subtraction.');
        }
        if (!usesFractionArithmetic && operation !== undefined) {
            throw new GeneratorValidationError('measurement-data', 'An operation requires FractionArithmetic.');
        }

        if (usesSingleFrame) {
            const observations = makeEighthInchObservations();
            return {
                data: {
                    unit: 'in',
                    subdivisions: 8,
                    observations,
                    ...(operation === undefined ? {} : {extremaRelation: makeExtremaRelation(observations, operation)})
                }
            };
        }

        if (config.numberKind === Scope.FractionNumbers) {
            const quarterUnits = [
                (2 + Math.floor(random() * 6)) * 4 + 1,
                (2 + Math.floor(random() * 6)) * 4 + 2,
                ...Array.from({length: objects.length - 2}, () => 8 + Math.floor(random() * 25))
            ];
            return {
                data: {
                    unit: 'in',
                    subdivisions: 4,
                    observations: makeObservations(quarterUnits.map(value => value / 4))
                }
            };
        }

        return {
            data: {
                unit: 'cm',
                subdivisions: 1,
                observations: makeObservations(objects.map(() => 2 + Math.floor(random() * 9)))
            }
        };
    }
}
