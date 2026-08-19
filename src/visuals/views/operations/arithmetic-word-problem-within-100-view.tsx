import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    ArithmeticOperation,
    ArithmeticPairProblem,
    ArithmeticWordProblemInterpretedRemainder,
    ArithmeticWordProblemLetterEquation,
    ArithmeticWordProblemReasonableness,
    ArithmeticWordProblemTwoStep,
    ArithmeticWordProblemWithin100
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    getPairUnknown,
    getWordProblemStory,
    isTwoStepProblem,
    operationSymbol,
    WordProblemPart
} from './arithmetic-word-problem-within-100-helpers.ts';

export interface ArithmeticWordProblemWithin100Config {
    expectedKind?: 'interpreted-remainder' | 'letter-equation' | 'reasonableness';
    invertProcedure: boolean;
    useLengthContext: boolean;
}

interface ArithmeticWordProblemWithin100ViewProps {
    config: ArithmeticWordProblemWithin100Config;
    payload: RenderPayload<AbstractProblem<ArithmeticWordProblemWithin100>>;
}

const VIEW_ID = 'operations-word-problem-within-100';
const MAX_MAGNITUDE = 1_000_000;
const OPERATIONS: readonly ArithmeticOperation[] = [
    'addition',
    'subtraction',
    'multiplication',
    'division'
];

function fail(message: string): never {
    throw new ViewValidationError(VIEW_ID, message);
}

function assertIntegers(values: readonly number[], message: string) {
    if (values.some(value => !Number.isInteger(value) || Math.abs(value) > MAX_MAGNITUDE)) {
        fail(message);
    }
}

function assertOperations(operations: readonly ArithmeticOperation[]) {
    if (!Array.isArray(operations)
        || operations.length !== 2
        || operations.some(operation => !OPERATIONS.includes(operation))) {
        fail('Expected exactly two supported arithmetic operations.');
    }
}

function applyOperation(left: number, right: number, operation: ArithmeticOperation): number {
    if (operation === 'addition') return left + right;
    if (operation === 'subtraction') return left - right;
    if (operation === 'multiplication') return left * right;
    return left / right;
}

function ValueBox({
    part,
    value,
    hidden,
    highlighted,
    unit
}: {
    part: WordProblemPart;
    value: number;
    hidden: boolean;
    highlighted: boolean;
    unit: string;
}) {
    return (
        <div
            aria-label={`${part} value`}
            className={`flex h-[58px] min-w-[72px] items-center justify-center rounded-xl border-2 px-3 font-mono text-[1.65rem] font-bold ${
                highlighted
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : hidden
                        ? 'border-dashed border-slate-400 bg-white text-slate-400'
                        : 'border-slate-300 bg-white text-slate-800'
            }`}
        >
            {hidden ? '?' : `${value}${unit}`}
        </div>
    );
}

function EquationRow({
    left,
    right,
    operation,
    hiddenParts,
    isSolutionView,
    unit
}: {
    left: Array<{part: WordProblemPart; value: number}>;
    right: {part: WordProblemPart; value: number};
    operation: ArithmeticOperation;
    hiddenParts: WordProblemPart[];
    isSolutionView: boolean;
    unit: string;
}) {
    const renderBox = ({part, value}: {part: WordProblemPart; value: number}) => (
        <ValueBox
            key={part}
            part={part}
            value={value}
            hidden={!isSolutionView && hiddenParts.includes(part)}
            highlighted={isSolutionView && hiddenParts.includes(part)}
            unit={unit}
        />
    );

    return (
        <div className="flex items-center justify-center gap-3 text-[1.7rem] font-extrabold text-slate-500">
            {renderBox(left[0])}
            <span>{operationSymbol(operation)}</span>
            {renderBox(left[1])}
            <span>=</span>
            {renderBox(right)}
        </div>
    );
}

