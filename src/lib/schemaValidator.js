import * as v from 'valibot';

/**
 * Adapts a Valibot schema to the (payload) => errorString signature
 * expected by useCrudPage's `validate` prop.
 */
export function createSchemaValidator(schema) {
  return (payload) => {
    const result = v.safeParse(schema, payload);
    return result.success ? '' : (result.issues[0]?.message ?? 'Invalid form values.');
  };
}
