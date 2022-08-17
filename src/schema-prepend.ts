import { makeAddInflectorsPlugin } from "graphile-utils";
import { add, lte } from "sorted-array-functions";

class NameMappings {
    private mappedNames: string[] = [];

    public add(mappedName: string) {
        if (mappedName.length === 0) {
            throw new Error("Name mapping resulted in an empty string");
        }
        add(this.mappedNames, mappedName);
        return mappedName;
    }

    public startsWithMappedName(
        name: string,
    ): boolean {
        for (let lengthToConsider = name.length; lengthToConsider > 0; ) {
            const closestMappedNameIndex = lte(
                this.mappedNames,
                name.slice(undefined, lengthToConsider),
            );
            if (closestMappedNameIndex < 0) {
                break;
            }

            if (name.startsWith(this.mappedNames[closestMappedNameIndex])) {
                return true;
            }

            lengthToConsider = Math.min(
                this.mappedNames[closestMappedNameIndex].length,
                lengthToConsider,
            ) - 1;
        }

        return false;
    }
};

export const SchemaPrepend = makeAddInflectorsPlugin(
    (
        inflection,
        _,
        options,
    ) => {
        if (options.pgSchemas.length !== 1) {
            throw new Error("This plugin requires a single schema to be used.");
        }

        const nameMappings = new NameMappings();
        const camelCaseSchema = (inflection.camelCase)(options.pgSchemas[0]);
        function makePrepend(f: (...args: any[]) => any) {
            return (...args: any[]) => {
                const fResult = f.apply(inflection, args);
                if (
                    (typeof(fResult) !== "string") ||
                    (nameMappings.startsWithMappedName(fResult))
                ) {
                    return fResult;
                } else if (fResult === fResult.toUpperCase()) {
                    const upperCaseSchema = options.pgSchemas[0].toUpperCase();
                    return nameMappings.add(
                        `${upperCaseSchema}_${fResult}`,
                    );
                } else if (fResult[0] === fResult[0].toUpperCase()) {
                    return nameMappings.add(
                        camelCaseSchema[0].toUpperCase() + camelCaseSchema.slice(1) + fResult,
                    );
                }
                return nameMappings.add(
                    camelCaseSchema + fResult[0].toUpperCase() + fResult.slice(1),
                );
            };
        }

        const typeMethods = Object.entries(inflection).filter(
            (e) => e[0].endsWith("Type"),
        ).map(
            (e) => [e[0], makePrepend(e[1])],
        );
        const modifiedInflectors = {
            ...inflection,
            ...Object.fromEntries(typeMethods),
        };
        return modifiedInflectors;
    },
    true,
);
