import {describe, expect, it} from 'vitest';
import {
    AngleArithmeticGeometry,
    AngleArithmeticProblem
} from '../../../types/problems.ts';
import {
    buildAngleArithmeticPresentation,
    isValidAngleArithmeticProblem,
    resolveAngleArithmeticTask
} from './angle-arithmetic-helpers.ts';

const geometry = (left: number, right: number): AngleArithmeticGeometry => ({
    vertexLabel: 'O',
    startPointLabel: 'A',
    dividerPointLabel: 'B',
    endPointLabel: 'C',
    leftAngleName: 'AOB',
    rightAngleName: 'BOC',
    wholeAngleName: 'AOC',
    startDegrees: 0,
    dividerDegrees: left,
    endDegrees: left + right,
    leftSweepDegrees: left,
    rightSweepDegrees: right,
    wholeSweepDegrees: left + right,
    direction: 'counterclockwise'
});

const relation = (
    operation: AngleArithmeticProblem['operation'],
    left = 25,
    right = 35
): AngleArithmeticProblem => ({
    operation,
    geometry: geometry(left, right),
    leftMeasure: left,
    rightMeasure: right,
    wholeMeasure: left + right,
    relationStatement: 'm∠AOB + m∠BOC = m∠AOC'
});

describe('angle arithmetic view projection', () => {
    it('validates the complete neutral relation independently of task Ability', () => {
        expect(isValidAngleArithmeticProblem(relation('addition'))).toBe(true);
        expect(isValidAngleArithmeticProblem(relation('subtraction', 80, 75))).toBe(true);

        const incoherent = relation('addition', 45, 70);
        expect(isValidAngleArithmeticProblem({...incoherent, wholeMeasure: 120})).toBe(false);
        expect(isValidAngleArithmeticProblem({
            ...incoherent,
            geometry: {...incoherent.geometry, dividerDegrees: 70}
        })).toBe(false);
        expect(isValidAngleArithmeticProblem(relation('addition', 20, 40))).toBe(false);
    });

    it.each([
        ['addition', 'explain-angle-addition'],
        ['addition', 'solve-unknown-whole'],
        ['addition', 'solve-unknown-component'],
        ['subtraction', 'solve-unknown-component']
    ] as const)('accepts %s × %s', (operation, task) => {
        expect(resolveAngleArithmeticTask(relation(operation), task)).toBe(task);
    });

    it.each([
        ['subtraction', 'explain-angle-addition'],
        ['subtraction', 'solve-unknown-whole']
    ] as const)('rejects unsupported operation/task pairing %s × %s', (
        operation,
        task
    ) => {
        expect(resolveAngleArithmeticTask(relation(operation), task)).toBeNull();
    });

    it('builds the explanation presentation from neutral evidence', () => {
        const data = relation('addition', 45, 45);
        expect(buildAngleArithmeticPresentation(
            data,
            'explain-angle-addition',
            7
        )).toEqual({
            task: 'explain-angle-addition',
            unknownRole: 'none',
            prompt: 'Use the shown whole-part relationship as evidence. Explain how adjacent angles AOB and BOC combine to form angle AOC.',
            questionEquation: 'm∠AOB + m∠BOC = m∠AOC',
            solutionEquation: '45° + 45° = 90°',
            answer: '45° + 45° = 90°',
            answerStatement: 'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.',
            explanation: 'Angles AOB and BOC share ray OB and do not overlap. Their measures add: 45° + 45° = 90°.'
        });
        expect(data).not.toHaveProperty('prompt');
    });

    it('builds the unknown-whole presentation from ProcedureExecution', () => {
        const data = relation('addition', 45, 70);
        expect(buildAngleArithmeticPresentation(
            data,
            'solve-unknown-whole',
            9
        )).toEqual({
            task: 'solve-unknown-angle',
            unknownRole: 'whole',
            prompt: 'Find the measure of angle AOC.',
            wholePartEquation: '45° + 70° = ?°',
            questionEquation: '45° + 70° = ?°',
            solutionEquation: '45° + 70° = 115°',
            answer: '115°',
            answerStatement: 'Angle AOC measures 115°.',
            explanation: 'Angles AOB and BOC are adjacent and form angle AOC. Add 45° and 70° to get 115°.'
        });
    });

    it('uses the view seed to choose either hidden component for ProcedureInversion', () => {
        const data = relation('subtraction', 65, 85);
        const left = buildAngleArithmeticPresentation(
            data,
            'solve-unknown-component',
            2
        );
        const right = buildAngleArithmeticPresentation(
            data,
            'solve-unknown-component',
            3
        );

        expect(left).toMatchObject({
            task: 'solve-unknown-angle',
            unknownRole: 'left-component',
            prompt: 'Find the measure of angle AOB.',
            wholePartEquation: '?° + 85° = 150°',
            questionEquation: '150° − 85° = ?°',
            answer: '65°'
        });
        expect(right).toMatchObject({
            task: 'solve-unknown-angle',
            unknownRole: 'right-component',
            prompt: 'Find the measure of angle BOC.',
            wholePartEquation: '65° + ?° = 150°',
            questionEquation: '150° − 65° = ?°',
            answer: '85°'
        });
    });
});
