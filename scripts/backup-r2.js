const {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} = require("@aws-sdk/client-s3")
const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = "components-code"
const BACKUP_DIR = path.join(__dirname, "../backups/r2")

async function downloadObject(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await client.send(command)

    // Ensure backup directory exists
    const filePath = path.join(BACKUP_DIR, key)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })

    // Save the file
    const writeStream = fs.createWriteStream(filePath)
    response.Body.pipe(writeStream)

    return new Promise((resolve, reject) => {
      writeStream.on("finish", resolve)
      writeStream.on("error", reject)
    })
  } catch (error) {
    console.error(`Error downloading ${key}:`, error)
    throw error
  }
}

async function backupBucket() {
  try {
    console.log("Starting R2 bucket backup...")

    // Create backup directory if it doesn't exist
    fs.mkdirSync(BACKUP_DIR, { recursive: true })

    let continuationToken = undefined

    do {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        ContinuationToken: continuationToken,
      })

      const response = await client.send(command)

      if (response.Contents) {
        for (const object of response.Contents) {
          console.log(`Downloading: ${object.Key}`)
          await downloadObject(object.Key)
        }
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    console.log("Backup completed successfully!")
  } catch (error) {
    console.error("Backup failed:", error)
    process.exit(1)
  }
}

backupBucket()
