import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {KnownFactDerivationProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';

export type KnownFactDerivationMode = 'understanding' | 'inversion';

interface KnownFactDerivationViewProps {
    mode: KnownFactDerivationMode;
    payload: RenderPayload<AbstractProblem<KnownFactDerivationProblem>>;
    viewId: string;
}

type Presentation = {
    title: string;
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    relationQuestion: string;
    relationSolution: string;
    explanation: string;
};

const knownEquation = (data: KnownFactDerivationProblem): string => {
    const {firstFactor, secondFactor, product} = data.knownFact;
    return `${firstFactor} × ${secondFactor} = ${product}`;
};

const isValidKnownFactDerivation = (data: KnownFactDerivationProblem): boolean => {
    const known = data.knownFact;
    if (!known
        || !Number.isInteger(known.firstFactor)
        || !Number.isInteger(known.secondFactor)
        || !Number.isInteger(known.product)
        || known.firstFactor <= 0
        || known.secondFactor <= 0
        || known.product !== known.firstFactor * known.secondFactor
        || !Array.isArray(data.derivedOperands)
        || !data.derivedOperands.every(value => Number.isInteger(value) && value > 0)
        || !Number.isInteger(data.answer)
        || data.answer <= 0) {
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

function understandingPresentation(data: KnownFactDerivationProblem): Presentation {
    const known = data.knownFact;
    if (data.strategy === 'commutative') {
        const [first, second] = data.derivedOperands;
        const questionEquation = `${first} × ${second} = ?`;
        const solutionEquation = `${first} × ${second} = ${data.answer}`;
        const relation = `${known.firstFactor} × ${known.secondFactor} = ${first} × ${second}`;
        return {
            title: 'Commutative known-fact strategy',
            prompt: `Use the known fact and the commutative property to solve ${questionEquation}`,
            questionEquation,
            solutionEquation,
            relationQuestion: relation,
            relationSolution: relation,
            explanation: `Changing the order of the factors does not change the product, so ${solutionEquation}.`
        };
    }
    if (data.strategy === 'associative') {
        const [first, second, third] = data.derivedOperands;
        const questionEquation = `(${first} × ${second}) × ${third} = ?`;
        const solutionEquation = `(${first} × ${second}) × ${third} = ${data.answer}`;
        const relation = `(${first} × ${second}) × ${third} = ${first} × (${second} × ${third})`;
        return {
            title: 'Associative known-fact strategy',
            prompt: `Regroup the factors around the known fact to solve ${questionEquation}`,
            questionEquation,
            solutionEquation,
            relationQuestion: relation,
            relationSolution: relation,
            explanation: `${knownEquation(data)} is the grouped known fact. Then ${first} × ${known.product} = ${data.answer}.`
        };
    }
    if (data.strategy === 'inverse-division') {
        const [dividend, divisor] = data.derivedOperands;
        const questionEquation = `${dividend} ÷ ${divisor} = ?`;
        const solutionEquation = `${dividend} ÷ ${divisor} = ${data.answer}`;
        const relationQuestion = `${divisor} × ? = ${dividend}`;
        const relationSolution = `${divisor} × ${data.answer} = ${dividend}`;
        return {
            title: 'Multiplication and division are inverse operations',
            prompt: `Use the known multiplication fact to solve ${questionEquation}`,
            questionEquation,
            solutionEquation,
            relationQuestion,
            relationSolution,
            explanation: `Division asks for the missing factor. Since ${knownEquation(data)}, ${solutionEquation}.`
        };
    }

    const [first, scaledFactor] = data.derivedOperands;
    const questionEquation = `${first} × ${scaledFactor} = ?`;
    const solutionEquation = `${first} × ${scaledFactor} = ${data.answer}`;
    const relation = `${first} × ${scaledFactor} = (${first} × ${known.secondFactor}) × 10`;
    return {
        title: 'Scale a known fact by place value',
        prompt: `Use the known one-digit fact and place-value scaling to solve ${questionEquation}`,
        questionEquation,
        solutionEquation,
        relationQuestion: relation,
        relationSolution: relation,
        explanation: `${scaledFactor} is 10 times ${known.secondFactor}, so ${known.product} scales to ${known.product} × 10 = ${data.answer}.`
    };
}

function inversionPresentation(data: KnownFactDerivationProblem): Presentation {
    const known = data.knownFact;
    if (data.strategy === 'commutative') {
        const [first] = data.derivedOperands;
        const unknown = known.firstFactor;
        return {
            title: 'Invert a commutative known-fact derivation',
            prompt: 'Use the known fact and the commutative relationship to recover the missing factor.',
            questionEquation: `${first} × ? = ${data.answer}`,
            solutionEquation: `${first} × ${unknown} = ${data.answer}`,
            relationQuestion: `${known.firstFactor} × ${known.secondFactor} = ${first} × ?`,
            relationSolution: `${known.firstFactor} × ${known.secondFactor} = ${first} × ${unknown}`,
            explanation: `Commutativity reverses the factor order, so the missing factor is ${unknown}.`
        };
    }
    if (data.strategy === 'associative') {
        const [unknown, second, third] = data.derivedOperands;
        return {
            title: 'Invert an associative known-fact derivation',
            prompt: 'Use the grouped known fact and the total product to recover the missing outer factor.',
            questionEquation: `? × ${known.product} = ${data.answer}`,
            solutionEquation: `${unknown} × ${known.product} = ${data.answer}`,
            relationQuestion: `(? × ${second}) × ${third} = ? × (${second} × ${third})`,
            relationSolution: `(${unknown} × ${second}) × ${third} = ${unknown} × (${second} × ${third})`,
            explanation: `The grouped known fact is ${knownEquation(data)}. Reversing ${unknown} × ${known.product} = ${data.answer} recovers ${unknown}.`
        };
    }
    if (data.strategy === 'inverse-division') {
        const [dividend, divisor] = data.derivedOperands;
        return {
            title: 'Division as an unknown factor',
            prompt: `Rewrite ${dividend} ÷ ${divisor} as missing-factor multiplication, then solve.`,
            questionEquation: `${dividend} ÷ ${divisor} = ?`,
            solutionEquation: `${dividend} ÷ ${divisor} = ${data.answer}`,
            relationQuestion: `${dividend} ÷ ${divisor} = ?  ↔  ${divisor} × ? = ${dividend}`,
            relationSolution: `${dividend} ÷ ${divisor} = ${data.answer}  ↔  ${divisor} × ${data.answer} = ${dividend}`,
            explanation: `Multiplication reverses the division procedure, so the unknown factor is ${data.answer}.`
        };
    }

    const [first, scaledFactor] = data.derivedOperands;
    return {
        title: 'Invert a place-value scaling derivation',
        prompt: 'Use the known one-digit fact and scaled product to recover the missing multiple of ten.',
        questionEquation: `${first} × ? = ${data.answer}`,
        solutionEquation: `${first} × ${scaledFactor} = ${data.answer}`,
        relationQuestion: `${first} × ? = (${first} × ${known.secondFactor}) × 10`,
        relationSolution: `${first} × ${scaledFactor} = (${first} × ${known.secondFactor}) × 10`,
        explanation: `${known.secondFactor} scales by 10 to ${scaledFactor}, matching the product scale from ${known.product} to ${data.answer}.`
    };
}

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
    const equationSize = equation.length > 28
        ? 'text-[0.95rem]'
        : equation.length > 20
            ? 'text-[1.08rem]'
            : 'text-2xl';

    return (
        <div className={`flex min-h-36 flex-col items-center justify-center rounded-xl border-2 px-3 py-4 text-center ${tones[tone]}`}>
            <div className={`text-xs font-bold uppercase tracking-[0.14em] ${labelTones[tone]}`}>
                {label}
            </div>
            <div className={`mt-3 whitespace-nowrap font-mono font-extrabold leading-snug ${equationSize}`}>
                {equation}
            </div>
        </div>
    );
};

export const KnownFactDerivationView = ({
    mode,
    payload,
    viewId
}: KnownFactDerivationViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, [
        'strategy',
        'operation',
        'knownFact',
        'derivedOperands',
        'answer'
    ]);
    if (!isValidKnownFactDerivation(data)) {
        throw new ViewValidationError(
            viewId,
            'The known fact, strategy, derived operands, and answer must describe one consistent derivation.'
        );
    }

    const invertsProcedure = mode === 'inversion';
    const presentation = invertsProcedure
        ? inversionPresentation(data)
        : understandingPresentation(data);

    return (
        <div className="w-[1080px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    {presentation.title}
                </div>
                <div className="mt-2 text-xl font-bold leading-snug text-slate-800">
                    {presentation.prompt}
                </div>
            </div>

            <div className="mt-7 grid grid-cols-[1fr_52px_1.2fr_52px_1fr] items-center gap-3">
                <DerivationCard label="Known fact" equation={knownEquation(data)} tone="sky" />
                <div className="text-center text-3xl font-black text-slate-400" aria-hidden="true">→</div>
                <DerivationCard
                    label={invertsProcedure ? 'Inverted relationship' : 'Relationship'}
                    equation={isSolutionView ? presentation.relationSolution : presentation.relationQuestion}
                    tone="violet"
                />
                <div className="text-center text-3xl font-black text-slate-400" aria-hidden="true">→</div>
                <DerivationCard
                    label={isSolutionView ? 'Derived fact' : 'Find the related fact'}
                    equation={isSolutionView ? presentation.solutionEquation : presentation.questionEquation}
                    tone="emerald"
                />
            </div>

            {isSolutionView ? (
                <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-emerald-50 px-6 py-4 text-center text-base font-semibold leading-relaxed text-emerald-950">
                    {presentation.explanation}
                </div>
            ) : (
                <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-4 text-center text-base font-semibold text-slate-600">
                    {invertsProcedure
                        ? 'Reverse the shown relationship to determine the unknown input.'
                        : 'Follow the relationship from the known fact to determine the missing value.'}
                </div>
            )}
        </div>
    );
};
