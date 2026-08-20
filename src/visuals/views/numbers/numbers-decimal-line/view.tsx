import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {DecimalScale} from '../decimal-notation-components.tsx';
import {validateDecimalNotationData} from '../decimal-notation-helpers.ts';
import {
    NumbersDecimalLineViewConfig,
    NumbersDecimalLineViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'numbers-decimal-line';

interface CoreProps {
    config: NumbersDecimalLineViewConfig;
    payload: ViewRenderPayload<'numbers-decimal-line'>;
}

export const NumbersDecimalLineCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateDecimalNotationData(VIEW_ID, data);
    const line = data.numberLine;

    return (
        <div className="w-[930px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_34px_rgba(15,23,42,0.08)]">
            <div className="text-center text-[1.48rem] font-extrabold text-slate-800">
                {line.prompt}
            </div>
            <div className="mt-2 text-center text-sm font-bold text-slate-500">
                Use the supplied {line.subdivisionCount === 10 ? 'tenths' : 'hundredths'} scale from 0 to 1.
            </div>

            <div className="mt-7">
                <DecimalScale
                    ticks={line.ticks}
                    ariaLabel={isSolutionView
                        ? `A number line from 0 to 1 divided into ${line.subdivisionCount} equal intervals, with ${line.point.label} marked at supplied tick ${line.point.tickIndex}.`
                        : `A number line from 0 to 1 divided into ${line.subdivisionCount} equal intervals. The point requested by the prompt is not plotted or located.`}
                    marker={isSolutionView ? {
                        xPercent: line.point.xPercent,
                        label: line.point.label
                    } : null}
                    measuredSegment={null}
                    unitSymbol={null}
                    showInteriorLabels={false}
                />
            </div>

            <div className={`mt-5 min-h-[108px] rounded-xl border-2 px-5 py-4 text-center ${
                isSolutionView
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950'
                    : 'border-dashed border-slate-300 bg-slate-50 text-slate-500'
            }`}>
                {isSolutionView ? (
                    <>
                        <div className="text-lg font-extrabold">{line.answerStatement}</div>
                        <div className="mt-2 text-sm font-semibold leading-snug">{line.explanation}</div>
                    </>
                ) : (
                    <div className="flex min-h-[74px] items-center justify-center font-bold">
                        Plot and label the requested decimal on the scale.
                    </div>
                )}
            </div>
        </div>
    );
};

export const NumbersDecimalLine = withConfig(
    NumbersDecimalLineViewSchema,
    NumbersDecimalLineCore
);

let root: ReturnType<typeof createRoot> | null = null;

if (typeof window !== 'undefined') {
    window.renderView = (payload: ViewRenderPayload<'numbers-decimal-line'>) => {
        const container = document.getElementById('view');
        if (container) {
            if (!root) root = createRoot(container);
            root.render(<NumbersDecimalLine payload={payload} />);
        }
    };
}
