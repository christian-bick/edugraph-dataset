/**
 * Strictly resolves a named `--<name>=<value>` CLI option for pipeline
 * scripts. The npm config env var (`npm run x --name=value` sets
 * `npm_config_name`) takes precedence, then an exact `--name=<value>`
 * argument. Matching is deliberately strict: `--respec=x` never satisfies
 * `spec`, and a value containing `name=` can not confuse the parser.
 * Returns undefined for missing options and empty values.
 */
export function getCliOption(args: string[], name: string): string | undefined {
    const envValue = process.env[`npm_config_${name.replace(/-/g, '_')}`];
    if (envValue) {
        return envValue;
    }
    const prefix = `--${name}=`;
    return args.find(a => a.startsWith(prefix))?.slice(prefix.length) || undefined;
}
