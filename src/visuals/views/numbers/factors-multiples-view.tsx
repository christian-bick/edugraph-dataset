import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    FactorClassificationProblem,
    FactorMultipleRelationsProblem,
    FactorPairsProblem,
    OneDigitMultipleTestProblem,
    PositiveFactorEvidence
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {hasCompletePositiveFactorEvidence} from './factors-multiples-helpers.ts';

interface NumbersFactorsMultiplesViewProps {
    expectedKinds: readonly FactorMultipleRelationsProblem['kind'][];
    payload: RenderPayload<AbstractProblem<FactorMultipleRelationsProblem>>;
}

const VIEW_ID = 'numbers-factors-multiples';

function fail(message: string): never {
    throw new ViewValidationError(VIEW_ID, message);
}

function assertPositiveIntegers(values: readonly number[], message: string) {
    if (values.some(value => !Number.isInteger(value) || value < 1 || value >= 100)) fail(message);
}

const formatList = (values: readonly (number | string)[]): string => {
    if (values.length === 1) return `${values[0]}`;
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
};

function validateFactorEvidence(data: PositiveFactorEvidence) {
    validateProblemData(VIEW_ID, data, ['number', 'factors', 'factorCount', 'factorPairs']);
    if (!hasCompletePositiveFactorEvidence(data)) {
        fail('Factor evidence must list every positive factor in ascending order and every unique factor pair exactly once.');
    }
}

function validateFactorPairs(data: FactorPairsProblem) {
    validateProblemData(VIEW_ID, data, ['number', 'factors', 'factorCount', 'factorPairs']);
    validateFactorEvidence(data);
}

function validateMultipleTest(data: OneDigitMultipleTestProblem) {
    validateProblemData(VIEW_ID, data, [
        'candidate',
        'divisor',
        'quotient',
        'remainder',
        'isMultiple'
    ]);
    assertPositiveIntegers([data.candidate, data.divisor, data.quotient], 'Multiple-test values must be positive whole numbers below 100.');
    if (data.divisor > 9
        || data.remainder !== 0
        || data.isMultiple !== true
        || data.candidate !== data.divisor * data.quotient) {
        fail('The affirmative one-digit multiple evidence is mathematically inconsistent.');
    }
}

function validateClassification(data: FactorClassificationProblem) {
    validateProblemData(VIEW_ID, data, [
        'number',
        'factors',
        'factorCount',
        'factorPairs',
        'classification'
    ]);
    validateFactorEvidence(data);
    if (data.number === 1
        || (data.kind === 'prime-classification' && (data.classification !== 'prime' || data.factorCount !== 2))
        || (data.kind === 'composite-classification' && (data.classification !== 'composite' || data.factorCount <= 2))) {
        fail('The supplied prime or composite classification does not agree with its exhaustive factor evidence.');
    }
}

function NumberPrompt({eyebrow, prompt, number}: {eyebrow: string; prompt: string; number: number}) {
    return (
        <>
            <div className="text-center text-sm font-bold uppercase tracking-[0.16em] text-sky-700">{eyebrow}</div>
            <div className="mx-auto mt-3 max-w-[650px] text-center text-xl font-bold leading-relaxed text-slate-800">{prompt}</div>
            <div className="mx-auto mt-5 flex h-[104px] w-[150px] items-center justify-center rounded-2xl border-2 border-sky-300 bg-sky-50 font-mono text-[3rem] font-extrabold text-sky-950">
                {number}
            </div>
        </>
    );
}

function ResponseBlank({label}: {label: string}) {
    return (
        <div className="mt-6 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 px-6 py-5 text-center">
            <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">Your response</div>
            <div className="mt-3 text-lg font-bold text-emerald-900">{label}</div>
            <div className="mx-auto mt-4 h-px w-4/5 bg-emerald-300" />
        </div>
    );
}

