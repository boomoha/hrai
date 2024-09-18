import type { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone"; // Use 'type' for type imports
import { OpenAIEmbeddings } from "@langchain/openai";
export const dimension = 1536;
export const namespace = 'resumes';
export const embeddingModel = "text-embedding-3-small"
export const documentId = 1
import { OpenAI } from "@langchain/openai";

export function chunkTextByMultiParagraphs(
    text: string,
    maxChunkSize = 300,
    minChunkSize = 100
    ): string[] {
    const chunks: string[] = [];
    let currentChunk = "";
    
    let startIndex = 0;
    while (startIndex < text.length) {
        let endIndex = startIndex + maxChunkSize;
        if (endIndex >= text.length) {
        endIndex = text.length;
        } else {
        // Just using this to find the nearest paragraph boundary
        const paragraphBoundary = text.indexOf("\n\n", endIndex);
        if (paragraphBoundary !== -1) {
            endIndex = paragraphBoundary;
        }
        }
    
        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length >= minChunkSize) {
        chunks.push(chunk);
        currentChunk = "";
        } else {
        currentChunk += chunk + "\n\n";
        }
    
        startIndex = endIndex + 1;
    }
    
    if (currentChunk.length >= minChunkSize) {
        chunks.push(currentChunk.trim());
    } else if (chunks.length > 0) {
        chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
    } else {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
    }

    export async function embedChunks(chunks: string[]): Promise<any[]> {
        // You can use any embedding model or service here.
        // In this example, we use OpenAI's text-embedding-3-large model.
        try {
            const embeds = [];
            const apiKey = process.env.OPENAI_API_KEY
            if (!apiKey) return ['Unable to read the api key'] 
            const embeddings = new OpenAIEmbeddings({
                apiKey: apiKey, // In Node.js defaults to process.env.OPENAI_API_KEY
                batchSize: dimension, // Default value if omitted is 512. Max is 2048
                model: embeddingModel,
            });
            for (let i=0; i<chunks.length; i += 1){
                const embeddedChunk = await embeddings.embedQuery(chunks[i])
                // console.log(embeddedChunk)
                embeds.push(embeddedChunk);
            }


            return embeds; //return the array of embedded chunks

        } catch (error){
            console.log('Error embedding the chunks.')
            return []
        }
        
        
        
}

export async function upsertDocument(index: any, document: any, namespaceId: string) {
    // Adjust to use namespaces if you're organizing data that way

    try{

        const namespace = index.namespace(namespaceId);

        const vectors: PineconeRecord<RecordMetadata>[] = document.embeddings.map(
            (embedding: any) => ({
                id: embedding.id,
                values: embedding.values,
                metadata: {
                text: embedding.text,
                referenceURL: document.documentUrl,
                },
            })
            );
            // Batch the upsert operation
            const batchSize = 200;
            for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            
            await namespace.upsert(batch);
            }

    } catch(error) {
        console.log(`An error occured upserting the information, ${error}`)
    }
    
}