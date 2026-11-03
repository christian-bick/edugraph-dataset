import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import type {ProperFractionUnitScalingProblem, TenthsToHundredthsProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {FractionEquivalenceView, type FractionEquivalenceMode} from './fraction-equivalence-view.tsx';

const proper: ProperFractionUnitScalingProblem = {
    task: 'relate-equivalent-fractions', first: {numerator: 1, denominator: 2},
    second: {numerator: 4, denominator: 8}, scaleFactor: 4,
    unitMultiplier: {numerator: 4, denominator: 4, value: 1}, relation: 'equal'
};
const tenths: TenthsToHundredthsProblem = {
    task: 'tenths-to-hundredths', tenths: {numerator: 4, denominator: 10},
    hundredths: {numerator: 40, denominator: 100}, scaleFactor: 10, sharedWhole: 1, relation: 'equal'
};

// Deliberately malformed fixtures cross the public renderer boundary only here.
const render = (data: unknown, solution: boolean, mode: unknown = 'formalization'): string =>
    renderToStaticMarkup(<FractionEquivalenceView viewId="equivalence-validation" mode={mode as never} payload={{
        viewId: 'equivalence-validation', problem: {type: 'fraction', data: data as never, labels: []},
        targetLabels: [], isSolutionView: solution, seed: 42
    }} />);

describe('fraction equivalence model validation contract', () => {
    it('admits coherent proper-fraction and tenths relations in their supported modes', () => {
        for (const solution of [false, true]) {
            for (const mode of ['classification', 'formalization', 'explanation'] as const) {
                expect(render(proper, solution, mode)).toContain('4 of 8 equal parts shaded');
            }
            for (const mode of ['formalization', 'explanation'] as const) {
                expect(render(tenths, solution, mode)).toContain('100 equal parts');
            }
        }
    });

    it.each([
        {name: 'missing first fraction', data: {...proper, first: undefined}, message: /Required field "first" is missing/},
        {name: 'non-object first fraction', data: {...proper, first: '1/2'}, message: /First fraction is missing/},
        {name: 'non-object second fraction', data: {...proper, second: '4/8'}, message: /Second fraction is missing/},
        {name: 'zero shaded-part count', data: {...proper, first: {numerator: 0, denominator: 2}}, message: /First fraction cannot be rendered/},
        {name: 'fractional shaded-part count', data: {...proper, first: {numerator: 1.5, denominator: 2}}, message: /First fraction cannot be rendered/},
        {name: 'unsupported total-part count', data: {...proper, first: {numerator: 1, denominator: 5}}, message: /First fraction cannot be rendered/},
        {name: 'fractional total-part count', data: {...proper, first: {numerator: 1, denominator: 2.5}}, message: /First fraction cannot be rendered/},
        {name: 'more shaded parts than a whole', data: {...proper, first: {numerator: 3, denominator: 2}}, message: /First fraction cannot be rendered/},
        {name: 'invalid second shaded-part count', data: {...proper, second: {numerator: -1, denominator: 8}}, message: /Second fraction cannot be rendered/},
        {name: 'unsupported scaling factor', data: {...proper, scaleFactor: 5}, message: /must scale both terms/},
        {name: 'incoherent scaled numerator', data: {...proper, second: {numerator: 3, denominator: 8}}, message: /must scale both terms/},
        {name: 'incoherent scaled denominator', data: {...proper, second: {numerator: 4, denominator: 6}}, message: /must scale both terms/},
        {name: 'non-equal relation', data: {...proper, relation: 'different'}, message: /equivalence relation is inconsistent/},
        {name: 'another task with fraction-shaped fields', data: {...proper, task: 'locate-fraction'}, message: /Expected a proper-fraction equivalence relation/}
    ])('throws a typed validation error for $name in both modes', ({data, message}) => {
        for (const solution of [false, true]) {
            expect(() => render(data, solution)).toThrow(ViewValidationError);
            expect(() => render(data, solution)).toThrow(message);
        }
    });

    it.each([
        {name: 'missing hundredths', data: {...tenths, hundredths: undefined}, message: /Required field "hundredths" is missing/},
        {name: 'incoherent hundredths count', data: {...tenths, hundredths: {numerator: 41, denominator: 100}}, message: /one coherent shared whole/},
        {name: 'wrong scaling factor', data: {...tenths, scaleFactor: 2}, message: /one coherent shared whole/},
        {name: 'different reference whole', data: {...tenths, sharedWhole: 2}, message: /one coherent shared whole/},
        {name: 'non-equal tenths relation', data: {...tenths, relation: 'different'}, message: /one coherent shared whole/}
    ])('throws a typed validation error for $name in both modes', ({data, message}) => {
        for (const solution of [false, true]) {
            expect(() => render(data, solution)).toThrow(ViewValidationError);
            expect(() => render(data, solution)).toThrow(message);
        }
    });

    it.each([
        {name: 'proper-fraction articulation', data: proper, mode: 'articulation', message: /requires ConceptClassification or Formalization/},
        {name: 'tenths classification', data: tenths, mode: 'classification', message: /Base-ten equivalence requires Formalization/}
    ])('rejects unsupported $name with a typed error in both modes', ({data, mode, message}) => {
        for (const solution of [false, true]) {
            expect(() => render(data, solution, mode as FractionEquivalenceMode)).toThrow(ViewValidationError);
            expect(() => render(data, solution, mode as FractionEquivalenceMode)).toThrow(message);
        }
    });
});
