import { Pinecone } from '@pinecone-database/pinecone';
import { dimension } from "@/utils/utils";

export async function POST(req: Request, res:Response){

    try{

        const body = await req.json()
        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });


        const indexName = body.indexName || "hrai";

        await pc.createIndex({
            name: indexName,
            dimension: dimension,
            metric: 'cosine',
            spec: { 
            serverless: { 
                cloud: 'aws', 
                region: 'us-east-1' 
            }
            } 
        }); 

        return Response.json({message: 'Success'})

    } catch(error){
        return Response.json({error: 'Error creating the index'})
    }


}

