import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, namespaceId } = await req.json();

  //given the messages and the namespaceId, generate the context
  //return the context

  const lastMessage = messages[0].content

  const response = await fetch(`${process.env.SERVER_URL}/api/context`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: lastMessage,
    }),
  });

  const { context } = await response.json()
  const result = await streamText({
    model: openai('gpt-4-turbo'),
    system: 'You are a helpful assistant.',
    messages: messages,
  });

  return result.toDataStreamResponse();
}