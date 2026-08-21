import {radixSortUtf8} from './content-identity.ts';

export const DEVELOPMENT_CHECKS = [
    'types',
    'related-tests',
    'generator-view-specs',
    'labels',
    'docs',
    'generator-coverage'
] as const;

export type DevelopmentCheck = typeof DEVELOPMENT_CHECKS[number];

export interface DevelopmentValidationPlan {
    changed_files: string[];
    checks: DevelopmentCheck[];
    specs: string[];
    reasons: Record<string, string[]>;
    work: {
        files_classified: number;
        classification_steps: number;
    };
}

const SOURCE_PATTERN = /^(src\/.*\.(?:ts|tsx)|(?:package|package-lock)\.json|tsconfig\.json)$/;
const GENERATOR_PATTERN = /^src\/generators\/([^/]+\/)?([^/]+)\//;
const VIEW_PATTERN = /^src\/visuals\/views\/([^/]+\/)?([^/]+)\//;
const SPEC_PATTERN = /^src\/spec\/([^/]+)(?:\/|\.ts$)/;
const DOC_PATTERN = /^(?:README\.md|DOCS\.md|AGENTS\.md|docs\/.*\.md|\.agents\/skills\/.*\/SKILL\.md)$/;
const MATCHING_FOUNDATION_PATTERN = /^src\/(?:types\/|lib\/(?:generation|matching|spec-|type-parser|ontology|utils|module-resolver))/;

function normalizedFile(path: string): string {
    return path.replaceAll('\\', '/').replace(/^\.\//, '');
}

/** Maps changed roots to the smallest safe set of repository validators. */
export function planDevelopmentValidation(
    changedFiles: readonly string[],
    availableSpecs: readonly string[],
    productionSpecs: readonly string[] = availableSpecs,
    missingFiles: readonly string[] = []
): DevelopmentValidationPlan {
    const files = radixSortUtf8([...new Set(changedFiles.map(normalizedFile).filter(Boolean))]);
    const checks = new Set<DevelopmentCheck>();
    const specs = new Set<string>();
    const availableSpecSet = new Set(availableSpecs);
    const productionSpecSet = new Set(productionSpecs);
    const reasons = new Map<string, Set<string>>();
    const missingFileSet = new Set(missingFiles.map(normalizedFile));
    let allSpecs = false;
    let classificationSteps = 0;
    const add = (key: DevelopmentCheck | `spec:${string}`, file: string): void => {
        const values = reasons.get(key);
        if (values) values.add(file);
        else reasons.set(key, new Set([file]));
    };
    const addCheck = (check: DevelopmentCheck, file: string): void => {
        checks.add(check);
        add(check, file);
    };
    const addAllSpecs = (file: string): void => {
        allSpecs = true;
        add('spec:*', file);
    };

    for (const file of files) {
        const testSource = /\.(?:it\.)?test\.(?:ts|tsx)$/.test(file);
        const removed = missingFileSet.has(file);
        classificationSteps++;
        if (SOURCE_PATTERN.test(file)) {
            addCheck('types', file);
            if (file.startsWith('src/')) addCheck('related-tests', file);
        }

        classificationSteps++;
        const generatorModule = GENERATOR_PATTERN.test(file);
        const viewModule = VIEW_PATTERN.test(file);
        const moduleSpec = (generatorModule || viewModule) && file.endsWith('/spec.ts');
        const moduleImplementation = (generatorModule && file.endsWith('/generator.ts'))
            || (viewModule && file.endsWith('/view.tsx'));
        if (moduleSpec) {
            addCheck('generator-view-specs', file);
            addCheck('labels', file);
            addAllSpecs(file);
        } else if (moduleImplementation) {
            addCheck('labels', file);
            if (generatorModule && !removed) addCheck('generator-coverage', file);
            if (removed) {
                addCheck('generator-view-specs', file);
                addAllSpecs(file);
            }
        }

        classificationSteps++;
        const specMatch = file.match(SPEC_PATTERN);
        if (specMatch) {
            const spec = specMatch[1];
            if (availableSpecSet.has(spec)) {
                specs.add(spec);
                add(`spec:${spec}`, file);
            }
        }

        classificationSteps++;
        if ((!testSource && MATCHING_FOUNDATION_PATTERN.test(file))
            || file === 'package.json'
            || file === 'package-lock.json') {
            addCheck('generator-view-specs', file);
            addCheck('labels', file);
            addAllSpecs(file);
        }

        classificationSteps++;
        if (DOC_PATTERN.test(file) || file === 'src/lib/docs-validator.ts') {
            addCheck('docs', file);
        }

        classificationSteps++;
        if (file === 'src/scripts/validate-generator-view-specs.ts') addCheck('generator-view-specs', file);
        if (file === 'src/scripts/check-labels.ts') addCheck('labels', file);
        if (file === 'src/scripts/validate-standards-spec.ts') addAllSpecs(file);
    }

    const checkList = DEVELOPMENT_CHECKS.filter(check => checks.has(check));
    const specList = radixSortUtf8(allSpecs ? [...productionSpecSet, ...specs] : [...specs]);
    return {
        changed_files: files,
        checks: checkList,
        specs: specList,
        reasons: Object.fromEntries(radixSortUtf8([...reasons.keys()])
            .map(key => [key, radixSortUtf8([...(reasons.get(key) ?? [])])])),
        work: {
            files_classified: files.length,
            classification_steps: classificationSteps
        }
    };
}
