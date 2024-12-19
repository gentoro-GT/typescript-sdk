// your-module
import {TSchema} from "@sinclair/typebox/build/cjs/type/schema/schema";
import {Value} from "@sinclair/typebox/value";

export * from "./types/types"
export {Gentoro} from "./gentoro"

export const isOfType = <T extends TSchema> (schema: T, obj: unknown): boolean => {
    return Value.Check(schema, obj);
}
