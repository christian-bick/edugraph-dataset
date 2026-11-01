import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {extractConfig} from '../../../lib/utils.ts';
import {OperationsEquationJudgmentCore} from '../../../visuals/views/operations/operations-equation-judgment/view.tsx';
import {ArithmeticEquationJudgmentGeneratorSchema as schema} from './spec.ts';
import {judgmentDomain} from './domain.ts';

describe('equation judgment range projections', () => {
    it('keeps all 840 mathematical proposals unchanged in both Question and Solution', () => {
        let rendered = 0;
        for (const labels of schema.profile[2]) {
            const profile = extractConfig(schema, [...labels]).config.profile!;
            for (const data of judgmentDomain(profile)) {
                for (const isSolutionView of [false, true]) {
                    const markup = renderToStaticMarkup(createElement(OperationsEquationJudgmentCore, {
                        config: {}, payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never
                    }));
                    const text = markup.replace(/<[^>]*>/g, ' ');
                    expect(text).toContain(`${data.num1} ${data.operation === 'addition' ? '+' : '−'} ${data.num2} = ${data.claimedAnswer}`);
                    expect(text.includes('Is this equation true or false?')).toBe(!isSolutionView);
                    expect(markup.includes('text-emerald-700')).toBe(isSolutionView);
                    rendered++;
                }
            }
        }
        expect(rendered).toBe(1680);
    });
});