function CombinedEquationRow({
    data,
    isSolutionView,
    unit
}: {
    data: ArithmeticWordProblemTwoStep;
    isSolutionView: boolean;
    unit: string;
}) {
    return (
        <div className="flex items-center justify-center gap-3 border-b border-slate-200 pb-4 text-[1.7rem] font-extrabold text-slate-500">
            <ValueBox part="num1" value={data.num1} hidden={false} highlighted={false} unit={unit} />
            <span>{operationSymbol(data.operations[0])}</span>
            <ValueBox part="num2" value={data.num2} hidden={false} highlighted={false} unit={unit} />
            <span>{operationSymbol(data.operations[1])}</span>
            <ValueBox part="num3" value={data.num3} hidden={false} highlighted={false} unit={unit} />
            <span>=</span>
            <ValueBox
                part="answer"
                value={data.answer}
                hidden={!isSolutionView}
                highlighted={isSolutionView}
                unit={unit}
            />
        </div>
    );
}

function validatePair(data: ArithmeticPairProblem) {
    validateProblemData(VIEW_ID, data, ['num1', 'num2', 'operation', 'answer']);
    if (!OPERATIONS.includes(data.operation)) fail(`Unsupported operation: ${data.operation}`);
    assertIntegers([data.num1, data.num2, data.answer], 'One-step values must be whole numbers with magnitudes through one million.');
    const expected = applyOperation(data.num1, data.num2, data.operation);
    if (!Number.isFinite(expected) || expected !== data.answer) fail('The one-step equation is inconsistent.');
}

function validateTwoStep(data: ArithmeticWordProblemTwoStep) {
    validateProblemData(VIEW_ID, data, [
        'kind', 'num1', 'num2', 'num3', 'operations', 'intermediate', 'answer'
    ]);
    assertOperations(data.operations);
    assertIntegers(
        [data.num1, data.num2, data.num3, data.intermediate, data.answer],
        'Two-step values must be whole numbers with magnitudes through one million.'
    );
    const intermediate = applyOperation(data.num1, data.num2, data.operations[0]);
    const answer = applyOperation(intermediate, data.num3, data.operations[1]);
    if (intermediate !== data.intermediate || answer !== data.answer) {
        fail('The connected two-step equations are inconsistent.');
    }
}

function validateRemainder(data: ArithmeticWordProblemInterpretedRemainder) {
    validateProblemData(VIEW_ID, data, [
        'kind',
        'dividend',
        'divisor',
        'quotient',
        'remainder'
    ]);
    assertIntegers(
        [data.dividend, data.divisor, data.quotient, data.remainder],
        'Remainder values must be whole numbers with magnitudes through one million.'
    );
    if (data.divisor < 2
        || data.remainder < 1
        || data.remainder >= data.divisor
        || data.dividend !== data.divisor * data.quotient + data.remainder) {
        fail('The remainder relation is mathematically inconsistent.');
    }
}

function validateLetterEquation(data: ArithmeticWordProblemLetterEquation) {
    validateProblemData(VIEW_ID, data, [
        'kind',
        'operands',
        'operations',
        'intermediate',
        'answer'
    ]);
    if (!Array.isArray(data.operands) || data.operands.length !== 3) {
        fail('The letter-equation task requires exactly three operands.');
    }
    assertOperations(data.operations);
    assertIntegers(
        [...data.operands, data.intermediate, data.answer],
        'Letter-equation values must be whole numbers with magnitudes through one million.'
    );
    const intermediate = applyOperation(data.operands[0], data.operands[1], data.operations[0]);
    const answer = applyOperation(intermediate, data.operands[2], data.operations[1]);
    if (data.intermediate !== intermediate
        || data.answer !== answer) {
        fail('The supplied letter equations are mathematically inconsistent.');
    }
}

