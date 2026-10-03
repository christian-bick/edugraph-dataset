import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionProduct} from '../fraction-product-helpers.ts';
import {FractionProductBody} from '../fraction-product-view.tsx';
import {FractionsProductWordProblemViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-product-word-problem';

export const FractionsProductWordProblemCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-product-word-problem'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'sharedWhole', 'operandForm', 'multiplier', 'quantity',
        'multiplierValue', 'quantityValue', 'product', 'context', 'partition'
    ]);
    if (!isValidFractionProduct(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fraction factors, measured quantity, and equal-part evidence must agree exactly.');
    }
    return <FractionProductBody data={data} isSolutionView={payload.isSolutionView} task="word-problem" />;
};

export const FractionsProductWordProblem = withConfig(FractionsProductWordProblemViewSchema, FractionsProductWordProblemCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-product-word-problem'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsProductWordProblem payload={payload} />);
    }
};
