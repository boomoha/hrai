import { openai } from '@ai-sdk/openai';
import { convertToCoreMessages, streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, namespaceId } = await req.json();


  try{

    const systemPrompt = "You are a helpful HR assistant bot. Your primary role is to efficiently read and summarize data from employee resumes. Each time you receive a context about a question, you should analyze the provided information and respond in a clear, concise, and well-structured format. Ensure that your summaries highlight key qualifications, experiences, and skills relevant to the inquiry. Always maintain a professional tone and provide actionable insights based on the resume data."

    const lastMessage = messages[0].content
    console.log(`The last message was: ${lastMessage}`)

    const apiUrl = `${process.env.SERVER_URL}/api/context`;
    console.log(`Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
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
        system: `${systemPrompt}. START OF THE CONTENT | ${context} | END OF THE CONTEXT`,
        messages: messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    return Response.json({error: `An error occured sending the message from OpenAI: ${error}`})
  }
  
}