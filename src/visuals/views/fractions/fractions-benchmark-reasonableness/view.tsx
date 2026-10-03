import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionBenchmark} from '../fraction-benchmark-helpers.ts';
import {FractionBenchmarkBody} from '../fraction-benchmark-view.tsx';
import {FractionsBenchmarkReasonablenessViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-benchmark-reasonableness';

export const FractionsBenchmarkReasonablenessCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-benchmark-reasonableness'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'operation', 'sharedWhole', 'first', 'second', 'exactResult', 'resultBounds', 'candidate'
    ]);
    if (!isValidFractionBenchmark(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction benchmarks and result evidence must agree exactly.');
    }
    return <FractionBenchmarkBody data={data} isSolutionView={payload.isSolutionView} task="reasonableness" />;
};

export const FractionsBenchmarkReasonableness = withConfig(FractionsBenchmarkReasonablenessViewSchema,
    FractionsBenchmarkReasonablenessCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-benchmark-reasonableness'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsBenchmarkReasonableness payload={payload} />);
    }
};
