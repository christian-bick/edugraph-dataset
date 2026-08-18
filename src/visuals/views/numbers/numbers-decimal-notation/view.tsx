import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {TenthsHundredthsGrid} from '../../../components/TenthsHundredthsGrid.tsx';
import {withConfig} from '../../withConfig.tsx';
import {PlaceValueTable} from '../decimal-notation-components.tsx';
import {validateDecimalNotationData} from '../decimal-notation-helpers.ts';
import {
    NumbersDecimalNotationViewConfig,
    NumbersDecimalNotationViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-notation';

interface CoreProps {
    config: NumbersDecimalNotationViewConfig;
    payload: ViewRenderPayload<'numbers-decimal-notation'>;
}

export const NumbersDecimalNotationCore = ({config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateDecimalNotationData(VIEW_ID, data);

    const fractionToDecimal = config.conversionDirection === 'fraction-to-decimal';
    const task = fractionToDecimal
        ? data.notationTasks.fractionToDecimal
        : data.notationTasks.decimalToFraction;
    const revealDigits = isSolutionView || !fractionToDecimal;

    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-extrabold text-slate-800">
                {task.prompt}
            </div>
            <div className="mt-2 text-center font-mono text-xl font-black text-blue-800">
                {isSolutionView ? task.solutionEquation : task.questionEquation}
            </div>

            <div className="mt-6 grid grid-cols-2 items-stretch gap-5">
                <TenthsHundredthsGrid
                    model={data.models.fractionGrid}
                    title="One shared whole"
                    ariaLabel={fractionToDecimal
                        ? `${data.value.fractionNotation} is shown as shaded equal parts of one shared whole; its decimal notation is withheld.`
                        : isSolutionView
                            ? `${data.value.fractionNotation} is shown as equal shaded parts of the same whole.`
                            : `A shared whole is partitioned to match the given decimal ${data.value.decimalNotation}; the requested fraction numerator is not stated.`}
                    showDisplay={isSolutionView || fractionToDecimal}
                />
                <div className="flex flex-col justify-center rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 text-center text-sm font-extrabold uppercase tracking-[0.08em] text-slate-600">
                        Decimal place value
                    </div>
                    <PlaceValueTable
                        columns={data.placeValue.columns}
                        revealDigits={revealDigits}
                        showUnitFractions={isSolutionView || fractionToDecimal}
                        ariaLabel={revealDigits
                            ? `The decimal place-value columns show ${data.value.wholeDigit} ones, ${data.value.tenthsDigit} tenths, and ${data.value.hundredthsDigit ?? 0} hundredths.`
                            : 'The ones, tenths, and hundredths columns are shown, but the requested decimal digits are withheld.'}
                    />
                    {isSolutionView && (
                        <div className="mt-3 text-center font-mono text-sm font-bold text-slate-700">
                            {data.placeValue.placeValueEquation}
                        </div>
                    )}
                </div>
            </div>

            <div className={`mt-5 min-h-[112px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-extrabold">{task.answerStatement}</div>
                        <div className="mt-2 text-sm font-semibold leading-snug">{task.explanation}</div>
                    </>
                ) : (
                    <div className="flex min-h-[78px] items-center justify-center font-mono text-lg font-bold">
                        {task.questionEquation}
                    </div>
                )}
            </div>
        </div>
    );
};

export const NumbersDecimalNotation = withConfig(
    NumbersDecimalNotationViewSchema,
    NumbersDecimalNotationCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'numbers-decimal-notation'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<NumbersDecimalNotation payload={payload} />);
        }
    };
}
