import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DimensionedRational, DimensionUnitPowers, DimensionUnitSymbol, RatioRational, UnitDimensionRelationProblem} from '../../../types/problems.ts';
import {rational} from '../../ratio/helpers.ts';
import {random} from '../../../lib/random.ts';
import {dimensionRelationCaseCount, dimensionRelationFrameAt} from './numeric-domain.ts';
import {UnitDimensionRelationsGeneratorSchema, type UnitDimensionRelationsGeneratorConfig} from './spec.ts';

const symbols: readonly DimensionUnitSymbol[] = ['m', 's', 'kg'];
const quantity = (units: Readonly<DimensionUnitPowers>, value: RatioRational): DimensionedRational => ({
    value,
    units: {...units},
    dimensions: {length: units.m, time: units.s, mass: units.kg}
});

const expandUnits = (units: DimensionUnitPowers): UnitDimensionRelationProblem['unitFactors'] => ({
    numerator: symbols.flatMap(symbol => Array.from({length: Math.max(0, units[symbol])}, () => symbol)),
    denominator: symbols.flatMap(symbol => Array.from({length: Math.max(0, -units[symbol])}, () => symbol))
});

/** Pair equal symbols on opposite sides once each, retaining indices for visible cancellation. */
const cancelUnits = ({numerator, denominator}: UnitDimensionRelationProblem['unitFactors']): UnitDimensionRelationProblem['cancellations'] => {
    const usedDenominators = new Set<number>();
    return numerator.flatMap((symbol, numeratorIndex) => {
        const denominatorIndex = denominator.findIndex((candidate, index) => candidate === symbol && !usedDenominators.has(index));
        if (denominatorIndex < 0) return [];
        usedDenominators.add(denominatorIndex);
        return [{numeratorIndex, denominatorIndex}];
    });
};

export class UnitDimensionRelationsGenerator implements ProblemGenerator<UnitDimensionRelationProblem, UnitDimensionRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'measurement';
    schema = UnitDimensionRelationsGeneratorSchema;

    generate(config: UnitDimensionRelationsGeneratorConfig): ProblemStub<UnitDimensionRelationProblem> {
        validateConfigFields('unit-dimension-relations', config, ['operation']);
        const operation = config.operation;
        if (operation !== 'multiplication' && operation !== 'division') {
            throw new GeneratorValidationError('unit-dimension-relations', 'Operation must be multiplication or division.');
        }
        validateConfigFields('unit-dimension-relations', config, ['range']);
        const count = dimensionRelationCaseCount(operation, config.range!);
        if (count === 0) throw new GeneratorValidationError('unit-dimension-relations', 'Unsupported canonical range for this operation.');
        const frame = dimensionRelationFrameAt(operation, config.range!, Math.floor(random() * count));
        const left = quantity(frame.units[0], frame.leftValue);
        const right = quantity(frame.units[1], frame.rightValue);
        const sign = operation === 'multiplication' ? 1 : -1;
        const resultUnits: DimensionUnitPowers = {
            m: left.units.m + sign * right.units.m,
            s: left.units.s + sign * right.units.s,
            kg: left.units.kg + sign * right.units.kg
        };
        const leftFactors = expandUnits(left.units);
        const rightFactors = expandUnits(right.units);
        const unitFactors = {
            numerator: [...leftFactors.numerator, ...(operation === 'multiplication' ? rightFactors.numerator : rightFactors.denominator)],
            denominator: [...leftFactors.denominator, ...(operation === 'multiplication' ? rightFactors.denominator : rightFactors.numerator)]
        };
        const value = operation === 'multiplication'
            ? rational(left.value.numerator * right.value.numerator, left.value.denominator * right.value.denominator)
            : rational(left.value.numerator * right.value.denominator, left.value.denominator * right.value.numerator);
        return {data: {
            kind: 'unit-dimension-relation', operation, left, right,
            result: {value, units: resultUnits, dimensions: {length: resultUnits.m, time: resultUnits.s, mass: resultUnits.kg}},
            unitFactors, cancellations: cancelUnits(unitFactors)
        }};
    }
}
