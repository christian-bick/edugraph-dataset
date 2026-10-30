/** Canonical configuration-value key shared by browser resolvers and server validation. */
export const schemaResolutionKey = (value: unknown): string => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(schemaResolutionKey).join(',')}]`;
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key =>
        `${JSON.stringify(key)}:${schemaResolutionKey(record[key])}`
    ).join(',')}}`;
};
