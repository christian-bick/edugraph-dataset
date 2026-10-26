import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, isAbsolute, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getCliOption} from '../lib/cli.ts';
import {formatLabelDependencyAudit} from '../lib/label-dependency-audit.ts';
import {inspectLabelDependencies} from '../lib/label-dependency-inspection.ts';
import {summarizeLabelDependencyCoverage} from '../lib/label-dependency-coverage.ts';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (arg !== '--strict' && !/^--(?:spec|output-dir|max-selections)=.+$/.test(arg)) {
            throw new Error(`Unsupported dependency audit option: ${arg}`);
        }
    }
    const strict = args.includes('--strict');
    const spec = getCliOption(args, 'spec');
    if (!spec || !/^[a-zA-Z0-9_-]+$/.test(spec)) {
        throw new Error('Usage: npm run audit:label-dependencies -- --spec=<module> [--strict] [--max-selections=4096] [--output-dir=temp/…]');
    }
    const outputDir = resolve(PROJECT_ROOT, getCliOption(args, 'output-dir') ?? `temp/label-dependencies/${spec}`);
    const outputRelative = relative(resolve(PROJECT_ROOT, 'temp'), outputDir);
    if (!outputRelative || outputRelative.startsWith('..') || isAbsolute(outputRelative)) {
        throw new Error('Audit reports must be written to a subdirectory of temp/.');
    }
    const limitArg = getCliOption(args, 'max-selections');
    const report = await inspectLabelDependencies({projectRoot: PROJECT_ROOT, spec,
        maxSelections: limitArg === undefined ? undefined : Number(limitArg)});
    const enforcement = strict ? summarizeLabelDependencyCoverage(report) : undefined;
    const output = enforcement ? {...report, mode: 'strict', strict: enforcement} : report;
    const strictMarkdown = enforcement ? [
        '', '## Reviewed strict coverage', '',
        `- Coverage policy: \`${enforcement.coverage_hash}\``,
        '- Range remains report-only. Named unsupported/deferred variants remain visible.',
        `- Subjects: ${enforcement.counts.covered} covered, ${enforcement.counts.deferred} deferred selections, ${enforcement.counts.uncovered} uncovered, ${enforcement.counts.outside_policy_scope} outside policy scope, ${enforcement.counts.invalid_context} invalid contexts`,
        `- Strict failures: ${enforcement.counts.failures}`, '',
        ...enforcement.failures.map(failure => `- \`${failure.subject}\` [${failure.code}]: ${failure.message}`), ''
    ].join('\n') : '';
    mkdirSync(outputDir, {recursive: true});
    writeFileSync(resolve(outputDir, 'audit.json'), `${JSON.stringify(output, null, 2)}\n`);
    const markdown = formatLabelDependencyAudit(report);
    writeFileSync(resolve(outputDir, 'audit.md'), (strict ? markdown.replace('Report only.', 'Enforcement of reviewed strict coverage.') : markdown) + strictMarkdown);
    console.log(`=== Label Dependency Audit (${strict ? 'reviewed strict coverage' : 'report only'}) ===`);
    console.log(`Spec: ${spec}; selections: ${report.summary.selections}; samples: ${report.summary.samples}`);
    console.log(`Missing: ${report.summary.assessments.missing}; unresolved: ${report.summary.assessments.unresolved}; incomplete tuples: ${report.summary.incomplete_tuples}`);
    if (enforcement) {
        console.log(`Strict failures: ${enforcement.counts.failures}; covered subjects: ${enforcement.counts.covered}; uncovered subjects: ${enforcement.counts.uncovered}`);
        if (enforcement.counts.failures) process.exitCode = 1;
    }
    console.log(`JSON: ${resolve(outputDir, 'audit.json')}`);
    console.log(`Markdown: ${resolve(outputDir, 'audit.md')}`);
}

main().catch(error => {
    console.error(errorMessage(error));
    process.exitCode = 1;
});
