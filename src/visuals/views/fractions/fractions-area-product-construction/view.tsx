import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionRectangleArea} from '../fraction-rectangle-area-helpers.ts';
import {FractionRectangleAreaBody} from '../fraction-rectangle-area-view.tsx';
import {FractionsAreaProductConstructionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-area-product-construction';

export const FractionsAreaProductConstructionCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-area-product-construction'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'linearUnit', 'squareUnit', 'outerRectangle', 'areaSquareUnits', 'tileGrid'
    ]);
    if (!isValidFractionRectangleArea(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fractional sides, square tiling, and exact areas must agree.');
    }
    return <FractionRectangleAreaBody data={data} task="product-construction" isSolutionView={payload.isSolutionView} />;
};

export const FractionsAreaProductConstruction = withConfig(FractionsAreaProductConstructionViewSchema, FractionsAreaProductConstructionCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-area-product-construction'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsAreaProductConstruction payload={payload} />);
    }
};
