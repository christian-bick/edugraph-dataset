import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasurementLinePlotView} from '../measurement-line-plot-view.tsx';
import {
    MeasurementLinePlotArithmeticViewConfig,
    MeasurementLinePlotArithmeticViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measurement-line-plot-arithmetic';

interface CoreProps {
    config: MeasurementLinePlotArithmeticViewConfig;
    payload: ViewRenderPayload<'measurement-line-plot-arithmetic'>;
}

const MeasurementLinePlotArithmeticCore = ({payload}: CoreProps) => (
    <MeasurementLinePlotView mode="arithmetic" payload={payload} viewId={VIEW_ID} />
);

export const MeasurementLinePlotArithmetic = withConfig(
    MeasurementLinePlotArithmeticViewSchema,
    MeasurementLinePlotArithmeticCore
);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-line-plot-arithmetic'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementLinePlotArithmetic payload={payload} />);
};
