import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Schemas de validação
const ExampleInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
});

type ExampleInput = z.infer<typeof ExampleInputSchema>;

interface ExampleResponse {
  success: boolean;
  data?: {
    name: string;
    email?: string;
    processedAt: string;
  };
  error?: string;
}

export async function exampleRoutes(app: FastifyInstance) {
  // Exemplo de rota com validação Zod
  app.post<{ Body: ExampleInput; Reply: ExampleResponse }>(
    '/example',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            email: { type: 'string', format: 'email' },
          },
          required: ['name'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  processedAt: { type: 'string' },
                },
              },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Validação adicional com Zod
        const validated = ExampleInputSchema.parse(request.body);

        return {
          success: true,
          data: {
            name: validated.name,
            email: validated.email,
            processedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          reply.code(400);
          return {
            success: false,
            error: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; '),
          };
        }

        reply.code(500);
        return {
          success: false,
          error: 'Internal server error',
        };
      }
    }
  );

  // GET example
  app.get('/example', async () => {
    return {
      success: true,
      message: 'Example route working',
      timestamp: new Date().toISOString(),
    };
  });
}
