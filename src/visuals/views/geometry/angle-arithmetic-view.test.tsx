import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {AngleArithmeticProblem} from '../../../types/problems.ts';
import {AngleArithmeticTask} from './angle-arithmetic-helpers.ts';
import {AngleArithmeticView} from './angle-arithmetic-view.tsx';

const render = (
    data: AngleArithmeticProblem,
    task: AngleArithmeticTask,
    seed: number,
    isSolutionView: boolean
) => renderToStaticMarkup(createElement(AngleArithmeticView, {
    task,
    viewId: 'angle-arithmetic-test',
    payload: {
        viewId: 'angle-arithmetic-test',
        problem: {type: 'shape', data, labels: []},
        targetLabels: [],
        seed,
        isSolutionView
    }
}));

describe('angle arithmetic rendered evidence', () => {
    it.each([
        ['addition', 2, '?° + 85° = 150°', '150° − 85°', '65°', 'AOB'],
        ['addition', 3, '65° + ?° = 150°', '150° − 65°', '85°', 'BOC'],
        ['subtraction', 2, '?° + 85° = 150°', '150° − 85°', '65°', 'AOB'],
        ['subtraction', 3, '65° + ?° = 150°', '150° − 65°', '85°', 'BOC']
    ] as const)('keeps addition and inversion visible for %s at seed %i', (
        operation, seed, questionAddition, inverse, answer, unknownAngle
    ) => {
        const data: AngleArithmeticProblem = {
            operation,
            adjacentAngleMeasures: [65, 85],
            wholeAngleMeasure: 150
        };
        const question = render(data, 'solve-unknown-component', seed, false);
        expect(question).toContain(`>${questionAddition}</div>`);
        expect(question).toContain(`>${inverse} = ?°</div>`);
        expect(question).not.toContain(answer);

        const solution = render(data, 'solve-unknown-component', seed, true);
        expect(solution).toContain('>65° + 85° = 150°</div>');
        expect(solution).toContain(`>${inverse} = ${answer}</div>`);
        expect(solution).toContain(`>Angle ${unknownAngle} measures ${answer}.</div>`);
        expect(solution).not.toContain('?°');
        expect(render(data, 'solve-unknown-component', seed, true)).toBe(solution);
    });

    it('preserves the explicit addition witness in the equal-angle VQA regression', () => {
        const solution = render({
            operation: 'addition',
            adjacentAngleMeasures: [45, 45],
            wholeAngleMeasure: 90
        }, 'solve-unknown-component', 1743605284, true);
        expect(solution).toContain('>45° + 45° = 90°</div>');
        expect(solution).toContain('>90° − 45° = 45°</div>');
    });

    it('keeps the unknown-whole answer withheld and shows its completed addition once', () => {
        const data: AngleArithmeticProblem = {
            operation: 'addition',
            adjacentAngleMeasures: [65, 85],
            wholeAngleMeasure: 150
        };
        const question = render(data, 'solve-unknown-whole', 2, false);
        expect(question).toContain('>65° + 85° = ?°</div>');
        expect(question).not.toContain('150°');
        const solution = render(data, 'solve-unknown-whole', 2, true);
        expect(solution.match(/>65° \+ 85° = 150°<\/div>/g)).toHaveLength(1);
    });
});
