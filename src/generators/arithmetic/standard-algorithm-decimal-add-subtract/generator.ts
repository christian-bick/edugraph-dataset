import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DecimalStandardAddSubtractColumn, DecimalStandardAddSubtractProblem} from '../../../types/problems.ts';
import {alignedDecimalCoefficient, exactDecimal, parseExactDecimal} from '../standard-decimal-helpers.ts';
import {sampleDecimalColumnPair, standardDecimalColumnCases} from './domain.ts';
import {StandardAlgorithmDecimalAddSubtractGeneratorSchema, type StandardAlgorithmDecimalAddSubtractGeneratorConfig} from './spec.ts';

const generatorId = 'standard-algorithm-decimal-add-subtract';
type Operation = DecimalStandardAddSubtractProblem['operation'];

/** Exact original numeral forms and every aligned carry/borrow column. */
export function buildDecimalStandardAddSubtractProblem(operation: Operation, topNumeral: string, bottomNumeral: string): DecimalStandardAddSubtractProblem {
    if (operation !== 'addition' && operation !== 'subtraction') {
        throw new GeneratorValidationError(generatorId, 'Operation must be addition or subtraction.');
    }
    const top = parseExactDecimal(topNumeral, generatorId);
    const bottom = parseExactDecimal(bottomNumeral, generatorId);
    const scale = Math.max(top.scale, bottom.scale);
    const topCoefficient = alignedDecimalCoefficient(top, scale, generatorId);
    const bottomCoefficient = alignedDecimalCoefficient(bottom, scale, generatorId);
    const resultCoefficient = Number(operation === 'addition'
        ? BigInt(topCoefficient) + BigInt(bottomCoefficient)
        : BigInt(topCoefficient) - BigInt(bottomCoefficient));
    const result = exactDecimal(resultCoefficient, scale, generatorId);
    const width = Math.max(scale + 1, String(topCoefficient).length, String(bottomCoefficient).length, String(resultCoefficient).length);
    const topDigits = [...String(topCoefficient).padStart(width, '0')].reverse().map(Number);
    const bottomDigits = [...String(bottomCoefficient).padStart(width, '0')].reverse().map(Number);
    let regroupIn: 0 | 1 = 0;
    const columns: DecimalStandardAddSubtractColumn[] = topDigits.map((topDigit, index) => {
        const bottomDigit = bottomDigits[index]!;
        const regroupOut = (operation === 'addition'
            ? topDigit + bottomDigit + regroupIn >= 10
            : topDigit - regroupIn < bottomDigit) ? 1 : 0;
        const workingValue = operation === 'addition'
            ? topDigit + bottomDigit + regroupIn
            : topDigit - regroupIn + 10 * regroupOut;
        const resultDigit = operation === 'addition' ? workingValue % 10 : workingValue - bottomDigit;
        const column: DecimalStandardAddSubtractColumn = {
            placeExponent: index - scale, topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit
        };
        regroupIn = regroupOut;
        return column;
    });
    return {
        kind: 'decimal-standard-add-subtract', base: 10, operation, top, bottom, result,
        alignment: {scale, topCoefficient, bottomCoefficient,
            topNumeral: exactDecimal(topCoefficient, scale, generatorId).numeral,
            bottomNumeral: exactDecimal(bottomCoefficient, scale, generatorId).numeral},
        columns
    };
}

export class StandardAlgorithmDecimalAddSubtractGenerator implements ProblemGenerator<
    DecimalStandardAddSubtractProblem, StandardAlgorithmDecimalAddSubtractGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = StandardAlgorithmDecimalAddSubtractGeneratorSchema;

    generate(config: StandardAlgorithmDecimalAddSubtractGeneratorConfig): ProblemStub<DecimalStandardAddSubtractProblem> {
        validateConfigFields(generatorId, config, ['operation', 'range', 'zeroPresence']);
        if (config.operation !== 'addition' && config.operation !== 'subtraction') {
            throw new GeneratorValidationError(generatorId, 'Operation must be addition or subtraction.');
        }
        if (typeof config.zeroPresence !== 'boolean') {
            throw new GeneratorValidationError(generatorId, 'Zero presence must be a boolean.');
        }
        const cases = standardDecimalColumnCases(config.operation, config.range!, config.zeroPresence);
        let remaining = random() * cases.reduce((sum, entry) => sum + entry.weight, 0);
        let selected = cases[cases.length - 1]!;
        for (const entry of cases) {
            remaining -= entry.weight;
            if (remaining < 0) {selected = entry; break;}
        }
        const pair = sampleDecimalColumnPair(selected, config.range!, config.zeroPresence, random);
        return {data: buildDecimalStandardAddSubtractProblem(config.operation,
            exactDecimal(pair.top, pair.topScale, generatorId).numeral,
            exactDecimal(pair.bottom, pair.bottomScale, generatorId).numeral)};
    }
}
