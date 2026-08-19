import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {KnownFactDerivationView} from './known-fact-derivation-view.tsx';

const inverseDivision: KnownFactDerivationProblem = {
    strategy: 'inverse-division',
    operation: 'division',
    knownFact: {firstFactor: 7, secondFactor: 8, product: 56},
    derivedOperands: [56, 7],
    answer: 8
};

const payload = (
    problemData: KnownFactDerivationProblem,
    isSolutionView: boolean
): ViewRenderPayload<'operations-known-fact-derivation'> => ({
    problem: {type: 'arithmetic', data: problemData},
    viewId: 'operations-known-fact-derivation',
    labels: [],
    isSolutionView,
    seed: 17
});

const render = (
    data: KnownFactDerivationProblem,
    mode: 'understanding' | 'inversion',
    isSolutionView = false
) => renderToStaticMarkup(
    <KnownFactDerivationView
        mode={mode}
        payload={payload(data, isSolutionView)}
        viewId={mode === 'inversion' ? 'operations-known-fact-inversion' : 'operations-known-fact-derivation'}
    />
);

describe('known-fact derivation Ability leaves', () => {
    it('derives the ProcedureUnderstanding presentation from canonical division mathematics', () => {
        const markup = render(inverseDivision, 'understanding');
        expect(markup).toContain('Multiplication and division are inverse operations');
        expect(markup).toContain('56 ÷ 7 = ?');
        expect(markup).toContain('Relationship');
        expect(markup).not.toContain('Inverted relationship');
    });

    it('makes inverse-division ProcedureInversion an explicit missing-factor transformation', () => {
        const question = render(inverseDivision, 'inversion');
        const solution = render(inverseDivision, 'inversion', true);

        expect(question).toContain('Division as an unknown factor');
        expect(question).toContain('Inverted relationship');
        expect(question).toContain('7 × ? = 56');
        expect(solution).toContain('7 × 8 = 56');
        expect(solution).toContain('unknown factor is 8');
    });

    it.each([
        {
            strategy: 'commutative',
            operation: 'multiplication',
            knownFact: {firstFactor: 7, secondFactor: 8, product: 56},
            derivedOperands: [8, 7],
            answer: 56,
            witness: '7 × 8 = 8 × ?'
        },
        {
            strategy: 'associative',
            operation: 'multiplication',
            knownFact: {firstFactor: 3, secondFactor: 4, product: 12},
            derivedOperands: [2, 3, 4],
            answer: 24,
            witness: '(? × 3) × 4 = ? × (3 × 4)'
        },
        {
            strategy: 'place-value-scaling',
            operation: 'multiplication',
            knownFact: {firstFactor: 3, secondFactor: 4, product: 12},
            derivedOperands: [3, 40],
            answer: 120,
            witness: '3 × ? = (3 × 4) × 10'
        }
    ] as const)('makes $strategy inversion observable while preserving its mathematical witness', fixture => {
        const markup = render(fixture as KnownFactDerivationProblem, 'inversion');
        expect(markup).toContain('Inverted relationship');
        expect(markup).toContain(fixture.witness);
        expect(markup).toContain('?');
    });

    it('rejects inconsistent canonical derivation data', () => {
        expect(() => render({...inverseDivision, answer: 9}, 'inversion')).toThrow(
            'must describe one consistent derivation'
        );
    });
});
