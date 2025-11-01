import { S3Event, Context, Callback } from "aws-lambda";

export const handler = async (event: S3Event, context: Context, callback: Callback): Promise<void> => {
  console.log('Evento recebido:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Bucket: ${bucket}`);
    console.log(`Arquivo: ${key}`);
  }

  callback(null, 'Processamento concluído');
};