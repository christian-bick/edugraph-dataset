import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {TimeDigitalView} from '../time-digital-view.tsx';
import {TimeDigitalViewConfig, TimeDigitalViewSchema} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'time-digital';

interface CoreProps {
    config: TimeDigitalViewConfig;
    payload: ViewRenderPayload<typeof VIEW_ID>;
}

const Core = ({payload}: CoreProps) => (
    <TimeDigitalView mode="reading" payload={payload} viewId={VIEW_ID} />
);

export const TimeDigital = withConfig(TimeDigitalViewSchema, Core);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<typeof VIEW_ID>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<TimeDigital payload={payload} />);
};
