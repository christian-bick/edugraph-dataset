import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionProduct} from '../fraction-product-helpers.ts';
import {FractionProductBody} from '../fraction-product-view.tsx';
import {FractionsProductPartitionInterpretationViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-product-partition-interpretation';

export const FractionsProductPartitionInterpretationCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-product-partition-interpretation'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'sharedWhole', 'operandForm', 'multiplier', 'quantity',
        'multiplierValue', 'quantityValue', 'product', 'context', 'partition'
    ]);
    if (!isValidFractionProduct(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction factors, measured quantity, and equal-part evidence must agree exactly.');
    }
    return <FractionProductBody data={data} isSolutionView={payload.isSolutionView} task="partition-interpretation" />;
};

export const FractionsProductPartitionInterpretation = withConfig(FractionsProductPartitionInterpretationViewSchema, FractionsProductPartitionInterpretationCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-product-partition-interpretation'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsProductPartitionInterpretation payload={payload} />);
    }
};
