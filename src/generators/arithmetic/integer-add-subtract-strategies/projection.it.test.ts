import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {OperationsAddSubtractStrategyView} from '../../../visuals/views/operations/operations-add-subtract-strategy-view.tsx';
import {getIntegerAddSubtractStrategyPresentation} from '../../../visuals/views/operations/operations-add-subtract-strategy-helpers.ts';
import {buildFlexibleStrategy, flexibleStrategyRows} from './domain.ts';

describe('flexible strategy required-method projections', () => {
    it('preserves complete mathematical methods and bounds at every feasible profile boundary', () => {
        let rendered = 0;
        for (const strategy of ['addition-make-ten', 'addition-near-doubles', 'addition-compensation-single', 'addition-compensation-multiple',
            'subtraction-compensation-single', 'subtraction-compensation-multiple', 'subtraction-make-ten', 'subtraction-think-addition'] as const) {
            for (const {range} of canonicalRangeProfiles.filter(profile => profile.range.max <= 1000 && [0, 5].includes(profile.range.min))) {
                const rows = flexibleStrategyRows(strategy, range);
                if (!rows.length) continue;
                for (const row of [rows[0]!, rows[Math.floor(rows.length / 2)]!, rows.at(-1)!]) {
                    for (const tail of [row.minimum, Math.floor((row.minimum + row.maximum) / 2), row.maximum]) {
                        const data = buildFlexibleStrategy(strategy, row.anchor, tail);
                        const presentation = getIntegerAddSubtractStrategyPresentation(data);
                        const values = [data.leftOperand, data.rightOperand, data.answer, data.adjustment,
                            ...data.steps.flatMap(step => step.kind === 'decomposition' ? [step.whole, ...step.parts]
                                : [step.leftOperand, step.rightOperand, step.result])];
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        for (const isSolutionView of [false, true]) {
                            const text = renderToStaticMarkup(createElement(OperationsAddSubtractStrategyView, {
                                mode: 'understanding', viewId: 'operations-add-subtract-strategy-understanding',
                                payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never
                            })).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                            expect(text).toContain(presentation.transformedEquation);
                            expect(text).toContain(isSolutionView ? presentation.solutionEquation : presentation.questionEquation);
                            if (isSolutionView) for (const step of presentation.steps) expect(text).toContain(step);
                            else expect(text).toContain('Complete each equation in order.');
                            rendered++;
                        }
                    }
                }
            }
        }
        expect(rendered).toBe(684);
    });
});
