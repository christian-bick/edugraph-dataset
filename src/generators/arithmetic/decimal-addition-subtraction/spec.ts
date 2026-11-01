import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {decimalColumnRangeLabels, decimalColumnZeroLabels, resolveDecimalColumnRange, resolveDecimalColumnZero} from './range-profile.ts';

export const spec: GeneratorSpec = {
    generatorId: 'decimal-addition-subtraction',
    compatibility: [generatorLabelRule('decimal-column-unit-range', [...decimalColumnRangeLabels, ...decimalColumnZeroLabels], selected =>
        !selected(Scope.NumbersSmaller10) || !selected(Scope.NumbersWithoutZero))],
    generalLabels: [
        Area.PlaceValue,
        Scope.HundredthDecimals,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.TwoOperands
    ]
};

const resolveOperation = selectExactLabelMap([
    [Area.Addition, 'addition'],
    [Area.Subtraction, 'subtraction']
] as const);

export const DecimalAdditionSubtractionGeneratorSchema = {
    operation: [[Area.Addition, Area.Subtraction], resolveOperation],
    zeroPresence: [decimalColumnZeroLabels, resolveDecimalColumnZero, decimalColumnZeroLabels.map(label => [label])],
    range: [decimalColumnRangeLabels, resolveDecimalColumnRange, decimalColumnRangeLabels.map(label => [label])]
} as const;

export type DecimalAdditionSubtractionGeneratorConfig = ConfigFromSchema<
    typeof DecimalAdditionSubtractionGeneratorSchema
>;
