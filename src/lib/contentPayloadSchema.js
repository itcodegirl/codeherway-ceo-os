import * as v from 'valibot';
import {
  createPayloadParser,
  createSchemaValidator,
  requiredTrimmedString,
} from './schemaValidator';

export const contentPayloadSchema = v.object({
  title: requiredTrimmedString('Title is required.'),
  platform: requiredTrimmedString('Platform is required.'),
  status: v.picklist(['Drafting', 'Editing', 'Scheduled']),
});

export const validateContentPayload = createSchemaValidator(contentPayloadSchema);
export const parseContentPayload = createPayloadParser(contentPayloadSchema);
