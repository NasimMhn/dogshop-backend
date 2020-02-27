import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import Seller from '../lib/user/sellermodel'
// import Dog from '../lib/dogdata/dogmodel'
// import Shopper from '../lib/user/shoppermodel'
import bcrypt from 'bcrypt-nodejs'
import createError from 'http-errors'



const app = express()

// MIDDLEWARES to enable cors and json body parsing
app.use(cors())
app.use(bodyParser.json())
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailabale' })
  }
})

// ------------------ Seller ROUTES ------------------------- //

/* Authenticate the seller, then go to next route */
app.get('/', async (req, res, next) => {
  try {
    const authToken = req.header('Authorization')
    const seller = await Seller.findOne({ accessToken: authToken })
    if (seller) {
      next()
    } else {
      throw new createError(403, 'you are not authorized to access this') // TODO fix status code in error handling
    }
  } catch (err) {
    next(err)
  }
})

/* Main endpoint for logged in sellers */
app.get('/', async (req, res, next) => {
  const data = [
    'This is a secret message',
    'This is another secret message',
    `This is a third secret message, don't tell`
  ]
  res.json(data)
})

app.get('/', (req, res) => {
  res.send('Hello world')
})


/* Admin endpoint - to be removed */
app.get('/seller', async (req, res, next) => {
  try {
    const sellers = await Seller.find()
    res.json(sellers)
  } catch (err) {
    next(err)
  }
})


app.post('/registration', async (req, res, next) => {
  console.log(req.body)
  try {
    let { name, email, password } = req.body
    name = name.replace(name.slice(0, 1), name.slice(0, 1).toUpperCase())
    const newSeller = await new Seller({ name, email, password: bcrypt.hashSync(password) }).save()
    res.status(201).json(newSeller)
  } catch (err) {
    next(err)
  }
})

app.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    console.log(res)
    const seller = await Seller.findOne({ email: email })
    if (seller && bcrypt.compareSync(password, seller.password)) {
      seller.password = undefined /* we don't want to send the password hash to the client */
      res.json(seller)
    } else {
      throw new Error(`user not found or password doesn't match`)
    }
  } catch (err) {
    next(err)
  }
})



/* Error handling */
app.use((req, res) => {
  res.status(404).json({ error: `route ${req.originalUrl} doesn't exist` })
})
app.use((err, res) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message })
})

// ------------------ Dogs ROUTES ------------------------- //



module.exports = app