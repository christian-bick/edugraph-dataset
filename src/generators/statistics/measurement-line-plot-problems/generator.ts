import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MeasurementLinePlotFractionProblem, MeasurementLinePlotFractionRelation
} from '../../../types/problems.ts';
import {
    MeasurementLinePlotProblemsGeneratorConfig, MeasurementLinePlotProblemsGeneratorSchema
} from './spec.ts';

type Denominator = MeasurementLinePlotFractionProblem['denominator'];
type FiveNumerators = [number, number, number, number, number];

const randomInt = (minimum: number, maximum: number): number =>
    minimum + Math.floor(random() * (maximum - minimum + 1));

const shuffle = (values: FiveNumerators): FiveNumerators => {
    for (let index = values.length - 1; index > 0; index--) {
        const swapIndex = randomInt(0, index);
        [values[index], values[swapIndex]] = [values[swapIndex]!, values[index]!];
    }
    return values;
};

/** Both least-filled beakers have distinct levels below the remaining three. */
const additionObservations = (denominator: Denominator): FiveNumerators => {
    const least = randomInt(denominator, 3 * denominator - 2);
    const secondLeast = least + 1;
    const repeated = randomInt(secondLeast + 1, 3 * denominator);
    const last = randomInt(secondLeast + 1, 3 * denominator);
    return [least, secondLeast, repeated, repeated, last];
};

/** The fullest and second-least levels are unique and have opposite parity. */
const subtractionObservations = (denominator: Denominator): FiveNumerators => {
    const least = denominator;
    const secondLeast = least + 1;
    const fullest = denominator + 4 + 2 * randomInt(0, denominator - 2);
    const repeated = randomInt(secondLeast + 1, fullest - 1);
    return [least, secondLeast, repeated, repeated, fullest];
};

const modalObservations = (denominator: Denominator): {values: FiveNumerators; mode: number} => {
    const mode = denominator + 1 + 2 * randomInt(0, denominator - 1);
    const otherLevels = Array.from({length: 2 * denominator + 1}, (_, index) => denominator + index)
        .filter(value => value !== mode);
    const first = otherLevels.splice(randomInt(0, otherLevels.length - 1), 1)[0]!;
    const second = otherLevels[randomInt(0, otherLevels.length - 1)]!;
    return {values: [mode, mode, mode, first, second], mode};
};

/** Enumerating the small bounded lattice avoids division retries at denominator 2. */
const divisionOptions = (denominator: Denominator): FiveNumerators[] => {
    const options: FiveNumerators[] = [];
    const visit = (values: number[], minimum: number): void => {
        if (values.length === 5) {
            const total = values.reduce((sum, value) => sum + value, 0);
            if (total % 5 !== 0 || (total / 5) % 2 !== 1) return;
            const counts = new Map<number, number>();
            for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
            const frequencies = [...counts.values()].sort((a, b) => b - a);
            if (counts.size >= 3 && frequencies[0]! >= 2 && frequencies[0]! <= 3
                && frequencies[0]! > (frequencies[1] ?? 0)) {
                options.push([...values] as FiveNumerators);
            }
            return;
        }
        for (let value = minimum; value <= 3 * denominator; value++) {
            values.push(value);
            visit(values, value);
            values.pop();
        }
    };
    visit([], denominator);
    return options;
};

const divisionPools: Record<Denominator, FiveNumerators[]> = {
    2: divisionOptions(2),
    4: divisionOptions(4),
    8: divisionOptions(8)
};

export class MeasurementLinePlotProblemsGenerator implements ProblemGenerator<
    MeasurementLinePlotFractionProblem, MeasurementLinePlotProblemsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'statistics';
    schema = MeasurementLinePlotProblemsGeneratorSchema;

    generate(config: MeasurementLinePlotProblemsGeneratorConfig): ProblemStub<MeasurementLinePlotFractionProblem> {
        validateConfigFields('measurement-line-plot-problems', config, ['denominator', 'operation']);
        if (config.denominator !== 2 && config.denominator !== 4 && config.denominator !== 8) {
            throw new GeneratorValidationError('measurement-line-plot-problems', 'Expected denominator 2, 4, or 8.');
        }
        if (config.operation !== 'addition' && config.operation !== 'subtraction'
            && config.operation !== 'multiplication' && config.operation !== 'division') {
            throw new GeneratorValidationError('measurement-line-plot-problems', 'Expected a supported fraction operation.');
        }

        const denominator = config.denominator;
        let values: FiveNumerators;
        let relation: MeasurementLinePlotFractionRelation;
        switch (config.operation) {
            case 'addition': {
                values = additionObservations(denominator);
                relation = {
                    operation: 'addition',
                    operandNumerators: [values[0], values[1]],
                    resultNumerator: values[0] + values[1]
                };
                break;
            }
            case 'subtraction': {
                values = subtractionObservations(denominator);
                relation = {
                    operation: 'subtraction',
                    minuendNumerator: values[4],
                    subtrahendNumerator: values[1],
                    resultNumerator: values[4] - values[1]
                };
                break;
            }
            case 'multiplication': {
                const sample = modalObservations(denominator);
                values = sample.values;
                relation = {
                    operation: 'multiplication',
                    operandNumerator: sample.mode,
                    frequency: 3,
                    resultNumerator: 3 * sample.mode
                };
                break;
            }
            case 'division': {
                const options = divisionPools[denominator];
                values = [...options[randomInt(0, options.length - 1)]!] as FiveNumerators;
                const totalNumerator = values.reduce((sum, value) => sum + value, 0);
                relation = {
                    operation: 'division',
                    totalNumerator,
                    recipientCount: 5,
                    shareNumerator: totalNumerator / 5
                };
                break;
            }
        }

        return {data: {
            kind: 'beaker-liquid-line-plot',
            unit: 'cup',
            denominator,
            observationNumerators: shuffle(values),
            relation
        }};
    }
}
