import {Ability} from 'edugraph-ts';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../../types/problems.ts';
import {OperationsKnownFactDerivationCore} from './view.tsx';

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
            <OperationsKnownFactDerivationCore
                config={{taskAbilities: [Ability.ProcedureUnderstanding]}}
                payload={payload(data, false)}
            />
        );

        expect(markup).toContain('Multiplication and division are inverse operations');
        expect(markup).toContain('Relationship');
        expect(markup).not.toContain('Missing-factor inversion');
    });

    it('makes ProcedureInversion an explicit missing-factor transformation', () => {
        const question = renderToStaticMarkup(
            <OperationsKnownFactDerivationCore
                config={{taskAbilities: [
                    Ability.ProcedureUnderstanding,
                    Ability.ProcedureInversion
                ]}}
                payload={payload(data, false)}
            />
        );
        const solution = renderToStaticMarkup(
            <OperationsKnownFactDerivationCore
                config={{taskAbilities: [
                    Ability.ProcedureUnderstanding,
                    Ability.ProcedureInversion
                ]}}
                payload={payload(data, true)}
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
            <OperationsKnownFactDerivationCore
                config={{taskAbilities: [
                    Ability.ProcedureUnderstanding,
                    Ability.ProcedureInversion
                ]}}
                payload={payload(commutative, false)}
            />
        )).toThrow('ProcedureInversion requires an inverse-division derivation');
    });
});
