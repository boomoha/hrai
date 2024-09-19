import type { PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone"; // Use 'type' for type imports
import { OpenAIEmbeddings } from "@langchain/openai";
import {
    Pinecone,
    type ScoredPineconeRecord,
  } from "@pinecone-database/pinecone";
export const dimension = 1536;
export const namespace = 'resumes';
export const embeddingModel = "text-embedding-3-small"
export const documentId = 1
export const indexName = 'hrai'
export type Metadata = {
    referenceURL: string;
    text: string;
  };
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

export const getMatchesFromEmbeddings = async (
    embeddings: number[],
    topK: number,
    namespace: string
  ): Promise<ScoredPineconeRecord<Metadata>[]> => {
    // Obtain a client for Pinecone
    const pinecone = new Pinecone();
  
    let indexName: string = process.env.PINECONE_INDEX_NAME || "";
    if (indexName === "") {
      indexName = "namespace-notes";
      console.warn("PINECONE_INDEX_NAME environment variable not set");
    }
    // Retrieve list of indexes to check if expected index exists
    const indexes = (await pinecone.listIndexes())?.indexes;
    if (!indexes || indexes.filter((i) => i.name === indexName).length !== 1) {
      throw new Error(`Index ${indexName} does not exist. 
      Create an index called "${indexName}" in your project.`);
    }
  
    // Get the Pinecone index and namespace
    const pineconeNamespace = pinecone.Index<Metadata>(indexName).namespace(namespace ?? "");
  
    try {
      // Query the index with the defined request
      const queryResult = await pineconeNamespace.query({
        vector: embeddings,
        topK,
        includeMetadata: true,
      });
      return queryResult.matches || [];
    } catch (e) {
      // Log the error and throw it
      console.log("Error querying embeddings: ", e);
      throw new Error(`Error querying embeddings: ${e}`);
    }
  };

  export const getContext = async (
    message: string,
    namespace: string,
    maxCharacters = 5000,
    minScore = 0.15,
    getOnlyText = true
  ): Promise<string | ScoredPineconeRecord[]> => {
    try {
      // Wrap the message in an array before passing it to embedChunks
      const embeddings = await embedChunks([message]);
      
      // Extract the embedding from the response
      const embedding = embeddings[0].embedding;
      
      const matches = await getMatchesFromEmbeddings(embedding, 15, namespace);
      const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);
  
      if (!getOnlyText) {
        return qualifyingDocs;
      }
  
      // Deduplicate and get text
      const documentTexts = qualifyingDocs.map((match) => {
        const metadata = match.metadata as Metadata;
        return `REFERENCE URL: ${metadata.referenceURL} CONTENT: ${metadata.text}`;
      });
  
      // Concatenate, then truncate by maxCharacters
      const concatenatedDocs = documentTexts.join(" ");
      return concatenatedDocs.length > maxCharacters
        ? concatenatedDocs.substring(0, maxCharacters)
        : concatenatedDocs;
    } catch (error) {
      console.error("Failed to get context:", error);
      throw error;
    }
  };