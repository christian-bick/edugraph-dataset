import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {DecimalScale} from '../decimal-notation-components.tsx';
import {validateDecimalNotationData} from '../decimal-notation-helpers.ts';
import {
    NumbersDecimalMeasurementViewConfig,
    NumbersDecimalMeasurementViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-measurement';

interface CoreProps {
    config: NumbersDecimalMeasurementViewConfig;
    payload: ViewRenderPayload<'numbers-decimal-measurement'>;
}

export const NumbersDecimalMeasurementCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateDecimalNotationData(VIEW_ID, data);
    const measurement = data.measurement;

    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.45rem] font-extrabold text-slate-800">
                {measurement.prompt}
            </div>
            <div className="mt-2 text-center font-mono text-xl font-black text-blue-800">
                {isSolutionView ? measurement.solutionEquation : measurement.questionEquation}
            </div>

            <div className="mt-6">
                <DecimalScale
                    ticks={measurement.ticks}
                    ariaLabel={isSolutionView
                        ? `A one-meter scale divided into ${measurement.subdivisionCount} equal parts. The measured segment ends at supplied tick ${measurement.measuredEndpoint.tickIndex}, labeled ${measurement.decimalMeasure}.`
                        : `A one-meter scale divided into ${measurement.subdivisionCount} equal parts. The measured segment ends at tick ${measurement.measuredEndpoint.tickIndex}, matching the given ${measurement.fractionalMeasure}; its decimal notation is withheld.`}
                    marker={{
                        xPercent: measurement.measuredEndpoint.xPercent,
                        label: isSolutionView ? measurement.decimalMeasure : null
                    }}
                    measuredSegment={{xPercent: measurement.measuredEndpoint.xPercent}}
                    unitSymbol={measurement.unitSymbol}
                    showInteriorLabels={isSolutionView}
                />
            </div>

            <div className={`mt-5 min-h-[110px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-extrabold">{measurement.answerStatement}</div>
                        <div className="mt-2 text-sm font-semibold leading-snug">{measurement.explanation}</div>
                    </>
                ) : (
                    <div className="flex min-h-[76px] items-center justify-center font-mono text-lg font-bold">
                        {measurement.questionEquation}
                    </div>
                )}
            </div>
        </div>
    );
};

export const NumbersDecimalMeasurement = withConfig(
    NumbersDecimalMeasurementViewSchema,
    NumbersDecimalMeasurementCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'numbers-decimal-measurement'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<NumbersDecimalMeasurement payload={payload} />);
        }
    };
}
