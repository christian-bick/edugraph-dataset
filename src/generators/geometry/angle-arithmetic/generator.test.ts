import {Ability, Area} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import {AngleArithmeticProblem} from '../../../types/problems.ts';
import {AngleArithmeticGenerator} from './generator.ts';
import {AngleArithmeticGeneratorConfig} from './spec.ts';

const generator = new AngleArithmeticGenerator();

function expectGeometry(data: AngleArithmeticProblem): void {
    expect(Number.isInteger(data.leftMeasure)).toBe(true);
    expect(Number.isInteger(data.rightMeasure)).toBe(true);
    expect(data.leftMeasure).toBeGreaterThan(0);
    expect(data.rightMeasure).toBeGreaterThan(0);
    expect(data.wholeMeasure).toBe(data.leftMeasure + data.rightMeasure);
    expect(data.wholeMeasure).toBeLessThan(180);
    expect(data.geometry).toEqual({
        vertexLabel: 'O',
        startPointLabel: 'A',
        dividerPointLabel: 'B',
        endPointLabel: 'C',
        leftAngleName: 'AOB',
        rightAngleName: 'BOC',
        wholeAngleName: 'AOC',
        startDegrees: 0,
        dividerDegrees: data.leftMeasure,
        endDegrees: data.wholeMeasure,
        leftSweepDegrees: data.leftMeasure,
        rightSweepDegrees: data.rightMeasure,
        wholeSweepDegrees: data.wholeMeasure,
        direction: 'counterclockwise'
    });
    expect(data.geometry.rightSweepDegrees).toBe(
        data.geometry.endDegrees - data.geometry.dividerDegrees
    );
    expect(data.relationStatement).toBe('m∠AOB + m∠BOC = m∠AOC');
}

