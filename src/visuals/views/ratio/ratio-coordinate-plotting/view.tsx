import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RatioTableView} from '../ratio-table-view.tsx';
import {RatioCoordinatePlottingViewSchema, type RatioCoordinatePlottingViewConfig} from './spec.ts';
import '../../../../tailwind.css';

export const RatioCoordinatePlottingCore = ({payload}: {
    config: RatioCoordinatePlottingViewConfig;
    payload: ViewRenderPayload<'ratio-coordinate-plotting'>;
}) => <RatioTableView task="plotting" viewId="ratio-coordinate-plotting" payload={payload} />;

export const RatioCoordinatePlotting = withConfig(RatioCoordinatePlottingViewSchema, RatioCoordinatePlottingCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'ratio-coordinate-plotting'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<RatioCoordinatePlotting payload={payload} />);
};
