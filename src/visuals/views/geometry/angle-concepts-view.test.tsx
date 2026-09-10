import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {AngleArcFractionProblem, AngleUnitPartitionProblem, AngleUnitIterationProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';
import {AngleArcInterpretationView, AngleOneDegreeDerivationView, AngleDegreeIterationView} from './angle-concepts-view.tsx';

function render<T>(view: (props: {viewId: string; payload: RenderPayload<AbstractProblem<T>>}) => React.ReactNode,
    data: T, isSolutionView: boolean) {
    return renderToStaticMarkup(createElement(view, {viewId: 'angle-test',
        payload: {viewId: 'angle-test', problem: {type: 'shape', data, labels: []},
            targetLabels: [], seed: 17, isSolutionView}}));
}

describe('Angle projections', () => {
    it.each([2, 3, 4, 6] as const)('preserves the unit-arc fraction 1/%i and hides its degree answer', denominator => {
        const data: AngleArcFractionProblem = {kind: 'fractional-arc', fullTurnDegrees: 360,
            arcFraction: {numerator: 1, denominator}, angleDegrees: 360 / denominator};
        const question = render(AngleArcInterpretationView, data, false);
        expect(question).toContain(`1/${denominator} of a full turn = ?°`);
        expect(question).not.toContain(`= ${data.angleDegrees}°`);
        expect(question).toContain('Rays OA and OB share endpoint O.');
        const solution = render(AngleArcInterpretationView, data, true);
        expect(solution).toContain(`1/${denominator} of a full turn = ${data.angleDegrees}°`);
        expect(render(AngleArcInterpretationView, data, false)).toBe(question);
    });

    it('shows the full-turn partition and reveals the derived one-degree measure only in the solution', () => {
        const data: AngleUnitPartitionProblem = {
            kind: 'equal-angle-partition', fullTurnDegrees: 360, parts: 360, angleDegrees: 1
        };
        const question = render(AngleOneDegreeDerivationView, data, false);
        expect(question).toContain('1/360 of a full turn = ?');
        expect(question).toContain('1 of 360 equal turns');
        expect(question).not.toContain('1°');
        expect(render(AngleOneDegreeDerivationView, data, true)).toContain('1/360 of a full turn = 1°');
    });

    it.each([5, 8, 10, 12, 15])('shows every unit for a repeated angle of %i degrees', count => {
        const data: AngleUnitIterationProblem = {
            kind: 'angle-iteration', fullTurnDegrees: 360, unitDegrees: 1, count, angleDegrees: count
        };
        const question = render(AngleDegreeIterationView, data, false);
        expect(question).toContain(`${count} × 1° = ?`);
        expect(question.match(/>1°<\/div>/g)).toHaveLength(count);
        expect(question).not.toContain(`= ${count}°`);
        expect(render(AngleDegreeIterationView, data, true)).toContain(`${count} × 1° = ${count}°`);
    });

    it('rejects inconsistent or wrong-family evidence instead of rendering a different task', () => {
        const data: AngleArcFractionProblem = {kind: 'fractional-arc', fullTurnDegrees: 360,
            angleDegrees: 90, arcFraction: {numerator: 1, denominator: 4}};
        expect(() => render(AngleArcInterpretationView, {...data, angleDegrees: 60}, false)).toThrow(ViewValidationError);
        expect(() => render(AngleOneDegreeDerivationView, data as never, false)).toThrow(ViewValidationError);
        expect(() => render(AngleDegreeIterationView, data as never, false)).toThrow(ViewValidationError);
    });
});
