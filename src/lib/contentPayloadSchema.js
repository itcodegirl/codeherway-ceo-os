import * as v from 'valibot';
import { createSchemaValidator } from './schemaValidator';

export const contentPayloadSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Title is required.')),
  platform: v.pipe(v.string(), v.minLength(1, 'Platform is required.')),
  status: v.picklist(['Drafting', 'Editing', 'Scheduled']),
});

export const validateContentPayload = createSchemaValidator(contentPayloadSchema);
