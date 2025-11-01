import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3Event, Context } from "aws-lambda";
import sharp from "sharp";

const s3 = new S3Client({});

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 200;
const DEST_SUFFIX = "-thumbnail";

export const handler = async (event: S3Event, context: Context): Promise<void> => {
  console.log("Evento recebido:", JSON.stringify(event, null, 2));

  // verifica se algum arquivo já é thumbnail
  for (const record of event.Records) {
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    if (key.includes(DEST_SUFFIX)) {
      console.log(`Arquivo com sufixo de thumbnail detectado (${key}), encerrando Lambda para evitar loop.`);
      return; // sai da função inteira
    }
  }

  // processa os arquivos que não são thumbnails
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));
    console.log(`Bucket: ${bucket}, Key original: ${key}`);

    const dotIndex = key.lastIndexOf(".");
    const thumbKey =
      dotIndex > 0
        ? key.substring(0, dotIndex) + DEST_SUFFIX + key.substring(dotIndex)
        : key + DEST_SUFFIX;

    try {
      const getObjectOutput = await s3.send(new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }));

      if (!getObjectOutput.Body) {
        console.error("Body do objeto S3 é undefined");
        continue;
      }

      const inputBuffer = await streamToBuffer(getObjectOutput.Body as any);

      const thumbBuffer = await sharp(inputBuffer)
        .resize(THUMB_WIDTH, THUMB_HEIGHT)
        .toBuffer();

      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: thumbKey,
        Body: thumbBuffer,
        ContentType: "image/jpeg",
      }));

      console.log(`Thumbnail criado e enviado: ${thumbKey}`);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
    }
  }
};

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
