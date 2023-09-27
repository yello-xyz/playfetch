import { Bucket, Storage } from '@google-cloud/storage'
import { Readable } from 'stream'
import https from 'https'

let storage: Storage
const getStorage = () => {
  if (!storage) {
    storage = new Storage()
  }
  return storage
}

export const getProjectID = async () => getStorage().getProjectId()

let bucket: Bucket
const getFile = (fileName: string) => {
  if (!bucket) {
    bucket = getStorage().bucket(process.env.GCLOUD_STORAGE_BUCKET ?? '')
  }
  return bucket.file(fileName)
}

export async function uploadImageURLToStorage(fileName: string, imageURL: string): Promise<string> {
  const projectID = await getStorage().getProjectId()
  const file = getFile(fileName)
  const outputStream = file.createWriteStream({ userProject: projectID, resumable: false })
  const inputStream = await new Promise<Readable>(resolve => https.get(imageURL, response => resolve(response)))
  inputStream.pipe(outputStream)
  return new Promise<string>(resolve =>
    outputStream
      .on('finish', () => resolve(getFile(file.name).publicUrl()))
      .on('error', err => {
        console.error(err.message)
        resolve(imageURL)
      })
  )
}
