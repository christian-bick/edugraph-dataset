import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {KnownFactDerivationView} from './known-fact-derivation-view.tsx';

const data: KnownFactDerivationProblem = {
    task: 'known-fact-derivation',
    strategy: 'inverse-division',
    operation: 'division',
    knownFact: {
        firstFactor: 7,
        secondFactor: 8,
        product: 56,
        equation: '7 × 8 = 56'
    },
    derivedOperands: [56, 7],
    answer: 8,
    prompt: 'Use the known multiplication fact to solve 56 ÷ 7 = ?',
    questionEquation: '56 ÷ 7 = ?',
    solutionEquation: '56 ÷ 7 = 8',
    relationEquation: '7 × ? = 56',
    explanation: 'Division asks for the missing factor. Since 7 × 8 = 56, 56 ÷ 7 = 8.'
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

describe('operations-known-fact-derivation Ability modes', () => {
    it('renders ordinary ProcedureUnderstanding as a supplied derivation relationship', () => {
        const markup = renderToStaticMarkup(
            <KnownFactDerivationView
                mode="understanding"
                payload={payload(data, false)}
                viewId="operations-known-fact-derivation"
            />
        );

        expect(markup).toContain('Multiplication and division are inverse operations');
        expect(markup).toContain('Relationship');
        expect(markup).not.toContain('Missing-factor inversion');
    });

    it('makes ProcedureInversion an explicit missing-factor transformation', () => {
        const question = renderToStaticMarkup(
            <KnownFactDerivationView
                mode="inversion"
                payload={payload(data, false)}
                viewId="operations-known-fact-inversion"
            />
        );
        const solution = renderToStaticMarkup(
            <KnownFactDerivationView
                mode="inversion"
                payload={payload(data, true)}
                viewId="operations-known-fact-inversion"
            />
        );

        expect(question).toContain('Division as an unknown factor');
        expect(question).toContain('Missing-factor inversion');
        expect(question).toContain('Invert the division question');
        expect(solution).toContain('division equation becomes the missing-factor relationship');
    });

    it('rejects ProcedureInversion for non-division mathematics', () => {
        const commutative = structuredClone(data);
        commutative.strategy = 'commutative';
        commutative.operation = 'multiplication';
        commutative.derivedOperands = [8, 7];
        commutative.answer = 56;
        commutative.questionEquation = '8 × 7 = ?';
        commutative.solutionEquation = '8 × 7 = 56';
        commutative.relationEquation = '7 × 8 = 8 × 7';

        expect(() => renderToStaticMarkup(
            <KnownFactDerivationView
                mode="inversion"
                payload={payload(commutative, false)}
                viewId="operations-known-fact-inversion"
            />
        )).toThrow('ProcedureInversion requires an inverse-division derivation');
    });
});
