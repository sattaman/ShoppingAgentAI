import { z } from "zod";

export function jsonSchemaToZod(schema: Record<string, unknown>): z.ZodTypeAny {
  const type = schema.type as string;
  const desc = schema.description as string | undefined;

  let zodType: z.ZodTypeAny;
  switch (type) {
    case "string":
      zodType = z.string();
      break;
    case "number":
    case "integer":
      zodType = z.number();
      break;
    case "boolean":
      zodType = z.boolean();
      break;
    case "object":
      zodType = z.record(z.any());
      break;
    case "array": {
      const items = schema.items as Record<string, unknown> | undefined;
      if (items) {
        zodType = z.array(jsonSchemaToZod(items));
      } else {
        zodType = z.array(z.string());
      }
      break;
    }
    default:
      zodType = z.any();
  }
  return desc ? zodType.describe(desc) : zodType;
}

type InputSchema = {
  properties?: Record<string, Record<string, unknown>>;
  required?: string[];
};

export function buildZodSchema(inputSchema: InputSchema | undefined): z.ZodObject<any> {
  const properties = inputSchema?.properties ?? {};
  const required = new Set(inputSchema?.required ?? []);

  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, propSchema] of Object.entries(properties)) {
    const field = jsonSchemaToZod(propSchema);
    shape[key] = required.has(key) ? field : field.optional();
  }

  return z.object(shape);
}