describe('AngleArithmeticGenerator', () => {
    it('strictly requires an operation and task ability', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        expect(() => generator.generate({operation: Area.Addition})).toThrow(GeneratorValidationError);
    });

    it('explains additive angle measure across acute, right, and obtuse wholes', () => {
        const totals = new Set<number>();
        const equalityCases = new Set<boolean>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(`angle-addition-understanding-${seed}`);
            const data = generator.generate({
                operation: Area.Addition,
                taskAbility: Ability.ProcedureUnderstanding
            })!.data;
            expect(data.task).toBe('explain-angle-addition');
            if (data.task !== 'explain-angle-addition') throw new Error('Expected additive explanation.');
            expectGeometry(data);
            const numericEquation = `${data.leftMeasure}° + ${data.rightMeasure}° = ${data.wholeMeasure}°`;
            expect(data.operation).toBe('addition');
            expect(data.unknownRole).toBe('none');
            expect(data.prompt).toBe(
                'Explain how adjacent angles AOB and BOC combine to form angle AOC.'
            );
            expect(data.questionEquation).toBe('m∠AOB + m∠BOC = m∠AOC');
            expect(data.solutionEquation).toBe(numericEquation);
            expect(data.answer).toBe(numericEquation);
            expect(data.answerStatement).toBe(
                'The measure of angle AOC is the sum of the measures of adjacent angles AOB and BOC.'
            );
            expect(data.explanation).toBe(
                `Angles AOB and BOC share ray OB and do not overlap. Their measures add: ${numericEquation}.`
            );
            totals.add(data.wholeMeasure);
            equalityCases.add(data.leftMeasure === data.rightMeasure);
        }
        expect(totals).toEqual(new Set([60, 90, 115, 130, 150, 155]));
        expect(equalityCases).toEqual(new Set([false, true]));
    });

    it('executes addition when the whole angle is unknown', () => {
        for (let seed = 0; seed < 40; seed++) {
            setSeed(`unknown-whole-angle-${seed}`);
            const data = generator.generate({
                operation: Area.Addition,
                taskAbility: Ability.ProcedureExecution
            })!.data;
            expect(data.task).toBe('solve-unknown-angle');
            if (data.task !== 'solve-unknown-angle' || data.unknownRole !== 'whole') {
                throw new Error('Expected unknown whole.');
            }
            expectGeometry(data);
            expect(data.operation).toBe('addition');
            expect(data.prompt).toBe('Find the measure of angle AOC.');
            expect(data.wholePartEquation).toBe(
                `${data.leftMeasure}° + ${data.rightMeasure}° = ?°`
            );
            expect(data.questionEquation).toBe(data.wholePartEquation);
            expect(data.solutionEquation).toBe(
                `${data.leftMeasure}° + ${data.rightMeasure}° = ${data.wholeMeasure}°`
            );
            expect(data.answer).toBe(`${data.wholeMeasure}°`);
            expect(data.answerStatement).toBe(`Angle AOC measures ${data.wholeMeasure}°.`);
            expect(data.explanation).toBe(
                `Angles AOB and BOC are adjacent and form angle AOC. Add ${data.leftMeasure}° and ${data.rightMeasure}° to get ${data.wholeMeasure}°.`
            );
        }
    });

    it('inverts addition to solve either component with subtraction', () => {
        const roles = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            setSeed(`unknown-component-angle-${seed}`);
            const data = generator.generate({
                operation: Area.Subtraction,
                taskAbility: Ability.ProcedureInversion
            })!.data;
            expect(data.task).toBe('solve-unknown-angle');
            if (data.task !== 'solve-unknown-angle' || data.unknownRole === 'whole') {
                throw new Error('Expected unknown component.');
            }
            expectGeometry(data);
            const solvesLeft = data.unknownRole === 'left-component';
            const unknownMeasure = solvesLeft ? data.leftMeasure : data.rightMeasure;
            const knownMeasure = solvesLeft ? data.rightMeasure : data.leftMeasure;
            const unknownName = solvesLeft ? 'AOB' : 'BOC';
            const knownName = solvesLeft ? 'BOC' : 'AOB';
            expect(data.operation).toBe('subtraction');
            expect(data.prompt).toBe(`Find the measure of angle ${unknownName}.`);
            expect(data.wholePartEquation).toBe(solvesLeft
                ? `?° + ${data.rightMeasure}° = ${data.wholeMeasure}°`
                : `${data.leftMeasure}° + ?° = ${data.wholeMeasure}°`
            );
            expect(data.questionEquation).toBe(
                `${data.wholeMeasure}° − ${knownMeasure}° = ?°`
            );
            expect(data.solutionEquation).toBe(
                `${data.wholeMeasure}° − ${knownMeasure}° = ${unknownMeasure}°`
            );
            expect(data.answer).toBe(`${unknownMeasure}°`);
            expect(data.answerStatement).toBe(`Angle ${unknownName} measures ${unknownMeasure}°.`);
            expect(data.explanation).toBe(
                `Angle AOC is ${data.wholeMeasure}°. Subtract angle ${knownName}, ${knownMeasure}°, to find angle ${unknownName}: ${unknownMeasure}°.`
            );
            roles.add(data.unknownRole);
        }
        expect(roles).toEqual(new Set(['left-component', 'right-component']));
    });

    it.each([
        [Area.Subtraction, Ability.ProcedureUnderstanding],
        [Area.Subtraction, Ability.ProcedureExecution],
        [Area.Addition, Ability.ProcedureInversion],
        ['unsupported', Ability.ProcedureUnderstanding]
    ] as const)('rejects unsupported operation/ability pairing %s × %s', (operation, taskAbility) => {
        expect(generator.generate({
            operation,
            taskAbility
        } as unknown as AngleArithmeticGeneratorConfig)).toBeNull();
    });

    it.each([
        [Area.Addition, Ability.ProcedureUnderstanding],
        [Area.Addition, Ability.ProcedureExecution],
        [Area.Subtraction, Ability.ProcedureInversion]
    ] as const)('is deterministic for %s × %s', (operation, taskAbility) => {
        setSeed(`angle-arithmetic-determinism-${operation}-${taskAbility}`);
        const first = generator.generate({operation, taskAbility});
        setSeed(`angle-arithmetic-determinism-${operation}-${taskAbility}`);
        expect(generator.generate({operation, taskAbility})).toEqual(first);
    });
});
