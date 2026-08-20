import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {MeasurementLinePlotView} from '../measurement-line-plot-view.tsx';
import {MeasurementLinePlotViewConfig, MeasurementLinePlotViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'measurement-line-plot';

interface CoreProps {
    config: MeasurementLinePlotViewConfig;
    payload: ViewRenderPayload<'measurement-line-plot'>;
}

export const MeasurementLinePlotCore = ({config, payload}: CoreProps) => (
    <MeasurementLinePlotView
        mode="construction"
        payload={payload}
        requireUnitSteps={config.usesUnitSteps}
        viewId={VIEW_ID}
    />
);

export const MeasurementLinePlot = withConfig(MeasurementLinePlotViewSchema, MeasurementLinePlotCore);

let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'measurement-line-plot'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<MeasurementLinePlot payload={payload} />);
};
