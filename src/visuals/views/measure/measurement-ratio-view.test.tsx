import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {MeasurementRatioRelationProblem, UnitDimensionRelationProblem} from '../../../types/problems.ts';
import {MeasurementRatioConversionBody, UnitCompositionBody} from './measurement-ratio-view.tsx';

const conversion: MeasurementRatioRelationProblem = {
    kind: 'measurement-ratio-relation',
    units: {
        first: {id: 'inch', name: 'inch', symbol: 'in', system: 'customary', dimension: 'length'},
        second: {id: 'centimeter', name: 'centimeter', symbol: 'cm', system: 'metric', dimension: 'length'}
    },
    unitEquality: {first: {numerator: 50, denominator: 1}, second: {numerator: 127, denominator: 1}},
    quantityEquality: {first: {numerator: 75, denominator: 1}, second: {numerator: 381, denominator: 2}},
    scaleFactor: {numerator: 3, denominator: 2},
    forwardFactor: {numerator: 127, denominator: 50}, reverseFactor: {numerator: 50, denominator: 127}
};
const composition: UnitDimensionRelationProblem = {
    kind: 'unit-dimension-relation', operation: 'multiplication',
    left: {value: {numerator: 3, denominator: 2}, units: {m: 1, s: -1, kg: 0}, dimensions: {length: 1, time: -1, mass: 0}},
    right: {value: {numerator: 4, denominator: 1}, units: {m: 0, s: 1, kg: 0}, dimensions: {length: 0, time: 1, mass: 0}},
    result: {value: {numerator: 6, denominator: 1}, units: {m: 1, s: 0, kg: 0}, dimensions: {length: 1, time: 0, mass: 0}},
    unitFactors: {numerator: ['m', 's'], denominator: ['s']}, cancellations: [{numeratorIndex: 1, denominatorIndex: 0}]
};
const text = (markup: string): string => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('conversion by a dimensioned ratio', () => {
    it('preserves the unit equality and oriented dimensioned factor while withholding the converted measure and explanation', () => {
        const question = renderToStaticMarkup(<MeasurementRatioConversionBody data={conversion} direction="first-to-second" isSolutionView={false} />);
        const solution = renderToStaticMarkup(<MeasurementRatioConversionBody data={conversion} direction="first-to-second" isSolutionView={true} />);
        expect(text(question)).toContain('Convert 75 in to cm');
        expect(text(question)).toContain('50 in = 127 cm');
        expect(text(question)).toContain('75 in × 127 cm 50 in = □ cm');
        expect(question).not.toContain('381/2');
        expect(question).not.toContain('equals 1');
        expect(question).not.toContain('emerald');
        expect(question).not.toContain('line-through');
        expect(solution).toMatch(/text-emerald-800[^>]*data-result="converted-quantity">\(381\/2\) cm<\/span>/);
        expect(solution.match(/line-through/g)).toHaveLength(2);
        expect(text(solution)).toContain('dimensioned ratio equals 1');
        expect(text(solution)).toContain('in units cancel, leaving cm');
        expect(text(solution)).toContain('preserves the physical length');
    });

    it('reverses the full unit ratio and cancellation for the opposite conversion direction', () => {
        const question = renderToStaticMarkup(<MeasurementRatioConversionBody data={conversion} direction="second-to-first" isSolutionView={false} />);
        const solution = renderToStaticMarkup(<MeasurementRatioConversionBody data={conversion} direction="second-to-first" isSolutionView={true} />);
        expect(text(question)).toContain('Convert (381/2) cm to in');
        expect(text(question)).toContain('(381/2) cm × 50 in 127 cm = □ in');
        expect(text(question)).not.toMatch(/\b75\b/);
        expect(solution).toMatch(/data-result="converted-quantity">75 in<\/span>/);
        expect(text(solution)).toContain('cm units cancel, leaving in');
    });
});

describe('unit composition projections', () => {
    it('retains the unsimplified unit factors and withholds the product and explanation until solution mode', () => {
        const question = renderToStaticMarkup(<UnitCompositionBody data={composition} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<UnitCompositionBody data={composition} isSolutionView={true} />);
        expect(text(question)).toContain('((3/2) m / (s)) × (4 s) = □');
        expect(text(question)).toContain('m · s s');
        expect(text(question)).not.toMatch(/\b6\b/);
        expect(question).not.toContain('line-through');
        expect(question).not.toContain('emerald');
        expect(solution).toMatch(/text-emerald-800[^>]*data-result="dimensioned-quantity">6 m<\/span>/);
        expect(solution.match(/line-through/g)).toHaveLength(2);
        expect(text(solution)).toContain('unit factor in the numerator and denominator has quotient 1');
        expect(text(solution)).toContain('physical dimension is length');
    });

    it('keeps a cubic length divisor in the resulting density dimension when nothing cancels', () => {
        const density: UnitDimensionRelationProblem = {
            kind: 'unit-dimension-relation', operation: 'division',
            left: {value: {numerator: 6, denominator: 1}, units: {m: 0, s: 0, kg: 1}, dimensions: {length: 0, time: 0, mass: 1}},
            right: {value: {numerator: 3, denominator: 2}, units: {m: 3, s: 0, kg: 0}, dimensions: {length: 3, time: 0, mass: 0}},
            result: {value: {numerator: 4, denominator: 1}, units: {m: -3, s: 0, kg: 1}, dimensions: {length: -3, time: 0, mass: 1}},
            unitFactors: {numerator: ['kg'], denominator: ['m', 'm', 'm']}, cancellations: []
        };
        const question = renderToStaticMarkup(<UnitCompositionBody data={density} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<UnitCompositionBody data={density} isSolutionView={true} />);
        expect(text(question)).toContain('(6 kg) ÷ ((3/2) m^3) = □');
        expect(text(question)).not.toContain('mass / (length^3)');
        expect(text(solution)).toContain('4 kg / (m^3)');
        expect(text(solution)).toContain('physical dimension is mass / (length^3)');
        expect(text(solution)).toContain('unit expression multiplies by its reciprocal');
        expect(solution).not.toContain('line-through');
    });

    it('shows cancellation of every unit factor and an explicitly dimensionless result', () => {
        const dimensionless: UnitDimensionRelationProblem = {
            kind: 'unit-dimension-relation', operation: 'division',
            left: {value: {numerator: 6, denominator: 1}, units: {m: 1, s: 0, kg: 0}, dimensions: {length: 1, time: 0, mass: 0}},
            right: {value: {numerator: 3, denominator: 1}, units: {m: 1, s: 0, kg: 0}, dimensions: {length: 1, time: 0, mass: 0}},
            result: {value: {numerator: 2, denominator: 1}, units: {m: 0, s: 0, kg: 0}, dimensions: {length: 0, time: 0, mass: 0}},
            unitFactors: {numerator: ['m'], denominator: ['m']}, cancellations: [{numeratorIndex: 0, denominatorIndex: 0}]
        };
        const question = renderToStaticMarkup(<UnitCompositionBody data={dimensionless} isSolutionView={false} />);
        const solution = renderToStaticMarkup(<UnitCompositionBody data={dimensionless} isSolutionView={true} />);
        expect(question).not.toContain('(dimensionless)');
        expect(text(solution)).toContain('2 (dimensionless)');
        expect(text(solution)).toContain('physical dimension is dimensionless');
        expect(solution.match(/line-through/g)).toHaveLength(2);
    });
});
