import {createRoot} from 'react-dom/client';
import {ViewRenderPayload} from '../../../../types/ml-engine.ts';
import {withConfig} from '../../withConfig.tsx';
import {FractionComparisonView} from '../fraction-comparison-view.tsx';
import {
    FractionsCompareBenchmarkModelsViewConfig,
    FractionsCompareBenchmarkModelsViewSchema
} from './spec.ts';
import '../../../../tailwind.css';

const VIEW_ID = 'fractions-compare-benchmark-models';

interface CoreProps {
    config: FractionsCompareBenchmarkModelsViewConfig;
    payload: ViewRenderPayload<'fractions-compare-benchmark-models'>;
}

const FractionsCompareBenchmarkModelsCore = ({payload}: CoreProps) => (
    <FractionComparisonView
        mode="procedure-understanding"
        payload={payload}
        viewId={VIEW_ID}
    />
);

export const FractionsCompareBenchmarkModels = withConfig(
    FractionsCompareBenchmarkModelsViewSchema,
    FractionsCompareBenchmarkModelsCore
);

let root: ReturnType<typeof createRoot> | null = null;

window.renderView = (payload: ViewRenderPayload<'fractions-compare-benchmark-models'>) => {
    const container = document.getElementById('view');
    if (container) {
        if (!root) root = createRoot(container);
        root.render(<FractionsCompareBenchmarkModels payload={payload} />);
    }
};