function validateReasonableness(data: ArithmeticWordProblemReasonableness) {
    validateProblemData(VIEW_ID, data, [
        'kind',
        'operands',
        'operations',
        'intermediate',
        'exactAnswer',
        'proposedAnswer',
        'roundingPlace',
        'roundedExactAnswer',
        'roundedProposedAnswer',
        'isReasonable'
    ]);
    if (!Array.isArray(data.operands) || data.operands.length !== 3) {
        fail('The reasonableness task requires exactly three operands.');
    }
    assertOperations(data.operations);
    assertIntegers(
        [
            ...data.operands,
            data.intermediate,
            data.exactAnswer,
            data.proposedAnswer,
            data.roundedExactAnswer,
            data.roundedProposedAnswer
        ],
        'Reasonableness values must be whole numbers with magnitudes through one million.'
    );
    const intermediate = applyOperation(data.operands[0], data.operands[1], data.operations[0]);
    const exactAnswer = applyOperation(intermediate, data.operands[2], data.operations[1]);
    const roundedExact = Math.round(data.exactAnswer / data.roundingPlace) * data.roundingPlace;
    const roundedProposed = Math.round(data.proposedAnswer / data.roundingPlace) * data.roundingPlace;
    if (data.roundingPlace !== 10
        || data.intermediate !== intermediate
        || data.exactAnswer !== exactAnswer
        || data.roundedExactAnswer !== roundedExact
        || data.roundedProposedAnswer !== roundedProposed
        || data.isReasonable !== (roundedExact === roundedProposed)) {
        fail('The supplied reasonableness check is mathematically inconsistent.');
    }
}

function StoryHeader({title, instruction}: {title: string; instruction: string}) {
    return (
        <div className="mb-5">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{title}</div>
            <div className="mt-1 text-lg font-semibold text-slate-700">{instruction}</div>
        </div>
    );
}

function StoryCard({story, question}: {story: string; question: string}) {
    return (
        <div className="rounded-xl border-l-4 border-sky-500 bg-slate-50 px-6 py-5 text-slate-700">
            <div className="text-[1.15rem] font-semibold leading-relaxed">{story}</div>
            <div className="mt-3 text-[1.2rem] font-extrabold leading-relaxed text-slate-900">{question}</div>
        </div>
    );
}

function AnswerCard({children}: {children: React.ReactNode}) {
    return (
        <div className="mt-5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center text-lg font-bold text-emerald-950">
            {children}
        </div>
    );
}

function LegacyProblem({
    data,
    config,
    isSolutionView
}: {
    data: ArithmeticPairProblem | ArithmeticWordProblemTwoStep;
    config: ArithmeticWordProblemWithin100Config;
    isSolutionView: boolean;
}) {
    const twoStep = isTwoStepProblem(data);
    const unit = config.useLengthContext ? ' cm' : '';
    const story = getWordProblemStory(
        data,
        config.useLengthContext!,
        config.invertProcedure!
    );
    const pairUnknown = twoStep
        ? 'answer'
        : getPairUnknown(data, config.invertProcedure!);

    return (
        <>
            <div className="mb-5 flex items-center justify-between">
                <StoryHeader
                    title={twoStep ? 'Two-step story' : 'Story problem'}
                    instruction={isSolutionView
                        ? twoStep ? 'Check the connected equations.' : 'Check the equation.'
                        : 'Use the story to find the unknown.'}
                />
                {config.useLengthContext && (
                    <div className="rounded-full bg-sky-50 px-4 py-2 text-sm font-bold text-sky-700">centimeters</div>
                )}
            </div>
            <div className="rounded-xl border-l-4 border-sky-500 bg-slate-50 px-6 py-5 text-[1.25rem] font-semibold leading-relaxed text-slate-700">
                {story}
            </div>
            <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-5">
                {twoStep ? (
                    <>
                        <CombinedEquationRow data={data} isSolutionView={isSolutionView} unit={unit} />
                        <div className="flex items-center gap-3">
                            <div className="w-16 text-sm font-bold uppercase tracking-wide text-slate-500">Step 1</div>
                            <EquationRow
                                left={[
                                    {part: 'num1', value: data.num1},
                                    {part: 'num2', value: data.num2}
                                ]}
                                right={{part: 'intermediate', value: data.intermediate}}
                                operation={data.operations[0]}
                                hiddenParts={['intermediate']}
                                isSolutionView={isSolutionView}
                                unit={unit}
                            />
                        </div>
                        <div className="flex items-center gap-3 border-t border-slate-200 pt-4">
                            <div className="w-16 text-sm font-bold uppercase tracking-wide text-slate-500">Step 2</div>
                            <EquationRow
                                left={[
                                    {part: 'intermediate', value: data.intermediate},
                                    {part: 'num3', value: data.num3}
                                ]}
                                right={{part: 'answer', value: data.answer}}
                                operation={data.operations[1]}
                                hiddenParts={['intermediate', 'answer']}
                                isSolutionView={isSolutionView}
                                unit={unit}
                            />
                        </div>
                    </>
                ) : (
                    <EquationRow
                        left={[
                            {part: 'num1', value: data.num1},
                            {part: 'num2', value: data.num2}
                        ]}
                        right={{part: 'answer', value: data.answer}}
                        operation={data.operation}
                        hiddenParts={[pairUnknown]}
                        isSolutionView={isSolutionView}
                        unit={unit}
                    />
                )}
            </div>
        </>
    );
}

