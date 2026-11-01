import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {PatternExplanationView} from '../../../visuals/views/operations/pattern-explanation-view.tsx';
import {PatternTableView} from '../../../visuals/views/operations/pattern-table-view.tsx';
import {patternDomain} from './domain.ts';

describe('finite recurrence projections', () => {
    it('renders every retained mathematical frame in question and solution without changing its rule or completed sequence', () => {
        let rendered = 0;
        for (const operation of ['addition', 'multiplication'] as const) {
            for (const property of [false, 'commutative', 'associative', 'distributive'] as const) {
                for (const {range} of canonicalRangeProfiles.filter(({range}) => range.max <= 10000 && [0, 5].includes(range.min))) {
                    for (const data of patternDomain(operation, property, range)) {
                        for (const mode of ['generation', 'feature-classification', 'legacy-explanation', 'generation-practice', 'feature-explanation'] as const) {
                            for (const isSolutionView of [false, true]) {
                                const props = {mode, viewId: 'recurrence-projection-test', missingTermIndex: 3,
                                    payload: {problem: {type: 'arithmetic', data, labels: []}, isSolutionView, seed: 0} as never};
                                const text = renderToStaticMarkup(mode === 'generation' || mode === 'feature-classification'
                                    ? createElement(PatternTableView, {...props, mode})
                                    : createElement(PatternExplanationView, {...props, mode}))
                                    .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
                                expect(text).not.toContain('Invalid');
                                if (isSolutionView) for (const term of data.terms) expect(text).toContain(String(term));
                                if (data.recurrence.kind !== 'position-multiple') expect(text).toContain(String(data.recurrence.operand));
                                rendered++;
                            }
                        }
                    }
                }
            }
        }
        expect(rendered).toBe(810);
    });
});
