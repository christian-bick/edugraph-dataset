import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {StandardUnitEquivalencesProblem} from '../../../../types/problems.ts';
import {
    capitalize,
    formatFactorInstruction,
    formatMeasurementEquation,
    getMeasurementUnitPresentation
} from '../../../helpers/measurement-conversion.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {formatTableValue, hasCoherentConversionTable} from './helpers.ts';
import {
    MeasureConversionTableViewConfig,
    MeasureConversionTableViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-conversion-table';

function assertConversionTable(
    data: StandardUnitEquivalencesProblem
): void {
    validateProblemData(VIEW_ID, data, ['pair', 'equivalents']);
    if (!hasCoherentConversionTable(data)) {
        throw new ViewValidationError(
            VIEW_ID,
            'Expected five coherent equivalent measurements for the named unit pair.'
        );
    }
}

interface CoreProps {
    config: MeasureConversionTableViewConfig;
    payload: ViewRenderPayload<'measure-conversion-table'>;
}

function ConversionTable({data, isSolutionView}: {
    data: StandardUnitEquivalencesProblem;
    isSolutionView: boolean;
}) {
    const hiddenIndices = new Set([3, 4]);
    const largerUnit = getMeasurementUnitPresentation(data.pair.largerUnit);
    const smallerUnit = getMeasurementUnitPresentation(data.pair.smallerUnit);
    const columnHeaders = [
        `${capitalize(largerUnit.plural)} (${largerUnit.symbol})`,
        `${capitalize(smallerUnit.plural)} (${smallerUnit.symbol})`
    ];
    return (
        <div className="mt-5 overflow-hidden rounded-2xl border-2 border-indigo-200 bg-white">
            <div className="grid grid-cols-2 bg-indigo-700 text-white">
                {columnHeaders.map((header, index) => (
                    <div
                        className={`px-5 py-4 text-center text-sm font-extrabold uppercase tracking-wide ${index === 1 ? 'border-l border-indigo-400' : ''}`}
                        key={header}
                    >
                        {header}
                    </div>
                ))}
            </div>
            {data.equivalents.map((row, index) => {
                const withhold = !isSolutionView && hiddenIndices.has(index);
                const revealedAnswer = isSolutionView && hiddenIndices.has(index);
                return (
                    <div className="grid min-h-[68px] grid-cols-2 border-t border-indigo-100" key={`${row.largerValue}-${index}`}>
                        <div className="flex items-center justify-center bg-slate-50 px-5 font-mono text-xl font-bold text-slate-900">
                            {formatTableValue(row.largerValue)}
                            <span className="ml-2 font-sans text-sm font-semibold text-slate-500">{largerUnit.symbol}</span>
                        </div>
                        <div className={`flex items-center justify-center border-l border-indigo-100 px-5 ${withhold ? 'bg-amber-50' : revealedAnswer ? 'bg-emerald-50' : 'bg-white'}`}>
                            {withhold ? (
                                <div className="flex min-h-11 min-w-[150px] items-center justify-center rounded-xl border-2 border-dashed border-amber-500 bg-white text-sm font-bold text-amber-700">
                                    Write {smallerUnit.symbol}
                                </div>
                            ) : (
                                <div className={`font-mono text-xl font-bold ${revealedAnswer ? 'text-emerald-800' : 'text-slate-900'}`}>
                                    {formatTableValue(row.smallerValue)}
                                    <span className="ml-2 font-sans text-sm font-semibold text-slate-500">{smallerUnit.symbol}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const MeasureConversionTableCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    assertConversionTable(data);
    const largerUnit = getMeasurementUnitPresentation(data.pair.largerUnit);
    const smallerUnit = getMeasurementUnitPresentation(data.pair.smallerUnit);
    const finalRow = data.equivalents.at(-1)!;
    const finalEquation = formatMeasurementEquation(
        finalRow.largerValue,
        finalRow.smallerValue,
        data.pair
    );

    return (
        <div className="w-[760px] rounded-3xl bg-white p-7 font-sans shadow-[0_12px_36px_rgba(15,23,42,0.09)]">
            <div className="text-center text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-700">
                Record equivalent measurements
            </div>
            <div className="mx-auto mt-2 max-w-[650px] text-center text-xl font-bold leading-relaxed text-slate-900">
                Complete the two-column conversion table from {largerUnit.plural} to {smallerUnit.plural}.
            </div>

            <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-center">
                <span className="text-xs font-extrabold uppercase tracking-wide text-violet-700">Constant factor</span>
                <span className="font-semibold text-violet-950">
                    {formatFactorInstruction(data.pair)}
                </span>
            </div>

            <ConversionTable data={data} isSolutionView={isSolutionView} />

            <div className={`mt-5 min-h-[60px] rounded-xl border-2 px-5 py-4 text-center font-semibold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-950' : 'border-dashed border-indigo-300 bg-indigo-50 text-indigo-900'}`}>
                {isSolutionView
                    ? `Each ${smallerUnit.singular} value equals its ${largerUnit.singular} value multiplied by ${formatTableValue(data.pair.factor)}. For example, ${finalEquation}.`
                    : `Complete the 2 blank entries in the ${smallerUnit.plural} column.`}
            </div>
        </div>
    );
};

export const MeasureConversionTable = withConfig(
    MeasureConversionTableViewSchema,
    MeasureConversionTableCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'measure-conversion-table'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureConversionTable payload={payload} />);
};
