import { makeAddInflectorsPlugin } from "graphile-utils";
import { add, lte } from "sorted-array-functions";

function nameMutationPrefix(name: string): string | undefined {
    if (! name) {
        return undefined;
    }
    const mutationPrefixes = [
        'create',
        'update',
        'delete',
        'upsert'
    ];
    const nameLc = name[0].toLowerCase() + name.slice(1);
    return mutationPrefixes.find(
        s => nameLc.startsWith(s) || name.startsWith(`${s.toUpperCase()}_`)
    );
}

class NameMappings {
    private mappedNames: string[] = [];

    public add(mappedName: string) {
        if (mappedName.length === 0) {
            throw new Error("Name mapping resulted in an empty string");
        }
        add(this.mappedNames, mappedName);
    }

    public startsWithMappingOutputName(
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
                else {
                    const prefixToPreserve = nameMutationPrefix(fResult) ?? '';
                    const nameAfterPrefix = fResult.slice(prefixToPreserve.length);
                    if (nameMappings.startsWithMappingOutputName(nameAfterPrefix)) {
                        return fResult;
                    }
                    else {
                        const transformedName = prependPreservingCase(nameAfterPrefix);
                        nameMappings.add(transformedName);
                        return prefixToPreserve + transformedName;
                    }
                }
            };
        }

        const methodsToWrap = Object.entries(inflection).filter(
            (e) => e[0].endsWith("Type") || nameMutationPrefix(e[0]),
        ).map(
            (e) => [e[0], makePrepend(e[1])],
        );
        const modifiedInflectors: typeof inflection = {
            ...inflection,
            ...Object.fromEntries(methodsToWrap),
        };
        return modifiedInflectors;
    },
    true,
);
