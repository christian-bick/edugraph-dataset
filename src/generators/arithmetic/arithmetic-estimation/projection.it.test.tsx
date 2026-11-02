import {renderToStaticMarkup} from 'react-dom/server';
import {afterAll, beforeAll, describe, expect, it, vi} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {canonicalEstimationCases, canonicalEstimationDomain, hasCanonicalEstimationProfile} from './canonical-domain.ts';
import {estimationRelation} from './numeric-domain.ts';

let View: typeof import('../../../visuals/views/operations/operations-answer-reasonableness/view.tsx').OperationsAnswerReasonableness;
beforeAll(async () => {
    vi.stubGlobal('window', {});
    View = (await import('../../../visuals/views/operations/operations-answer-reasonableness/view.tsx')).OperationsAnswerReasonableness;
});
afterAll(() => vi.unstubAllGlobals());

describe('estimation canonical range projections', () => {
    it('preserves same-value Question/Solution rendering across both source edges of all47 cells', () => {
        let rendered = 0;
        for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const) for (const zero of [false, true]) {
            for (const {range, labels} of canonicalRangeProfiles.filter(({range}) => range.max <= 1000)) {
                if (!hasCanonicalEstimationProfile(operation, zero, range)) continue;
                const domain = canonicalEstimationDomain(operation, zero, range);
                for (const last of [false, true]) {
                    const row = last ? domain.rows.at(-1)! : domain.rows[0]!;
                    const relation = estimationRelation(row.source, row.first, last ? row.seconds.at(-1)! : row.seconds[0]!)!;
                    const cases = canonicalEstimationCases(relation, zero, range), proposal = last ? cases.at(-1)! : cases[0]!;
                    const data = {...relation, proposal: {proposedAnswer: proposal.proposedAnswer, roundedProposedAnswer: proposal.roundedProposedAnswer}};
                    for (const isSolutionView of [false, true]) {
                        const render = (labels: string[]) => renderToStaticMarkup(<View payload={{
                            problem: {type: 'arithmetic', data, labels}, viewId: 'operations-answer-reasonableness',
                            targetLabels: [], seed: 13, isSolutionView, preparedView: {version: 1,
                                viewId: 'operations-answer-reasonableness', config: {}, labels: [], randomState: 13,
                                planHash: 'projection', variantHash: 'projection'}
                        }} />);
                        expect(render(labels)).toBe(render([]));
                        rendered++;
                    }
                }
            }
        }
        expect(rendered).toBe(188);
    }, 60000);
});
