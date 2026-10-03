import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionBenchmark} from '../fraction-benchmark-helpers.ts';
import {FractionBenchmarkBody} from '../fraction-benchmark-view.tsx';
import {FractionsBenchmarkEstimateViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-benchmark-estimate';

export const FractionsBenchmarkEstimateCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-benchmark-estimate'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'operation', 'sharedWhole', 'first', 'second', 'exactResult', 'resultBounds', 'candidate'
    ]);
    if (!isValidFractionBenchmark(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction benchmarks and result evidence must agree exactly.');
    }
    return <FractionBenchmarkBody data={data} isSolutionView={payload.isSolutionView} task="estimate" />;
};

export const FractionsBenchmarkEstimate = withConfig(FractionsBenchmarkEstimateViewSchema, FractionsBenchmarkEstimateCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-benchmark-estimate'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsBenchmarkEstimate payload={payload} />);
    }
};
