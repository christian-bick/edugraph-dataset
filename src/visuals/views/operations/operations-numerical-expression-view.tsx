import type {ViewRenderPayload} from '../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    describeNumericalExpression,
    expressionEvaluationSteps,
    formatNumericalExpression,
    formatWithoutGroups,
    hasExplicitGroup,
    validateNumericalExpression
} from './operations-numerical-expression-helpers.ts';

export type NumericalExpressionViewId =
    | 'operations-grouping-write'
    | 'operations-grouping-evaluate'
    | 'operations-numerical-expression-write'
    | 'operations-numerical-expression-interpretation';

export type NumericalExpressionMode =
    | 'grouping-write'
    | 'grouping-evaluate'
    | 'expression-write'
    | 'expression-interpretation';

interface Props {
    mode: NumericalExpressionMode;
    payload: ViewRenderPayload<NumericalExpressionViewId>;
    viewId: NumericalExpressionViewId;
}

const AnswerSpace = () => (
    <div className="mt-5 min-h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-white px-5 py-4 text-slate-400">
        Your response
    </div>
);

const Expression = ({children}: {children: string}) => (
    <div className="my-4 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-5 text-center text-3xl font-semibold tracking-wide text-slate-900">
        {children}
    </div>
);

/** Shared projection; each leaf fixes one learner action through its mode prop. */
export const OperationsNumericalExpressionView = ({mode, payload, viewId}: Props) => {
    const {problem, isSolutionView, seed} = payload;
    const data = problem.data;
    validateProblemData(viewId, data, ['expression']);
    validateNumericalExpression(viewId, data);
    const hasGroup = hasExplicitGroup(data.expression);
    if ((mode === 'grouping-write' || mode === 'grouping-evaluate')
        && !hasGroup) {
        throw new ViewValidationError(viewId, 'A grouping task requires an explicitly grouped expression.');
    }

    const expression = formatNumericalExpression(data.expression, seed);
    const description = describeNumericalExpression(data.expression);
    const title = mode === 'grouping-write' ? 'Add grouping symbols'
        : mode === 'grouping-evaluate' ? 'Evaluate a grouped expression'
            : mode === 'expression-write' ? 'Write a numerical expression'
                : 'Interpret a numerical expression';

    return <main
        className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-800 shadow-sm"
        style={{width: 680, maxWidth: '95vw'}}
    >
        <div className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">
            Numerical expressions
        </div>
        <h1 className="mb-6 text-2xl font-bold text-slate-900">{title}</h1>

        {mode === 'grouping-write' && <>
            <p className="text-lg leading-relaxed">
                Make <strong>{description}</strong>. Add grouping symbols to the number sequence so it follows that order.
            </p>
            <Expression>{formatWithoutGroups(data.expression)}</Expression>
            {isSolutionView
                ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="mb-2 text-sm font-semibold text-emerald-800">Expression with grouping</div>
                    <div className="text-2xl font-bold text-slate-900">{expression}</div>
                </div>
                : <AnswerSpace />}
        </>}

        {mode === 'grouping-evaluate' && <>
            <p className="text-lg">Find the value. Evaluate inside the grouping symbols first.</p>
            <Expression>{expression}</Expression>
            {isSolutionView
                ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="mb-3 text-sm font-semibold text-emerald-800">Calculation steps</div>
                    <ol className="space-y-2 pl-6">
                        {expressionEvaluationSteps(data.expression).map((step, index) =>
                            <li key={index} className="list-decimal text-lg">
                                <span className="mr-2 text-sm text-slate-500">
                                    {step.inGroup ? 'Inside grouping:' : 'Then:'}
                                </span>
                                <span className="font-semibold">{step.calculation}</span>
                            </li>)}
                    </ol>
                    <div className="mt-4 border-t border-emerald-200 pt-3 text-xl font-bold">
                        Value: {data.expression.value}
                    </div>
                </div>
                : <div className="mt-5 text-xl font-semibold">Value: <span className="ml-2 inline-block w-28 border-b-2 border-slate-400" /></div>}
        </>}

        {mode === 'expression-write' && <>
            <p className="text-lg leading-relaxed">Write a numerical expression for <strong>{description}</strong>. Do not find its value.</p>
            {isSolutionView
                ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="mb-2 text-sm font-semibold text-emerald-800">Numerical expression</div>
                    <div className="text-2xl font-bold text-slate-900">{expression}</div>
                </div>
                : <AnswerSpace />}
        </>}

        {mode === 'expression-interpretation' && <>
            <p className="text-lg">
                {data.multiplicativeComparison
                    ? 'Explain how the compared expression relates to the reference expression. Do not evaluate either one.'
                    : hasGroup
                        ? 'Explain what the operations and grouping mean. Do not evaluate the expression.'
                        : 'Explain what the operations mean. Do not evaluate the expression.'}
            </p>
            {data.multiplicativeComparison && <>
                <div className="mt-5 text-sm font-semibold text-slate-600">Reference expression</div>
                <Expression>{formatNumericalExpression(data.multiplicativeComparison.reference, seed)}</Expression>
                <div className="text-sm font-semibold text-slate-600">Compared expression</div>
            </>}
            <Expression>{expression}</Expression>
            {isSolutionView
                ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-lg leading-relaxed">
                    <div className="mb-2 text-sm font-semibold text-emerald-800">Meaning</div>
                    {data.multiplicativeComparison
                        ? <>This represents {data.multiplicativeComparison.factor} times {describeNumericalExpression(data.multiplicativeComparison.reference)}.
                            {hasGroup && <> The grouping symbols keep the reference expression together as one factor.</>}
                        </>
                        : <>This represents {description}.</>}
                </div>
                : <AnswerSpace />}
        </>}
    </main>;
};
