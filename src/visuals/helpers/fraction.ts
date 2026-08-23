export type FractionTerms = {
    numerator: number;
    denominator: number;
};

export type PresentedFraction<T extends FractionTerms> = T & {
    notation: string;
};

export const formatFraction = ({numerator, denominator}: FractionTerms): string =>
    `${numerator}/${denominator}`;

export const presentFraction = <T extends FractionTerms>(value: T): PresentedFraction<T> => ({
    ...value,
    notation: formatFraction(value)
});
