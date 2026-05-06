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

/**
 * Adapts a Valibot schema to the (formValues) => { payload, error } signature
 * expected by useCrudPage's `parsePayload` prop. The schema is responsible for
 * BOTH validation and any normalization (e.g. trim) so each CRUD page can
 * stop hand-rolling a separate mapFormValuesToPayload step.
 *
 * On success, `payload` is the schema's transformed output. On failure,
 * `payload` is null and `error` carries the first issue's message.
 */
export function createPayloadParser(schema) {
  return (formValues) => {
    const result = v.safeParse(schema, formValues);
    if (result.success) {
      return { payload: result.output, error: '' };
    }

    return {
      payload: null,
      error: result.issues[0]?.message ?? 'Invalid form values.',
    };
  };
}

/**
 * Pipes string -> trim -> non-empty check. Used by repository payload
 * schemas so the same field can be both validated and normalised in one
 * place rather than splitting the work across the schema and a sibling
 * mapFormValuesToPayload helper on the page.
 */
export function requiredTrimmedString(message) {
  return v.pipe(
    v.string(),
    v.transform((value) => value.trim()),
    v.minLength(1, message),
  );
}
