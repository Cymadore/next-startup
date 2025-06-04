import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  credentials: JSON.parse(process.env.GCP_CREDENTIALS),
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parsing error' });

    const file = files.image;
    const blob = bucket.file(file.originalFilename);

    const stream = fs.createReadStream(file.filepath).pipe(blob.createWriteStream());

    stream.on('finish', () => {
      res.status(200).json({ url: `https://storage.googleapis.com/${bucket.name}/${blob.name}` });
    });

    stream.on('error', (err) => {
      res.status(500).json({ error: 'Upload failed', detail: err });
    });
  });
}
