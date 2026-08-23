import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {TimeDigitalView} from '../time-digital-view.tsx';
import {
    TimeDigitalConstructionViewConfig,
    TimeDigitalConstructionViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'time-digital-construction';

interface CoreProps {
    config: TimeDigitalConstructionViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <TimeDigitalView mode="construction" payload={payload} viewId={VIEW_ID} />
);

export const TimeDigitalConstruction = withConfig(TimeDigitalConstructionViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<TimeDigitalConstruction payload={payload} />);
};
