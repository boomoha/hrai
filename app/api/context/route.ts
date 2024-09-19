import { Pinecone } from '@pinecone-database/pinecone'
import { indexName } from '@/utils/utils'
import { embedChunks } from '@/utils/utils'
import { namespace } from '@/utils/utils'
//this endpoint returns the the question + the context
export async function POST(req: Request){
    try{

        const { message } = await req.json()

        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' })
        const index = pc.index(indexName)

        //create an embedding for the message
        const embeddedMessage = await embedChunks([message])
        // console.log(`This is your last message: ${message}, and this is the corresponding embedding: ${embeddedMessage}`)

        const queryResponse = await index.namespace(namespace).query({
            vector: embeddedMessage,
            topK: 3,
            includeValues: true,
            includeMetadata: true,
        });

        const matches = queryResponse.matches

        // console.log(matches)

        let context = ''

        for (const match of matches){
            const text = match.metadata?.text
            context += text
        }

        console.log(`This is now the context from the lasst message: ${context}`)
        
        return Response.json({context: context})

    } catch(error){
        return Response.json({error: `An error occured generating the context:, ${error}`})
    }

    

    

}
