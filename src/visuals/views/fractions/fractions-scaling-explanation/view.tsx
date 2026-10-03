import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionScaleComparison} from '../fraction-scale-comparison-helpers.ts';
import {FractionScaleComparisonBody} from '../fraction-scale-comparison-view.tsx';
import {FractionsScalingExplanationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-scaling-explanation';

export const FractionsScalingExplanationCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-scaling-explanation'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'reference', 'scaleFactor', 'product', 'relation',
        'onePart', 'partDifferenceCount', 'wholeNumberAnalogy'
    ]);
    if (!isValidFractionScaleComparison(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction factor, product, relation, and equal-part witnesses must agree exactly.');
    }
    return <FractionScaleComparisonBody data={data} task="explanation" isSolutionView={payload.isSolutionView} />;
};

export const FractionsScalingExplanation = withConfig(FractionsScalingExplanationViewSchema, FractionsScalingExplanationCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-scaling-explanation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsScalingExplanation payload={payload} />);
    }
};
