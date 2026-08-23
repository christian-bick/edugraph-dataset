import {AbstractProblem, RenderPayload} from '../../../types/ml-engine.ts';
import {FractionArithmeticProblem} from '../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../helpers/validation.ts';
import {
    FractionArithmeticText,
    FractionArithmeticWork
} from './fraction-arithmetic-components.tsx';
import {isValidFractionArithmeticProblem} from './fraction-arithmetic-helpers.ts';
import {
    FractionArithmeticPresentationProblem,
    FractionArithmeticPresentation,
    presentFractionArithmeticProblem
} from './fraction-arithmetic-presentation.ts';

export type FractionArithmeticLayout = 'model' | 'word';

interface FractionArithmeticViewProps {
    layout: FractionArithmeticLayout;
    payload: RenderPayload<AbstractProblem<FractionArithmeticProblem>>;
    presentation: FractionArithmeticPresentation;
    viewId: string;
}

const validateData = (viewId: string, data: FractionArithmeticProblem) => {
    validateProblemData(viewId, data, [
        'task',
        'operation',
        'denominator',
        'sharedWhole',
        'referenceId'
    ]);
    if (data.task === 'tenths-hundredths-addition') {
        validateProblemData(viewId, data, [
            'firstTenths',
            'secondHundredths',
            'convertedFirst',
            'result',
            'conversionFactor'
        ]);
    } else if (data.task === 'unit-fraction-multiple') {
        validateProblemData(viewId, data, [
            'wholeFactor',
            'unitFraction',
            'product'
        ]);
    } else if (data.task === 'whole-number-fraction-product') {
        validateProblemData(viewId, data, ['wholeFactor', 'fractionFactor', 'product']);
    } else if (data.task === 'fraction-operation') {
        validateProblemData(viewId, data, [
            'first',
            'second',
            'result'
        ]);
    } else if (data.task === 'decompose') {
        validateProblemData(viewId, data, ['source', 'decompositions']);
    } else if (data.task === 'mixed-operation') {
        validateProblemData(viewId, data, ['first', 'second', 'result']);
    }
    if (!isValidFractionArithmeticProblem(data)) {
        throw new ViewValidationError(
            viewId,
            'The canonical same-whole fraction values and mathematical relations must agree exactly.'
        );
    }
};

const AnswerPanel = ({
    data,
    isSolutionView,
    wordLayout
}: {
    data: FractionArithmeticPresentationProblem;
    isSolutionView: boolean;
    wordLayout: boolean;
}) => (
    <div className={`mt-5 min-h-[88px] rounded-xl border-2 px-5 py-4 text-center ${
        isSolutionView
            ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
            : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
    }`}>
        {isSolutionView ? (
            <>
                <div className="text-lg font-extrabold">
                    <FractionArithmeticText text={data.answerStatement} />
                </div>
                <div className="mt-1 text-sm font-semibold leading-snug">
                    <FractionArithmeticText text={data.explanation} />
                </div>
            </>
        ) : (
            <div className="flex min-h-[54px] items-center justify-center text-base font-bold">
                {wordLayout ? 'Show' : 'Complete'} the missing {data.story.unknownRole === 'operation'
                    ? 'operation and equation'
                    : data.story.unknownRole === 'decompositions'
                        ? 'decompositions'
                        : data.story.unknownRole === 'multiplier'
                            ? 'multiplier'
                            : wordLayout
                                ? `result (${data.story.unitLabel})`
                                : 'result'}.
            </div>
        )}
    </div>
);

export const FractionArithmeticView = ({
    layout,
    payload,
    presentation,
    viewId
}: FractionArithmeticViewProps) => {
    const {problem, isSolutionView} = payload;
    validateData(viewId, problem.data);
    const data = presentFractionArithmeticProblem(problem.data, presentation);
    if (!data) {
        throw new ViewValidationError(
            viewId,
            `The ${presentation} view does not support the generated arithmetic route.`
        );
    }
    const wordLayout = layout === 'word';

    return (
        <div className="w-[980px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            {wordLayout ? (
                <div className="rounded-2xl border-l-[6px] border-sky-600 bg-sky-50 px-6 py-5 text-slate-800">
                    <div className="text-lg font-bold leading-relaxed">
                        <FractionArithmeticText text={data.story.context} />
                    </div>
                    <div className="mt-2 text-[1.25rem] font-extrabold leading-snug text-sky-950">
                        <FractionArithmeticText text={data.story.question} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                        <span className="rounded-full bg-white px-3 py-1">Shared whole: {data.story.wholeLabel}</span>
                        <span className="rounded-full bg-white px-3 py-1">Unit: {data.story.unitLabel}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="text-center text-[1.4rem] font-extrabold leading-snug text-slate-800">
                        <FractionArithmeticText text={data.prompt} />
                    </div>
                    <div className="mt-3 text-center text-sm font-bold text-slate-500">
                        {data.task === 'tenths-hundredths-addition'
                            ? `Both grids represent ${data.story.wholeLabel}, shown first in tenths and then in hundredths.`
                            : `Every frame represents ${data.story.wholeLabel} divided into ${data.denominator} equal parts.`}
                    </div>
                </>
            )}

            <div className="mt-5">
                <FractionArithmeticWork data={data} isSolutionView={isSolutionView} />
            </div>

            <AnswerPanel
                data={data}
                isSolutionView={isSolutionView}
                wordLayout={wordLayout}
            />
        </div>
    );
};
