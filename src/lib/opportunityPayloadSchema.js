import * as v from 'valibot';
import {
  createPayloadParser,
  createSchemaValidator,
  requiredTrimmedString,
} from './schemaValidator';

export const opportunityPayloadSchema = v.object({
  name: requiredTrimmedString('Name is required.'),
  company: requiredTrimmedString('Company is required.'),
  priority: v.picklist(['High', 'Medium', 'Low']),
  stage: v.picklist(['New', 'In Progress', 'Awaiting Reply']),
  nextStep: requiredTrimmedString('Next step is required.'),
});

export const validateOpportunityPayload = createSchemaValidator(opportunityPayloadSchema);
export const parseOpportunityPayload = createPayloadParser(opportunityPayloadSchema);