function buildMultiStepStory(
    operands: readonly [number, number, number],
    operations: readonly [ArithmeticOperation, ArithmeticOperation]
): string {
    const [num1, num2, num3] = operands;
    const firstStep = operations[0] === 'addition'
        ? `A collection starts with ${num1} items and receives ${num2} more.`
        : operations[0] === 'subtraction'
            ? `A collection starts with ${num1} items and ${num2} are removed.`
            : operations[0] === 'multiplication'
                ? `A display has ${num1} equal groups with ${num2} items in each group.`
                : `${num1} items are shared equally among ${num2} groups.`;
    const secondStep = operations[1] === 'addition'
        ? `Then ${num3} more items are added to that result.`
        : operations[1] === 'subtraction'
            ? `Then ${num3} items are removed from that result.`
            : operations[1] === 'multiplication'
                ? `Then ${num3} identical copies of that result are combined.`
                : `Then that result is shared equally among ${num3} groups.`;
    return `${firstStep} ${secondStep}`;
}

function countedNoun(count: number, singular: string): string {
    return count === 1 ? singular : `${singular}s`;
}

function resolveRemainderPresentation(
    data: ArithmeticWordProblemInterpretedRemainder,
    seed: number
) {
    const mode = ['use-quotient', 'round-up', 'use-remainder'][Math.abs(seed) % 3]!;
    if (mode === 'round-up') {
        const answer = data.quotient + 1;
        return {
            story: `A class of ${data.dividend} students travels in vans that hold ${data.divisor} students each.`,
            question: 'How many vans are needed for every student?',
            contextDecision: 'Round the quotient up because the remaining students need another van.',
            explanation: `${data.quotient} vans are full and ${data.remainder} students remain, so one more van is required.`,
            answer: `${answer} vans are needed.`
        };
    }
    if (mode === 'use-remainder') {
        const remainderNoun = countedNoun(data.remainder, 'sticker');
        return {
            story: `${data.dividend} stickers are shared equally among ${data.divisor} students.`,
            question: 'How many stickers are left over?',
            contextDecision: 'Use the remainder because the question asks what is left over.',
            explanation: `Each student receives ${data.quotient} ${countedNoun(data.quotient, 'sticker')} and ${data.remainder} ${remainderNoun} ${data.remainder === 1 ? 'is' : 'are'} left over.`,
            answer: `${data.remainder} ${remainderNoun} ${data.remainder === 1 ? 'is' : 'are'} left over.`
        };
    }
    return {
        story: `${data.dividend} markers are packed into boxes that hold ${data.divisor} markers each. Only full boxes are shipped.`,
        question: 'How many full boxes can be shipped?',
        contextDecision: 'Use only the whole-number quotient because a partly filled box is not shipped.',
        explanation: `${data.quotient} boxes are full and ${data.remainder} markers do not complete another box.`,
        answer: `${data.quotient} full boxes can be shipped.`
    };
}

