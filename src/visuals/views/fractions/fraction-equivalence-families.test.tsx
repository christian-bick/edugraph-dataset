import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {FractionEquivalenceGenerator} from '../../../generators/fraction/fraction-equivalence/generator.ts';
import {FractionTenthsEquivalenceGenerator} from '../../../generators/fraction/fraction-tenths-equivalence/generator.ts';
import {FractionWholeEquivalenceGenerator} from '../../../generators/fraction/fraction-whole-equivalence/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {FractionEquivalenceView} from './fraction-equivalence-view.tsx';
import {FractionLineView} from '../numbers/fraction-line-view.tsx';

const payload = <T,>(data: T, isSolutionView: boolean): RenderPayload<AbstractProblem<T>> => ({
    problem: {type: 'fraction', data, labels: []}, viewId: 'test', targetLabels: [], isSolutionView, seed: 19
});

describe('equivalence payload families', () => {
    it('renders every admitted scaling and whole-number family in both modes', () => {
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const proper = new FractionEquivalenceGenerator().generate({usesMultiplication: true}).data;
            const tenths = new FractionTenthsEquivalenceGenerator().generate({}).data;
            const whole = new FractionWholeEquivalenceGenerator().generate({}).data;
            for (const solution of [false, true]) {
                for (const mode of ['formalization', 'explanation'] as const) {
                    for (const data of [proper, tenths]) {
                        expect(() => renderToStaticMarkup(<FractionEquivalenceView mode={mode} payload={payload(data, solution)} viewId="test" />)).not.toThrow();
                    }
                    for (const data of [proper, tenths, whole]) {
                        expect(renderToStaticMarkup(<FractionLineView mode={mode} payload={payload(data, solution)} />)).toContain('<svg');
                    }
                }
                const classification = renderToStaticMarkup(<FractionLineView mode="classification" payload={payload(proper, solution)} />);
                expect(classification.includes('>same point</text>')).toBe(solution);
                expect(renderToStaticMarkup(<FractionEquivalenceView mode="classification" payload={payload(proper, solution)} viewId="test" />)).toContain('equivalent');
            }
        }
    });
});
