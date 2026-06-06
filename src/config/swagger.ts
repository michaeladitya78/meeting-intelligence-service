import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Meeting Intelligence Service API',
      version: '1.0.0',
      description:
        'A production-ready Meeting Intelligence Service that uses Google Gemini AI to analyze meeting transcripts, extract action items, detect decisions, and send automated reminders.',
      contact: {
        name: 'Meeting Intelligence Service',
        email: 'support@meetingintelligence.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        TranscriptEntry: {
          type: 'object',
          required: ['timestamp', 'speaker', 'text'],
          properties: {
            timestamp: { type: 'string', example: '00:01' },
            speaker: { type: 'string', example: 'Alice' },
            text: { type: 'string', example: 'Let us review the Q4 roadmap.' },
          },
        },
        Meeting: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            participants: {
              type: 'array',
              items: { type: 'string', format: 'email' },
            },
            meetingDate: { type: 'string', format: 'date-time' },
            transcript: {
              type: 'array',
              items: { $ref: '#/components/schemas/TranscriptEntry' },
            },
            createdBy: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Citation: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', example: '00:05' },
            speaker: { type: 'string', example: 'Alice' },
            quote: {
              type: 'string',
              example: 'We need to ship the feature by next Friday.',
            },
          },
        },
        MeetingAnalysis: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            meetingId: { type: 'string', format: 'uuid' },
            summary: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Citation' },
                  },
                },
              },
            },
            decisions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Citation' },
                  },
                },
              },
            },
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string' },
                  assignee: { type: 'string' },
                  dueDate: { type: 'string', nullable: true },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Citation' },
                  },
                },
              },
            },
            followUps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  citations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Citation' },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ActionItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            meetingId: { type: 'string', format: 'uuid' },
            task: { type: 'string' },
            assignee: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            status: {
              type: 'string',
              enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
            },
            citations: {
              type: 'array',
              items: { $ref: '#/components/schemas/Citation' },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string' },
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            traceId: { type: 'string' },
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
