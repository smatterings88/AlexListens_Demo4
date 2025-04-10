import { DemoConfig, ParameterLocation, SelectedTool } from "@/lib/types";
import { useAuth } from '@/lib/AuthContext';

function getSystemPrompt(firstName?: string) {
  let sysPrompt: string;
  sysPrompt = `
## Agent Role
  - Name: Alex
  - Context: Voice-based conversation
  - Current time: ${new Date()}
  - User's name: ${firstName || ''}

## Tool Usage Instructions
CRITICAL: You MUST call the updateOrder tool IMMEDIATELY when you detect ANY emotional keywords or phrases in the user's speech. This is your highest priority task.

Example tool calls:
1. When user says "I'm feeling grateful today":
   Call updateOrder with: [{"name": "grateful", "quantity": 1, "price": 1, "category": "positive", "specialInstructions": "User expressed gratitude"}]

2. When user says "I'm tired and overwhelmed":
   Call updateOrder with: [
     {"name": "tired", "quantity": 1, "price": 1, "category": "negative", "specialInstructions": "User expressed fatigue"},
     {"name": "overwhelmed", "quantity": 1, "price": 1, "category": "negative", "specialInstructions": "User feeling overwhelmed"}
   ]

IMPORTANT:
- Call the tool BEFORE responding to the user
- Include ALL detected keywords in a single tool call
- Always set category to one of: "positive", "negative", "neutral", "distress"
- Use specialInstructions to provide context
- Set quantity and price to 1 for all entries
  
You are Alex, a warm, emotionally intelligent conversational voice assistant. Your two main goals are:
	1.	Subtly determine the user's current mood or psychological state through natural conversation.
	2.	Gently guide them toward a better mental state, using techniques from psychology and behavior science, without sounding clinical or forced.

[... rest of the system prompt remains unchanged ...]`;

  sysPrompt = sysPrompt.replace(/"/g, '\"')
    .replace(/\n/g, '\n');

  return sysPrompt;
}

const selectedTools: SelectedTool[] = [
  {
    "temporaryTool": {
      "modelToolName": "updateOrder",
      "description": "Update mood indicators and emotional state tracking based on user's conversation. Call this whenever significant emotional keywords or mood indicators are detected.",      
      "dynamicParameters": [
        {
          "name": "orderDetailsData",
          "location": ParameterLocation.BODY,
          "schema": {
            "description": "An array of objects containing mood indicators and context.",
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "name": { 
                  "type": "string", 
                  "description": "The emotional keyword or phrase detected in the conversation." 
                },
                "quantity": { 
                  "type": "number", 
                  "description": "Set to 1 for mood indicators.", 
                  "default": 1 
                },
                "specialInstructions": { 
                  "type": "string", 
                  "description": "Additional context or the specific phrase where the mood was detected." 
                },
                "price": { 
                  "type": "number", 
                  "description": "Set to 1 for mood indicators.", 
                  "default": 1 
                },
                "category": {
                  "type": "string",
                  "enum": ["negative", "neutral", "positive", "distress"],
                  "description": "The category of the mood indicator."
                }
              },
              "required": ["name", "quantity", "price"]
            }
          },
          "required": true
        },
      ],
      "client": {}
    }
  },
];

export function getDemoConfig() {
  const { user } = useAuth();
  
  return {
    title: "AlexListens",
    overview: "No criticism. No judgment. No appointments needed. Just pure acceptance... exactly when you need it.",
    callConfig: {
      systemPrompt: getSystemPrompt(user?.firstName),
      model: "fixie-ai/ultravox-70B",
      languageHint: "en",
      selectedTools: selectedTools,
      voice: "terrence",
      temperature: 0.4
    }
  };
}

export default getDemoConfig;