function FactorEvidence({data}: {data: PositiveFactorEvidence}) {
    return (
        <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
                <div className="text-center text-xs font-bold uppercase tracking-wide text-indigo-700">
                    All positive factors · {data.factorCount} total
                </div>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {data.factors.map(factor => (
                        <div className="min-w-[44px] rounded-lg border border-indigo-200 bg-white px-3 py-2 text-center font-mono text-lg font-bold text-indigo-950" key={factor}>
                            {factor}
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
                <div className="text-center text-xs font-bold uppercase tracking-wide text-violet-700">Unique factor pairs</div>
                <div
                    className="mt-3 grid gap-3"
                    style={{gridTemplateColumns: data.factorPairs.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))'}}
                >
                    {data.factorPairs.map(pair => (
                        <div className="rounded-lg border border-violet-200 bg-white px-4 py-3 text-center font-mono text-lg font-bold text-violet-950" key={`${pair.lowerFactor}-${pair.upperFactor}`}>
                            {pair.equation}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Conclusion({children}: {children: React.ReactNode}) {
    return (
        <div className="mt-5 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-6 py-4 text-center text-lg font-bold text-emerald-950">
            {children}
        </div>
    );
}

function FactorPairsTask({data, isSolutionView}: {data: FactorPairsProblem; isSolutionView: boolean}) {
    return (
        <>
            <NumberPrompt
                eyebrow="Find every factor pair"
                prompt={`Find every positive factor pair of ${data.number}.`}
                number={data.number}
            />
            {isSolutionView ? (
                <>
                    <FactorEvidence data={data} />
                    <Conclusion>
                        The positive factor pairs of {data.number} are {formatList(
                            data.factorPairs.map(pair => `${pair.lowerFactor} × ${pair.upperFactor}`)
                        )}.
                    </Conclusion>
                </>
            ) : (
                <ResponseBlank label="List every factor pair exactly once." />
            )}
        </>
    );
}

function MultipleTestTask({data, isSolutionView}: {data: OneDigitMultipleTestProblem; isSolutionView: boolean}) {
    return (
        <>
            <NumberPrompt
                eyebrow="Test a multiple"
                prompt={`Is ${data.candidate} a multiple of ${data.divisor}?`}
                number={data.candidate}
            />
            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">Candidate</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-sky-950">{data.candidate}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                    <div className="text-xs font-bold uppercase tracking-wide text-amber-700">One-digit divisor</div>
                    <div className="mt-1 font-mono text-2xl font-bold text-amber-950">{data.divisor}</div>
                </div>
            </div>
            {isSolutionView ? (
                <>
                    <div className="mt-5 grid grid-cols-2 gap-4">
                        {[
                            `${data.divisor} × ${data.quotient} = ${data.candidate}`,
                            `${data.candidate} ÷ ${data.divisor} = ${data.quotient}`
                        ].map((equation, index) => (
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-4 text-center" key={equation}>
                                <div className="text-xs font-bold uppercase tracking-wide text-indigo-700">{index === 0 ? 'Factor evidence' : 'Division check'}</div>
                                <div className="mt-2 font-mono text-xl font-bold text-indigo-950">{equation}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center font-bold text-slate-800">
                            Quotient: <span className="font-mono text-lg">{data.quotient}</span>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center font-bold text-slate-800">
                            Remainder: <span className="font-mono text-lg">{data.remainder}</span>
                        </div>
                    </div>
                    <Conclusion>Yes. {data.candidate} is a multiple of {data.divisor}.</Conclusion>
                </>
            ) : (
                <ResponseBlank label={`Is ${data.candidate} a multiple of ${data.divisor}? Explain.`} />
            )}
        </>
    );
}

function ClassificationTask({data, isSolutionView}: {data: FactorClassificationProblem; isSolutionView: boolean}) {
    return (
        <>
            <NumberPrompt
                eyebrow="Prime or composite?"
                prompt={`Is ${data.number} prime or composite?`}
                number={data.number}
            />
            {isSolutionView ? (
                <>
                    <div className="mx-auto mt-5 w-fit rounded-full border-2 border-amber-300 bg-amber-50 px-8 py-3 text-center text-xl font-extrabold capitalize text-amber-950">
                        {data.classification}
                    </div>
                    <FactorEvidence data={data} />
                    <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-6 py-4 text-center text-base font-semibold leading-relaxed text-amber-950">
                        The complete list of positive factors of {data.number} is {formatList(data.factors)}. Because {data.number} has {data.classification === 'prime' ? 'exactly two' : 'more than two'} positive factors, it is {data.classification}.
                    </div>
                    <Conclusion>{data.number} is {data.classification}.</Conclusion>
                </>
            ) : (
                <ResponseBlank label="Classification: __________  Evidence: __________" />
            )}
        </>
    );
}

function renderTask(data: FactorMultipleRelationsProblem, isSolutionView: boolean) {
    if (data.kind === 'factor-pairs') {
        validateFactorPairs(data);
        return <FactorPairsTask data={data} isSolutionView={isSolutionView} />;
    }
    if (data.kind === 'one-digit-multiple-test') {
        validateMultipleTest(data);
        return <MultipleTestTask data={data} isSolutionView={isSolutionView} />;
    }
    if (data.kind === 'prime-classification' || data.kind === 'composite-classification') {
        validateClassification(data);
        return <ClassificationTask data={data} isSolutionView={isSolutionView} />;
    }
    return fail('Unsupported factor-and-multiple task kind.');
}

export const NumbersFactorsMultiplesView = ({expectedKinds, payload}: NumbersFactorsMultiplesViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData(VIEW_ID, data, ['kind']);
    if (!expectedKinds.includes(data.kind)) {
        fail(`Expected one of the following mathematical payloads: ${expectedKinds.join(', ')}.`);
    }

    return (
        <div className="w-[790px] rounded-2xl bg-white p-8 font-sans shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
            {renderTask(data, isSolutionView)}
        </div>
    );
};
