import {createRoot} from 'react-dom/client';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {MultiDigitMultiplicationProblem} from '../../../../types/problems.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidMultiDigitMultiplicationProblem} from './helpers.ts';
import {
    OperationsMultiplicationAreaModelViewConfig,
    OperationsMultiplicationAreaModelViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

interface CoreProps {
    config: OperationsMultiplicationAreaModelViewConfig;
    payload: ViewRenderPayload<'operations-multiplication-area-model'>;
}

const AreaModelGrid = ({
    data,
    isSolutionView
}: {
    data: MultiDigitMultiplicationProblem;
    isSolutionView: boolean;
}) => {
    const columnCount = data.largestDecomposition.parts.length;

    return (
        <div
            className="grid overflow-hidden rounded-xl border-2 border-indigo-300 bg-white"
            style={{gridTemplateColumns: `132px repeat(${columnCount}, minmax(0, 1fr))`}}
            aria-label={`${data.smallestDecomposition.parts.length} by ${columnCount} place-value partial-product area model`}
        >
            <div className="flex min-h-[76px] items-center justify-center border-b-2 border-r-2 border-indigo-300 bg-indigo-700 text-3xl font-bold text-white">
                ×
            </div>
            {data.largestDecomposition.parts.map(part => (
                <div key={`column-${part.placeValue}`} className="flex min-h-[76px] flex-col items-center justify-center border-b-2 border-r border-indigo-300 bg-indigo-50 px-2 text-center last:border-r-0">
                    <div className="font-mono text-lg font-bold text-indigo-900">
                        {formatStandardNumeral(part.value)}
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {part.digit} {part.placeName}
                    </div>
                </div>
            ))}

            {data.smallestDecomposition.parts.map((rowPart, rowIndex) => (
                <div className="contents" key={`row-${rowPart.placeValue}`}>
                    <div className="flex min-h-[112px] flex-col items-center justify-center border-b border-r-2 border-indigo-300 bg-sky-50 px-2 text-center last:border-b-0">
                        <div className="font-mono text-lg font-bold text-sky-900">
                            {formatStandardNumeral(rowPart.value)}
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                            {rowPart.digit} {rowPart.placeName}
                        </div>
                    </div>
                    {data.largestDecomposition.parts.map((columnPart, columnIndex) => {
                        const partialProduct = data.partialProducts[
                            rowIndex * columnCount + columnIndex
                        ]!;
                        return (
                            <div
                                key={`${rowPart.placeValue}-${columnPart.placeValue}`}
                                className={`flex min-h-[112px] items-center justify-center border-b border-r border-indigo-200 px-2 text-center last:border-r-0 ${isSolutionView ? 'bg-emerald-50' : 'bg-white'}`}
                            >
                                <div>
                                    <div className={`font-mono text-[0.92rem] font-bold leading-snug ${isSolutionView ? 'text-emerald-900' : 'text-slate-700'}`}>
                                        {isSolutionView
                                            ? partialProduct.solutionEquation
                                            : partialProduct.questionEquation}
                                    </div>
                                    <div className={`mx-auto mt-2 h-1 w-12 rounded-full ${isSolutionView ? 'bg-emerald-400' : 'bg-indigo-200'}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const OperationsMultiplicationAreaModelCore = ({config: _config, payload}: CoreProps) => {
    const {problem, isSolutionView} = payload;
    const data = problem.data;
    validateProblemData('operations-multiplication-area-model', data, [
        'task',
        'largestOperand',
        'smallestOperand',
        'largestOperandDigits',
        'smallestOperandDigits',
        'largestDecomposition',
        'smallestDecomposition',
        'partialProducts',
        'product',
        'prompt',
        'questionEquation',
        'solutionEquation',
        'partialProductsSumEquation',
        'explanation'
    ]);
    if (!isValidMultiDigitMultiplicationProblem(data)) {
        throw new ViewValidationError(
            'operations-multiplication-area-model',
            'The operands, decompositions, partial products, and authored equations must agree.'
        );
    }

    return (
        <div className="w-[920px] rounded-2xl bg-white p-7 font-sans shadow-[0_10px_32px_rgba(15,23,42,0.08)]">
            <div className="text-center">
                <div className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-700">
                    Place-value area model
                </div>
                <div className="mt-1 text-xl font-bold text-slate-800">{data.prompt}</div>
                <div className={`mx-auto mt-3 w-fit rounded-lg border-2 px-6 py-2 font-mono text-2xl font-bold ${isSolutionView ? 'border-emerald-400 bg-emerald-50 text-emerald-900' : 'border-dashed border-slate-300 text-slate-700'}`}>
                    {isSolutionView ? data.solutionEquation : data.questionEquation}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                        Column factor decomposition
                    </div>
                    <div className="mt-1 font-mono text-[1rem] font-bold text-indigo-950">
                        {data.largestDecomposition.equation}
                    </div>
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
                    <div className="text-xs font-bold uppercase tracking-wide text-sky-700">
                        Row factor decomposition
                    </div>
                    <div className="mt-1 font-mono text-[1rem] font-bold text-sky-950">
                        {data.smallestDecomposition.equation}
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <AreaModelGrid data={data} isSolutionView={isSolutionView} />
            </div>

            {isSolutionView ? (
                <div className="mt-4 rounded-xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 text-center text-emerald-950">
                    <div className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        Add all partial products
                    </div>
                    <div className="mt-1 font-mono text-lg font-bold">
                        {data.partialProductsSumEquation}
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-relaxed text-emerald-900">
                        {data.explanation}
                    </div>
                </div>
            ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-500">
                    Complete every place-value region, then add the partial products.
                </div>
            )}
        </div>
    );
};

export const OperationsMultiplicationAreaModel = withConfig(
    OperationsMultiplicationAreaModelViewSchema,
    OperationsMultiplicationAreaModelCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'operations-multiplication-area-model'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<OperationsMultiplicationAreaModel payload={payload} />);
    }
};
