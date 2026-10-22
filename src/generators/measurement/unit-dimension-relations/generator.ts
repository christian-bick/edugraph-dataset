import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {DimensionedRational, DimensionUnitPowers, DimensionUnitSymbol, UnitDimensionRelationProblem} from '../../../types/problems.ts';
import {pick, randomInteger, rational} from '../../ratio/helpers.ts';
import {UnitDimensionRelationsGeneratorSchema, type UnitDimensionRelationsGeneratorConfig} from './spec.ts';

const symbols: readonly DimensionUnitSymbol[] = ['m', 's', 'kg'];
type UnitPair = readonly [DimensionUnitPowers, DimensionUnitPowers];
const length: DimensionUnitPowers = {m: 1, s: 0, kg: 0};
const area: DimensionUnitPowers = {m: 2, s: 0, kg: 0};
const time: DimensionUnitPowers = {m: 0, s: 1, kg: 0};
const speed: DimensionUnitPowers = {m: 1, s: -1, kg: 0};
const mass: DimensionUnitPowers = {m: 0, s: 0, kg: 1};
const massRate: DimensionUnitPowers = {m: 0, s: -1, kg: 1};
const density: DimensionUnitPowers = {m: -3, s: 0, kg: 1};
const volume: DimensionUnitPowers = {m: 3, s: 0, kg: 0};

const multiplicationPairs: readonly UnitPair[] = [
    [length, length], [speed, time], [massRate, time], [density, volume]
];
const divisionPairs: readonly UnitPair[] = [
    [length, time], [area, length], [length, length], [speed, speed], [mass, time], [mass, density]
];

const quantity = (units: DimensionUnitPowers): DimensionedRational => ({
    value: rational(randomInteger(1, 12), randomInteger(1, 4)),
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
        const [firstUnits, secondUnits] = pick(operation === 'multiplication' ? multiplicationPairs : divisionPairs);
        const left = quantity(firstUnits);
        const right = quantity(secondUnits);
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
