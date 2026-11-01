import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {buildSignedRationalContextProblem} from './generator.ts';
import {SignedContextBody} from '../../../visuals/views/numbers/signed-context-view.tsx';
import {formatSignedRational} from '../../../visuals/views/numbers/signed-meaning-helpers.ts';

const text = (markup: string) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

describe('signed-context canonical boundary projections', () => {
    it('retains signed readings, units and opposite-side meanings across both tasks and renderer modes', () => {
        for (const context of ['temperature', 'elevation', 'balance', 'charge'] as const) {
            for (const [positive, negative] of [[4, -5], [5, -6], [10, -9]] as const) {
                const data = buildSignedRationalContextProblem(context,
                    [{numerator: positive, denominator: 1}, {numerator: negative, denominator: 1}]);
                for (const task of ['signed-context-interpretation', 'signed-context-formalization'] as const) {
                    const question = renderToStaticMarkup(<SignedContextBody data={data} task={task} isSolutionView={false} />);
                    const solution = renderToStaticMarkup(<SignedContextBody data={data} task={task} isSolutionView />);
                    expect(question).not.toContain('<svg');
                    expect(solution).not.toContain('<svg');
                    expect(text(question)).toContain(String(positive));
                    expect(text(question)).toContain(String(-negative));
                    expect(text(solution)).toContain(String(positive));
                    expect(text(solution)).toContain(String(-negative));
                    if (task === 'signed-context-formalization') {
                        expect(text(question)).not.toContain(formatSignedRational(data.observations[1]!.value, true));
                        expect(text(solution)).toContain(formatSignedRational(data.observations[0]!.value, true));
                        expect(text(solution)).toContain(formatSignedRational(data.observations[1]!.value, true));
                    } else {
                        expect(text(question)).toContain(formatSignedRational(data.observations[1]!.value, true));
                        expect(solution).toContain('context-answer');
                    }
                }
            }
        }
    });
});
