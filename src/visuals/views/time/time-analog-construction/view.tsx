import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {TimeAnalogView} from '../time-analog-view.tsx';
import {
    TimeAnalogConstructionViewConfig,
    TimeAnalogConstructionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'time-analog-construction';

interface CoreProps {
    config: TimeAnalogConstructionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <TimeAnalogView mode="construction" payload={payload} viewId={VIEW_ID} />
);

export const TimeAnalogConstruction = withConfig(TimeAnalogConstructionViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<TimeAnalogConstruction payload={payload} />);
};
