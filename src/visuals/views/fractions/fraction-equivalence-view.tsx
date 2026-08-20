import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {
    FractionEquivalenceProblem,
    FractionValue,
    ProperFractionEquivalenceProblem
} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    isValidTenthsToHundredthsProblem,
    TenthsToHundredthsModel
} from './tenths-hundredths-grid.tsx';

const DENOMINATORS = [2, 3, 4, 6, 8];

export type FractionEquivalenceMode = 'classification' | 'formalization' | 'explanation';

interface FractionEquivalenceViewProps {
    mode: FractionEquivalenceMode;
    payload: RenderPayload<AbstractProblem<FractionEquivalenceProblem>>;
    viewId: string;
}

interface FractionNotationProps {
    numerator: number | '?';
    denominator: number;
}

const FractionNotation = ({numerator, denominator}: FractionNotationProps) => (
    <span className="inline-grid min-w-[2.2rem] grid-rows-2 text-center align-middle text-[1.35rem] font-bold leading-[1.05] text-slate-800">
        <span className="border-b-2 border-slate-700 px-1 pb-0.5">{numerator}</span>
        <span className="px-1 pt-0.5">{denominator}</span>
    </span>
);

const FractionBar = ({fraction}: {fraction: FractionValue}) => (
    <div
        className="grid h-[70px] w-[650px] overflow-hidden rounded-lg border-[3px] border-slate-700 bg-white"
        style={{gridTemplateColumns: `repeat(${fraction.denominator}, minmax(0, 1fr))`}}
        aria-label={`${fraction.numerator} of ${fraction.denominator} equal parts shaded`}
    >
        {Array.from({length: fraction.denominator}, (_, index) => (
            <div
                key={index}
                className={`${index < fraction.numerator ? 'bg-blue-500' : 'bg-white'} ${
                    index > 0 ? 'border-l-2 border-slate-600' : ''
                }`}
            />
        ))}
    </div>
);

const validateFraction = (viewId: string, name: string, fraction: FractionValue) => {
    if (!fraction || typeof fraction !== 'object') {
        throw new ViewValidationError(viewId, `${name} fraction is missing.`);
    }
    if (!Number.isInteger(fraction.numerator)
        || fraction.numerator < 1
        || !Number.isInteger(fraction.denominator)
        || !DENOMINATORS.includes(fraction.denominator)
        || fraction.numerator > fraction.denominator) {
        throw new ViewValidationError(viewId, `${name} fraction cannot be rendered as a portion of one whole.`);
    }
    if (fraction.notation !== `${fraction.numerator}/${fraction.denominator}`) {
        throw new ViewValidationError(viewId, `${name} fraction notation is inconsistent.`);
    }
};

const equivalenceExplanation = (data: ProperFractionEquivalenceProblem): string =>
    `${data.first.notation} is equivalent to ${data.second.notation} because its numerator and denominator are multiplied by ${data.scaleFactor}.`;

