import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {namespace} from '@/utils/utils'
import { embedChunks } from "@/utils/utils";
import { chunkTextByMultiParagraphs } from "@/utils/utils";
import { documentId } from "@/utils/utils";
import { upsertDocument } from "@/utils/utils";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        console.log("Request Body:", body); // Log the request body

        const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || '' });

        const resume = body.filePath ? body.filePath : "/Users/boubalkaly/Desktop/hrai/files/pdf_sample.pdf"; // Use filePath from body

        const loader = new PDFLoader(resume);
        const docs = await loader.load();
        console.log(docs[0]);
        //get the actual page content
        const text = docs[0].pageContent

        const document: {
            documentId: number; // Specify the type for documentId
            text: string; // Specify the type for text
            chunks: string[]; // Define chunks as string array
            embeddings: any[];
            documentUrl: string;
        } = {
            documentId: documentId,
            text: text,
            chunks: [], // Initialize as an empty array
            embeddings: [],
            documentUrl: 'url'
        }

        if (!loader || !docs) {
            return Response.json({ error: 'Error reading or parsing the pdf' });
        }
        //get the array of chunks of the document
        const chunks: string[] = chunkTextByMultiParagraphs(document.text)
        document.chunks = chunks

        console.log(`The total number of chunks is ${chunks.length}`)
        //embed all the chunks
        const embeds = await embedChunks(chunks)

        for(let i=0; i < chunks.length; i++){
            document.embeddings.push({
                id: `${document.documentId}:${i}`,
                values: embeds[i],
                text: chunks[i]
            })
        }

        // for(let i=0; i< chunks.length; i++){
        //     Object.values(document.embeddings[i]).forEach(value => {
        //         console.log(value); // Prints the value
        //     });
        // }

        const index = pc.index('hrai')

        await upsertDocument(index, document, namespace)

        return Response.json({ message: 'Document successfully embedded!' });
    } catch (error) {
        console.error("Error:", error); // Log the error
        return Response.json({ error: 'something went wrong' }, { status: 500 });
    }
}