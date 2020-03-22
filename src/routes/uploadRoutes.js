import path from 'path'

import mongoose from 'mongoose'
import express from 'express'

import multer from 'multer'
import MulterGridfsStorage from 'multer-gridfs-storage'
import Grid from 'gridfs-stream'
import crypto from 'crypto'

const router = express.Router()

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/dogshop"

// UPLOADING SETTINGS
const conn = mongoose.createConnection(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
let gfs

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo)
  gfs.collection('upload')
})

// Create storage engine
export const storage = new MulterGridfsStorage({
  url: mongoUrl,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err)
        }
        const filename = buf.toString('hex') + path.extname(file.originalname)
        const fileInfo = {
          filename: filename,
          bucketName: 'upload'
        }
        resolve(fileInfo)
      })
    })
  }
})

const upload = multer({ storage })

// Upload file
router.post('/', upload.single('file'), (req, res) => {
  console.log(`POST /upload/`)
  res.json({ file: req.file })
})

// Get all files
router.get('/', (req, res) => {
  console.log(`GET /upload/`)
  gfs.files.find().toArray((err, files) => {
    // Check if files exist
    if (!files || files.length === 0) {
      return res.status(404).json({ errorMsg: "No file exist" })
    }
    // If files exist
    return res.json(files)
  })
})

// Get all files
router.get('/filename/:filename', (req, res) => {
  console.log(`GET /upload/filename/${req.params.filename}`)
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({ errorMsg: "No file exist" })
    }
    return res.json(file)
  })
})

// Get all files
router.get('/image/:filename', (req, res) => {
  console.log(`GET /upload/image/${req.params.filename}`)
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({ errorMsg: "No file exist" })
    }
    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readStream = gfs.createReadStream({ filename: file.filename })
      console.log(`DONE`)
      readStream.pipe(res)
    }
    else {
      res.status(404).json({ errorMsg: "Not an image" })
    }

  })
})

module.exports = router
