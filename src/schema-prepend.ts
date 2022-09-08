import { makeAddInflectorsPlugin } from "graphile-utils";

export const SchemaPrepend = makeAddInflectorsPlugin(
    (
        inflection,
        _,
        options,
    ) => {
        if (options.pgSchemas.length !== 1) {
            throw new Error("This plugin requires a single schema to be used.");
        }

        const camelCaseSchema = (inflection.camelCase)(options.pgSchemas[0]);
        const upperCamelCaseSchema = (inflection.upperCamelCase)(options.pgSchemas[0]);

        function prependPreservingCase(orig: string): string {
            if (orig === orig.toUpperCase()) {
                const upperCaseSchema = inflection.constantCase(options.pgSchemas[0]);
                return `${upperCaseSchema}_${orig}`;
            } else if (orig[0] === orig[0].toUpperCase()) {
                return upperCamelCaseSchema + orig;
            }
            return camelCaseSchema + orig[0].toUpperCase() + orig.slice(1);
        }

        function makePrepend(f: (...args: any[]) => any) {
            return (...args: any[]) => {
                const fResult = f.apply(modifiedInflectors, args);
                if (typeof(fResult) !== "string") {
                    return fResult;
                }

                return prependPreservingCase(fResult);
            };
        }

        const originalInflection = { ...inflection };
        const functionMethodsWrapped = Object.entries(originalInflection).filter(
            (e) => e[0].startsWith('function')
        ).map(
            (e) => [e[0], makePrepend(e[1])],
        );

        const { _singularizedTableName, connection } = originalInflection;

        function preserveConnection(...args: any[]) {
            return connection.apply(originalInflection, args);
        }

        const modifiedInflectors: typeof inflection = {
            ...inflection,
            ...Object.fromEntries(functionMethodsWrapped),
            _singularizedTableName: makePrepend(_singularizedTableName),
            connection: preserveConnection
        };
        return modifiedInflectors;
    },
    true,
);
