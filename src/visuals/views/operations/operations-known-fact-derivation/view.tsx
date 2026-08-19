import {Ability} from 'edugraph-ts';
import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {
    OperationsKnownFactDerivationViewConfig,
    OperationsKnownFactDerivationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsKnownFactDerivationViewConfig;
    payload: ViewRenderPayload<'operations-known-fact-derivation'>;
}

const VIEW_ID = 'operations-known-fact-derivation';

const strategyTitle: Record<KnownFactDerivationProblem['strategy'], string> = {
    commutative: 'Commutative known-fact strategy',
    associative: 'Associative known-fact strategy',
    'inverse-division': 'Multiplication and division are inverse operations',
    'place-value-scaling': 'Scale a known fact by place value'
};

const isNonEmptyText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const hasExactAbilities = (
    actual: readonly string[] | undefined,
    expected: readonly string[]
): boolean => Array.isArray(actual)
    && actual.length === expected.length
    && expected.every(ability => actual.includes(ability));

const isValidKnownFactDerivation = (data: KnownFactDerivationProblem): boolean => {
    const known = data.knownFact;
    if (!known
        || !Number.isInteger(known.firstFactor)
        || !Number.isInteger(known.secondFactor)
        || !Number.isInteger(known.product)
        || known.firstFactor <= 0
        || known.secondFactor <= 0
        || known.product !== known.firstFactor * known.secondFactor
        || !isNonEmptyText(known.equation)
        || !Array.isArray(data.derivedOperands)
        || !data.derivedOperands.every(value => Number.isInteger(value) && value > 0)
        || !Number.isInteger(data.answer)
        || data.answer <= 0
        || ![data.prompt, data.questionEquation, data.solutionEquation, data.relationEquation, data.explanation]
            .every(isNonEmptyText)
        || !data.questionEquation.includes('?')
        || data.solutionEquation.includes('?')) {
        return false;
    }

    if (data.strategy === 'commutative') {
        return data.operation === 'multiplication'
            && data.derivedOperands.length === 2
            && data.derivedOperands[0] === known.secondFactor
            && data.derivedOperands[1] === known.firstFactor
            && data.answer === known.product;
    }
    if (data.strategy === 'associative') {
        return data.operation === 'multiplication'
            && data.derivedOperands.length === 3
            && known.firstFactor === data.derivedOperands[1]
            && known.secondFactor === data.derivedOperands[2]
            && data.answer === data.derivedOperands[0] * known.product;
    }
    if (data.strategy === 'inverse-division') {
        return data.operation === 'division'
            && data.derivedOperands.length === 2
            && data.derivedOperands[0] === known.product
            && data.derivedOperands[1] === known.firstFactor
            && data.answer === known.secondFactor;
    }
    if (data.strategy === 'place-value-scaling') {
        return data.operation === 'multiplication'
            && data.derivedOperands.length === 2
            && data.derivedOperands[0] === known.firstFactor
            && data.derivedOperands[1] === known.secondFactor * 10
            && data.answer === known.product * 10;
    }
    return false;
};

const DerivationCard = ({
    label,
    equation,
    tone
}: {
    label: string;
    equation: string;
    tone: 'sky' | 'violet' | 'emerald';
}) => {
    const tones = {
        sky: 'border-sky-300 bg-sky-50 text-sky-950',
        violet: 'border-violet-300 bg-violet-50 text-violet-950',
        emerald: 'border-emerald-300 bg-emerald-50 text-emerald-950'
    } as const;
    const labelTones = {
        sky: 'text-sky-700',
        violet: 'text-violet-700',
        emerald: 'text-emerald-700'
    } as const;

    return (
        <div className={`flex min-h-36 flex-col items-center justify-center rounded-xl border-2 px-5 py-4 text-center ${tones[tone]}`}>
            <div className={`text-xs font-bold uppercase tracking-[0.14em] ${labelTones[tone]}`}>
                {label}
            </div>
            <div className="mt-3 font-mono text-2xl font-extrabold leading-snug">
                {equation}
            </div>
        </div>
    );
};

export const OperationsKnownFactDerivationCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, [
        'task',
        'strategy',
        'operation',
        'knownFact',
        'derivedOperands',
        'answer',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'relationEquation',
        'explanation'
    ]);
    if (data.task !== 'known-fact-derivation' || !isValidKnownFactDerivation(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'The known fact, relationship, derived operands, answer, and equations must describe one consistent derivation.'
        );
    }
    const understandsProcedure = hasExactAbilities(
        config.taskAbilities,
        [Ability.ProcedureUnderstanding]
    );
    const invertsProcedure = hasExactAbilities(
        config.taskAbilities,
        [Ability.ProcedureUnderstanding, Ability.ProcedureInversion]
    );
    if (!understandsProcedure && !invertsProcedure) {
        throw new ViewValidationError(
            VIEW_ID,
            'Known-fact derivation requires ProcedureUnderstanding, optionally with ProcedureInversion.'
        );
    }
    if (invertsProcedure && data.strategy !== 'inverse-division') {
        throw new ViewValidationError(
            VIEW_ID,
            'ProcedureInversion requires an inverse-division derivation.'
        );
    }

    const title = invertsProcedure
        ? 'Division as an unknown factor'
        : strategyTitle[data.strategy];
    const prompt = invertsProcedure
        ? `Rewrite the division as a missing-factor multiplication equation, then solve ${data.questionEquation}`
        : data.prompt;
    const relationshipLabel = invertsProcedure
        ? 'Missing-factor inversion'
        : 'Relationship';

    return (
        <div className="w-[930px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    {title}
                </div>
                <div className="mt-2 text-xl font-bold leading-snug text-slate-800">
                    {prompt}
                </div>
            </div>

            <div className="mt-7 grid grid-cols-[1fr_52px_1.2fr_52px_1fr] items-center gap-3">
                <DerivationCard
                    label="Known fact"
                    equation={data.knownFact.equation}
                    tone="sky"
                />
                <div className="text-center text-3xl font-black text-slate-400" aria-hidden="true">→</div>
                <DerivationCard
                    label={relationshipLabel}
                    equation={data.relationEquation}
                    tone="violet"
                />
                <div className="text-center text-3xl font-black text-slate-400" aria-hidden="true">→</div>
                <DerivationCard
                    label={isSolutionView ? 'Derived fact' : 'Find the related fact'}
                    equation={isSolutionView ? data.solutionEquation : data.questionEquation}
                    tone="emerald"
                />
            </div>

            {isSolutionView ? (
                <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-4 text-center text-base font-semibold leading-relaxed text-emerald-950">
                    {invertsProcedure
                        ? `The division equation becomes the missing-factor relationship ${data.relationEquation}. ${data.explanation}`
                        : data.explanation}
                </div>
            ) : (
                <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center text-base font-semibold text-slate-600">
                    {invertsProcedure
                        ? 'Invert the division question into missing-factor multiplication, then determine the unknown factor.'
                        : 'Follow the relationship from the known fact to determine the missing value.'}
                </div>
            )}
        </div>
    );
};

export const OperationsKnownFactDerivation = withConfig(
    OperationsKnownFactDerivationViewSchema,
    OperationsKnownFactDerivationCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'operations-known-fact-derivation'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<OperationsKnownFactDerivation payload={payload} />);
        }
    };
}