export const FractionEquivalenceView = ({mode, payload, viewId}: FractionEquivalenceViewProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    if (data.task === 'tenths-to-hundredths') {
        validateProblemData(viewId, data, [
            'task',
            'tenths',
            'hundredths',
            'scaleFactor',
            'sharedWhole',
            'numeratorScale',
            'denominatorScale',
            'models',
            'relation',
            'equation'
        ]);
        if (!isValidTenthsToHundredthsProblem(data)) {
            throw new ViewValidationError(
                viewId,
                'Tenths-to-hundredths data must contain one coherent shared whole, ×10 scaling, and equality.'
            );
        }
        const formalizationOnly = mode === 'formalization';
        const explainsProcedure = mode === 'explanation';
        if (!formalizationOnly && !explainsProcedure) {
            throw new ViewValidationError(
                viewId,
                'Base-ten equivalence requires Formalization, optionally with ProcedureUnderstanding.'
            );
        }
        return (
            <TenthsToHundredthsModel
                data={data}
                isSolutionView={isSolutionView}
                explainScaling={explainsProcedure}
            />
        );
    }
    validateProblemData(viewId, data, [
        'task',
        'first',
        'second',
        'scaleFactor',
        'relation',
        'equation'
    ]);

    if (data.task !== 'relate-equivalent-fractions') {
        throw new ViewValidationError(viewId, 'Expected a proper-fraction equivalence relation.');
    }
    validateFraction(viewId, 'First', data.first);
    validateFraction(viewId, 'Second', data.second);
    if ((data.scaleFactor !== 2 && data.scaleFactor !== 3 && data.scaleFactor !== 4)
        || data.second.numerator !== data.first.numerator * data.scaleFactor
        || data.second.denominator !== data.first.denominator * data.scaleFactor) {
        throw new ViewValidationError(viewId, 'The second fraction must scale both terms of the first by the declared factor.');
    }
    if (data.relation !== 'equal'
        || data.equation !== `${data.first.notation} = ${data.second.notation}`) {
        throw new ViewValidationError(viewId, 'The equivalence relation and equation are inconsistent.');
    }

    const isClassification = mode === 'classification';
    const formalizationOnly = mode === 'formalization';
    const explainsProcedure = mode === 'explanation';
    const requestsCompletion = formalizationOnly || explainsProcedure;
    if (!isClassification && !requestsCompletion) {
        throw new ViewValidationError(
            viewId,
            'Proper-fraction equivalence requires ConceptClassification or Formalization, optionally with ProcedureUnderstanding.'
        );
    }

    const secondNumerator = requestsCompletion && !isSolutionView ? '?' : data.second.numerator;
    const prompt = isClassification
        ? 'Are these fractions equivalent?'
        : explainsProcedure
            ? 'Complete the equivalent fraction. Then explain why the value stays the same.'
            : 'Complete the equivalent fraction.';

    return (
        <div className="w-[900px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.5rem] font-bold text-slate-800">{prompt}</div>
            <div className="mt-6 space-y-6">
                <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">First</span>
                        <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                    </div>
                    <FractionBar fraction={data.first} />
                </div>

                <div className="grid grid-cols-[120px_1fr] items-center gap-5">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Second</span>
                        <FractionNotation numerator={secondNumerator} denominator={data.second.denominator} />
                    </div>
                    <FractionBar fraction={data.second} />
                </div>
            </div>

            <div className={`mt-7 rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="flex items-center justify-center gap-3 text-xl font-bold">
                            <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                            <span>=</span>
                            <FractionNotation numerator={data.second.numerator} denominator={data.second.denominator} />
                        </div>
                        {requestsCompletion && (
                            <div className="mt-3 font-mono text-sm font-extrabold">
                                Scale both terms by {data.scaleFactor}: {data.first.numerator} × {data.scaleFactor} = {data.second.numerator}; {data.first.denominator} × {data.scaleFactor} = {data.second.denominator}
                            </div>
                        )}
                        <div className="mt-3 text-[1.05rem] font-semibold">
                            {explainsProcedure
                                ? equivalenceExplanation(data)
                                : isClassification
                                    ? 'The two fractions are equivalent.'
                                    : `The missing numerator is ${data.second.numerator}.`}
                        </div>
                    </>
                ) : requestsCompletion ? (
                    <>
                        <div className="flex items-center justify-center gap-3 text-xl font-bold">
                            <FractionNotation numerator={data.first.numerator} denominator={data.first.denominator} />
                            <span>=</span>
                            <FractionNotation numerator="?" denominator={data.second.denominator} />
                        </div>
                        <div className="mt-3 font-mono text-sm font-extrabold">
                            {data.first.numerator} × {data.scaleFactor} = ?; {data.first.denominator} × {data.scaleFactor} = {data.second.denominator}
                        </div>
                    </>
                ) : (
                    <div className="text-xl font-bold">Equivalent or not equivalent?</div>
                )}
            </div>
        </div>
    );
};
