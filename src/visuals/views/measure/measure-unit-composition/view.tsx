import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isUnitDimensionRelation} from '../measurement-ratio-presentation.ts';
import {UnitCompositionBody} from '../measurement-ratio-view.tsx';
import {MeasureUnitCompositionViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-unit-composition';

export const MeasureUnitCompositionCore = ({payload}: {
    payload: ViewRenderPayload<'measure-unit-composition'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'operation', 'left', 'right', 'result', 'unitFactors']);
    if (!isUnitDimensionRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'Exact quantity operations, raw unit factors, cancellation pairs, and physical dimensions must agree.');
    }
    return <UnitCompositionBody data={data} isSolutionView={payload.isSolutionView} />;
};

export const MeasureUnitComposition = withConfig(MeasureUnitCompositionViewSchema, MeasureUnitCompositionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-unit-composition'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureUnitComposition payload={payload} />);
};
