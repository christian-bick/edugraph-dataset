import {createRoot} from 'react-dom/client';
import type {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {RatioTableView} from '../ratio-table-view.tsx';
import {RatioTableConstructionViewSchema, type RatioTableConstructionViewConfig} from './spec.ts';
import '../../../../tailwind.css';

export const RatioTableConstructionCore = ({payload}: {
    config: RatioTableConstructionViewConfig;
    payload: ViewRenderPayload<'ratio-table-construction'>;
}) => <RatioTableView task="construction" viewId="ratio-table-construction" payload={payload} />;

export const RatioTableConstruction = withConfig(RatioTableConstructionViewSchema, RatioTableConstructionCore);
let root: ReturnType<typeof createRoot> | null = null;
window.renderView = (payload: ViewRenderPayload<'ratio-table-construction'>) => {
    const container = document.getElementById('view');
    if (!container) return;
    if (!root) root = createRoot(container);
    root.render(<RatioTableConstruction payload={payload} />);
};