function RemainderProblem({data, isSolutionView, seed}: {
    data: ArithmeticWordProblemInterpretedRemainder;
    isSolutionView: boolean;
    seed: number;
}) {
    const presentation = resolveRemainderPresentation(data, seed);
    const divisionEquation = `${data.dividend} = ${data.divisor} × ${data.quotient} + ${data.remainder}`;
    return (
        <>
            <StoryHeader title="Interpret the remainder" instruction="Use the context to decide what the quotient and remainder mean." />
            <StoryCard story={presentation.story} question={presentation.question} />
            <div className="mt-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Step 1 · Divide</div>
                <div className="mt-1 text-sm font-semibold text-indigo-800">Find and identify the quotient and remainder.</div>
                <div className="mt-1 font-mono text-[1.8rem] font-extrabold text-indigo-950">{divisionEquation}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-900">
                        Quotient: <span className="font-mono text-base">{data.quotient}</span>
                    </div>
                    <div className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-bold text-indigo-900">
                        Remainder: <span className="font-mono text-base">{data.remainder}</span>
                    </div>
                </div>
            </div>
            {isSolutionView ? (
                <>
                    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Step 2 · Apply the context</div>
                        <div className="mt-1 text-base font-bold text-amber-950">{presentation.contextDecision}</div>
                        <div className="mt-2 text-sm font-semibold leading-relaxed text-amber-900">{presentation.explanation}</div>
                    </div>
                    <AnswerCard>{presentation.answer}</AnswerCard>
                </>
            ) : (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">Step 2 · Apply the context</div>
                    <div className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">
                        Use the story to decide how the quotient and remainder determine the answer.
                    </div>
                    <div className="mt-3 rounded-lg border border-amber-200 bg-white px-4 py-3 text-center font-bold text-emerald-700">
                        Context answer: __________
                    </div>
                </div>
            )}
        </>
    );
}

function LetterEquationProblem({data, isSolutionView}: {
    data: ArithmeticWordProblemLetterEquation;
    isSolutionView: boolean;
}) {
    const firstSymbol = operationSymbol(data.operations[0]);
    const secondSymbol = operationSymbol(data.operations[1]);
    const stepEquations = [
        `${data.operands[0]} ${firstSymbol} ${data.operands[1]} = ${data.intermediate}`,
        `${data.intermediate} ${secondSymbol} ${data.operands[2]} = n`
    ];
    const combinedEquation = `(${data.operands[0]} ${firstSymbol} ${data.operands[1]}) ${secondSymbol} ${data.operands[2]} = n`;
    return (
        <>
            <StoryHeader title="Write and solve an equation" instruction="Use the letter n for the unknown final value." />
            <StoryCard
                story={buildMultiStepStory(data.operands, data.operations)}
                question="What value of n represents the final number of items?"
            />
            <div className="mt-5 rounded-xl border-2 border-indigo-200 bg-indigo-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">Combined equation</div>
                <div className="mt-1 font-mono text-[1.65rem] font-extrabold text-indigo-950">{combinedEquation}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
                {stepEquations.map((equation, index) => (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center" key={equation}>
                        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Step {index + 1}</div>
                        <div className="mt-1 font-mono text-lg font-bold text-slate-800">{equation}</div>
                    </div>
                ))}
            </div>
            {isSolutionView ? (
                <AnswerCard>
                    <div className="font-mono text-xl">n = {data.answer}</div>
                    <div className="mt-1">The value of n is {data.answer}.</div>
                </AnswerCard>
            ) : (
                <AnswerCard><span className="font-mono text-emerald-700">n = ______</span></AnswerCard>
            )}
        </>
    );
}

