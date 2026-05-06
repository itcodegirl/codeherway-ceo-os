import * as v from 'valibot';
import { createSchemaValidator } from './schemaValidator';

export const opportunityPayloadSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Name is required.')),
  company: v.pipe(v.string(), v.minLength(1, 'Company is required.')),
  priority: v.picklist(['High', 'Medium', 'Low']),
  stage: v.picklist(['New', 'In Progress', 'Awaiting Reply']),
  nextStep: v.pipe(v.string(), v.minLength(1, 'Next step is required.')),
});

export const validateOpportunityPayload = createSchemaValidator(opportunityPayloadSchema);
