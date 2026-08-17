import {describe, expect, it} from 'vitest';
import {
    AngleArithmeticGeometry,
    ExplainAngleAdditionProblem,
    SolveUnknownComponentAngleProblem,
    SolveUnknownWholeAngleProblem
} from '../../../../types/problems.ts';
import {isValidAngleArithmeticProblem} from './helpers.ts';

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

const common = (left: number, right: number) => ({
    geometry: geometry(left, right),
    leftMeasure: left,
    rightMeasure: right,
    wholeMeasure: left + right,
    relationStatement: 'm∠AOB + m∠BOC = m∠AOC' as const
});

const explanation = (left: number, right: number): ExplainAngleAdditionProblem => ({
    ...common(left, right),
    task: 'explain-angle-addition',
    operation: 'addition',
    unknownRole: 'none',
    prompt: 'Explain how adjacent angles AOB and BOC combine to form angle AOC.',
    questionEquation: 'm∠AOB + m∠BOC = m∠AOC',
    solutionEquation: `${left}° + ${right}° = ${left + right}°`,
    answer: `${left}° + ${right}° = ${left + right}°`,
    answerStatement: 'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.',
    explanation: `Angles AOB and BOC share ray OB and do not overlap. Their measures add: ${left}° + ${right}° = ${left + right}°.`
});

const unknownWhole = (left: number, right: number): SolveUnknownWholeAngleProblem => ({
    ...common(left, right),
    task: 'solve-unknown-angle',
    operation: 'addition',
    unknownRole: 'whole',
    prompt: 'Find the measure of angle AOC.',
    wholePartEquation: `${left}° + ${right}° = ?°`,
    questionEquation: `${left}° + ${right}° = ?°`,
    solutionEquation: `${left}° + ${right}° = ${left + right}°`,
    answer: `${left + right}°`,
    answerStatement: `Angle AOC measures ${left + right}°.`,
    explanation: `Angles AOB and BOC are adjacent and form angle AOC. Add ${left}° and ${right}° to get ${left + right}°.`
});

const unknownComponent = (
    role: 'left-component' | 'right-component',
    left: number,
    right: number
): SolveUnknownComponentAngleProblem => {
    const whole = left + right;
    const unknownLeft = role === 'left-component';
    const known = unknownLeft ? right : left;
    const unknown = unknownLeft ? left : right;
    const unknownAngle = unknownLeft ? 'AOB' : 'BOC';
    const knownAngle = unknownLeft ? 'BOC' : 'AOB';
    return {
        ...common(left, right),
        task: 'solve-unknown-angle',
        operation: 'subtraction',
        unknownRole: role,
        prompt: `Find the measure of angle ${unknownAngle}.`,
        wholePartEquation: unknownLeft ? `?° + ${right}° = ${whole}°` : `${left}° + ?° = ${whole}°`,
        questionEquation: `${whole}° − ${known}° = ?°`,
        solutionEquation: `${whole}° − ${known}° = ${unknown}°`,
        answer: `${unknown}°`,
        answerStatement: `Angle ${unknownAngle} measures ${unknown}°.`,
        explanation: `Angle AOC is ${whole}°. Subtract angle ${knownAngle}, ${known}°, to find angle ${unknownAngle}: ${unknown}°.`
    };
};

describe('angle arithmetic validation', () => {
    it('accepts understanding, unknown whole, and both unknown component roles', () => {
        expect(isValidAngleArithmeticProblem(explanation(25, 35))).toBe(true);
        expect(isValidAngleArithmeticProblem(explanation(45, 45))).toBe(true);
        expect(isValidAngleArithmeticProblem(unknownWhole(80, 75))).toBe(true);
        expect(isValidAngleArithmeticProblem(unknownComponent('left-component', 30, 60))).toBe(true);
        expect(isValidAngleArithmeticProblem(unknownComponent('right-component', 55, 75))).toBe(true);
    });

    it('rejects overlapping/incoherent geometry and unsupported stress pairs', () => {
        const whole = unknownWhole(45, 70);
        expect(isValidAngleArithmeticProblem({...whole, wholeMeasure: 120})).toBe(false);
        expect(isValidAngleArithmeticProblem({...whole, geometry: {...whole.geometry, dividerDegrees: 70}})).toBe(false);
        expect(isValidAngleArithmeticProblem(unknownWhole(20, 40))).toBe(false);
    });

    it('rejects answer leakage or contradictions in either component role', () => {
        const left = unknownComponent('left-component', 65, 85);
        const right = unknownComponent('right-component', 65, 85);
        expect(isValidAngleArithmeticProblem({...left, questionEquation: '150° − 85° = 65°'})).toBe(false);
        expect(isValidAngleArithmeticProblem({...right, wholePartEquation: '?° + 85° = 150°'})).toBe(false);
        expect(isValidAngleArithmeticProblem({...right, explanation: 'Angle BOC measures 80°.'})).toBe(false);
    });
});
