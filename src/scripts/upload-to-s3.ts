import 'dotenv/config'; // Load .env file at the very top
import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { readdir } from 'fs/promises';
import { join, resolve, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createHash } from 'crypto';
import { createReadStream, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROJECT_ROOT = resolve(__dirname, '..', '..');
const OUT_DIR = resolve(PROJECT_ROOT, 'out');

function calculateMD5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = createHash('md5');
        const stream = createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex'))); // S3 ETag is hex-encoded MD5
        stream.on('error', (err) => reject(err));
    });
}

async function uploadDirectoryToS3(bucketName: string, sync: boolean, dry: boolean) {
    const s3Client = new S3Client({});

    console.log(`Starting upload of '${OUT_DIR}' to S3 bucket '${bucketName}'...`);
    if (sync) {
        console.log('Sync mode enabled: checking for existing files and comparing hashes.');
    }
    if (dry) {
        console.log('Dry run mode enabled: no files will be uploaded.');
    }

    try {
        const filesToUpload: string[] = [];

        async function getFiles(dir: string) {
            const entries = await readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                if (entry.isDirectory()) {
                    await getFiles(fullPath);
                } else {
                    filesToUpload.push(fullPath);
                }
            }
        }

        await getFiles(OUT_DIR);

        if (filesToUpload.length === 0) {
            console.log('No files found in the /out directory to upload.');
            return;
        }

        let remoteHashes = new Map<string, string | undefined>();
        if (sync) {
            console.log('Fetching remote file metadata...');
            const command = new ListObjectsV2Command({ Bucket: bucketName });
            const { Contents } = await s3Client.send(command);
            if (Contents) {
                remoteHashes = new Map(Contents.map(obj => [obj.Key!, obj.ETag?.replace(/"/g, '')]));
            }
            console.log(`Found ${remoteHashes.size} remote files.`);
        }

        for (const filePath of filesToUpload) {
            const destination = relative(OUT_DIR, filePath).split('\\').join('/');

            if (sync) {
                const remoteHash = remoteHashes.get(destination);
                if (remoteHash) {
                    const localHash = await calculateMD5(filePath);
                    if (localHash === remoteHash) {
                        console.log(`Skipping ${filePath} (hashes match)`);
                        continue;
                    }
                    console.log(`Hashes for ${filePath} differ. Re-uploading.`);
                }
            }

            if (dry) {
                console.log(`[DRY RUN] Would upload ${filePath} to s3://${bucketName}/${destination}`);
            } else {
                console.log(`Uploading ${filePath} to s3://${bucketName}/${destination}`);
                const fileContent = readFileSync(filePath);
                const command = new PutObjectCommand({
                    Bucket: bucketName,
                    Key: destination,
                    Body: fileContent,
                });
                await s3Client.send(command);
                console.log(`Uploaded ${destination}`);
            }
        }

        console.log('All files processed successfully!');
    } catch (error) {
        console.error('Error during upload:', error);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
const bucketName = args.find(arg => !arg.startsWith('--'));

if (!bucketName) {
    console.error('Please provide a bucket name as an argument.');
    process.exit(1);
}
;
const sync = args.includes('--sync');
const dry = args.includes('--dry');

uploadDirectoryToS3(bucketName, sync, dry).catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
