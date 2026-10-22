import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {validateProblemData, ViewValidationError} from '../../../helpers/validation.ts';
import {withConfig} from '../../withConfig.tsx';
import {isMeasurementRatioRelation} from '../measurement-ratio-presentation.ts';
import {MeasurementRatioConversionBody} from '../measurement-ratio-view.tsx';
import {MeasureRatioConversionViewSchema, type MeasureRatioConversionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measure-ratio-conversion';

export const MeasureRatioConversionCore = ({config, payload}: {
    config: MeasureRatioConversionViewConfig;
    payload: ViewRenderPayload<'measure-ratio-conversion'>;
}) => {
    const {data} = payload.problem;
    validateProblemData(VIEW_ID, data, ['kind', 'units', 'unitEquality', 'quantityEquality', 'scaleFactor', 'forwardFactor', 'reverseFactor']);
    if (!isMeasurementRatioRelation(data)) {
        throw new ViewValidationError(VIEW_ID, 'Exact equivalent measures and their dimensioned ratio witnesses must agree.');
    }
    const direction = config.direction;
    if (direction !== 'first-to-second' && direction !== 'second-to-first') {
        throw new ViewValidationError(VIEW_ID, 'A prepared conversion direction is required.');
    }
    return <MeasurementRatioConversionBody data={data} direction={direction} isSolutionView={payload.isSolutionView} />;
};

export const MeasureRatioConversion = withConfig(MeasureRatioConversionViewSchema, MeasureRatioConversionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measure-ratio-conversion'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasureRatioConversion payload={payload} />);
};