function ReasonablenessProblem({data, isSolutionView}: {
    data: ArithmeticWordProblemReasonableness;
    isSolutionView: boolean;
}) {
    const firstSymbol = operationSymbol(data.operations[0]);
    const secondSymbol = operationSymbol(data.operations[1]);
    const exactEquations = [
        `${data.operands[0]} ${firstSymbol} ${data.operands[1]} = ${data.intermediate}`,
        `${data.intermediate} ${secondSymbol} ${data.operands[2]} = ${data.exactAnswer}`
    ];
    const roundingCheck = `${data.exactAnswer} rounds to ${data.roundedExactAnswer}; ${data.proposedAnswer} rounds to ${data.roundedProposedAnswer}.`;
    const reasonablenessExplanation = data.isReasonable
        ? 'The exact and proposed answers round to the same ten, so the proposal is reasonable.'
        : 'The exact and proposed answers round to different tens, so the proposal is not reasonable.';
    return (
        <>
            <StoryHeader title="Check answer reasonableness" instruction="Use the rounding check to evaluate the proposed result." />
            <StoryCard
                story={`${buildMultiStepStory(data.operands, data.operations)} A student says the final result is ${data.proposedAnswer}.`}
                question="Is the student’s answer reasonable? Explain using rounding."
            />
            <div className="mt-5 rounded-xl border-2 border-violet-200 bg-violet-50 px-5 py-4 text-center">
                <div className="text-xs font-bold uppercase tracking-wide text-violet-700">Round to the nearest ten</div>
                <div className="mt-1 text-lg font-extrabold text-violet-950">{roundingCheck}</div>
            </div>
            {isSolutionView ? (
                <>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        {exactEquations.map((equation, index) => (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center" key={equation}>
                                <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Exact step {index + 1}</div>
                                <div className="mt-1 font-mono text-lg font-bold text-slate-800">{equation}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-center text-base font-semibold text-amber-950">
                        {reasonablenessExplanation}
                    </div>
                    <AnswerCard>
                        {data.proposedAnswer} is {data.isReasonable ? 'a reasonable' : 'not a reasonable'} answer.
                    </AnswerCard>
                </>
            ) : (
                <AnswerCard><span className="text-emerald-700">Verdict: __________</span></AnswerCard>
            )}
        </>
    );
}

function renderProblem(
    data: ArithmeticWordProblemWithin100,
    config: ArithmeticWordProblemWithin100Config,
    isSolutionView: boolean,
    seed: number
) {
    if (!('kind' in data)) {
        validatePair(data);
        return <LegacyProblem data={data} config={config} isSolutionView={isSolutionView} />;
    }
    if (data.kind === 'two-step') {
        validateTwoStep(data);
        return <LegacyProblem data={data} config={config} isSolutionView={isSolutionView} />;
    }
    if (data.kind === 'interpreted-remainder') {
        validateRemainder(data);
        return <RemainderProblem data={data} isSolutionView={isSolutionView} seed={seed} />;
    }
    if (data.kind === 'letter-equation') {
        validateLetterEquation(data);
        return <LetterEquationProblem data={data} isSolutionView={isSolutionView} />;
    }
    if (data.kind === 'reasonableness') {
        validateReasonableness(data);
        return <ReasonablenessProblem data={data} isSolutionView={isSolutionView} />;
    }
    return fail('Unsupported word-problem discriminant.');
}

export const ArithmeticWordProblemWithin100View = ({
    config,
    payload
}: ArithmeticWordProblemWithin100ViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, []);
    if (config.expectedKind && (!('kind' in data) || data.kind !== config.expectedKind)) {
        fail(`Expected the ${config.expectedKind} mathematical payload.`);
    }
    if (config.invertProcedure && 'kind' in data) {
        fail('Procedure inversion requires the complete one-step pair relation.');
    }

    return (
        <div className="w-[780px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            {renderProblem(data, config, isSolutionView, payload.seed)}
        </div>
    );
};
