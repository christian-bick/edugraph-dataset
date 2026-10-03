import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionScaleComparison} from '../fraction-scale-comparison-helpers.ts';
import {FractionScaleComparisonBody} from '../fraction-scale-comparison-view.tsx';
import {FractionsScalingComparisonViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-scaling-comparison';

export const FractionsScalingComparisonCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-scaling-comparison'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'reference', 'scaleFactor', 'product', 'relation',
        'onePart', 'partDifferenceCount', 'wholeNumberAnalogy'
    ]);
    if (!isValidFractionScaleComparison(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction factor, product, relation, and equal-part witnesses must agree exactly.');
    }
    return <FractionScaleComparisonBody data={data} task="comparison" isSolutionView={payload.isSolutionView} />;
};

export const FractionsScalingComparison = withConfig(FractionsScalingComparisonViewSchema, FractionsScalingComparisonCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-scaling-comparison'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsScalingComparison payload={payload} />);
    }
};
