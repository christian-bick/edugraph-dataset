import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isValidFractionRectangleArea} from '../fraction-rectangle-area-helpers.ts';
import {FractionRectangleAreaBody} from '../fraction-rectangle-area-view.tsx';
import {FractionsRectangleAreaViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-rectangle-area';

export const FractionsRectangleAreaCore = ({payload}: {
    payload: ViewRenderPayload<'fractions-rectangle-area'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, [
        'kind', 'linearUnit', 'squareUnit', 'outerRectangle', 'areaSquareUnits', 'tileGrid'
    ]);
    if (!isValidFractionRectangleArea(data)) {
        throw new ViewValidationError(VIEW_ID, 'Fractional sides, square tiling, and exact areas must agree.');
    }
    return <FractionRectangleAreaBody data={data} task="area-execution" isSolutionView={payload.isSolutionView} />;
};

export const FractionsRectangleArea = withConfig(FractionsRectangleAreaViewSchema, FractionsRectangleAreaCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'fractions-rectangle-area'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsRectangleArea payload={payload} />);
    }
};
