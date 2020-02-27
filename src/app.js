import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import User from './models/usermodel'
import Dog from './models/dogmodel'
import data from './data/dogs.json'
import bcrypt from 'bcrypt-nodejs'
import createError from 'http-errors'



const app = express()

// environment variable 
console.log(process.env.RESET_DB)
if (process.env.RESET_DB) {
  const seedDatabase = async () => {
    await Dog.deleteMany({})
    data.forEach((dog) => {
      new Dog(dog).save()
    })
  }
  seedDatabase()
}


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

app.get('/', (req, res) => {
  res.send('Hello world')
})

// ------------------ USER ROUTES ------------------------- //

/* Authenticate the seller, then go to next route */
app.get('/', async (req, res, next) => {
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken })
    if (seller) {
      next()
    } else {
      throw new createError(403, 'you are not authorized to access this') // TODO fix status code in error handling
    }
  } catch (err) {
    next(err)
  }
})

/* Main endpoint for logged in user */
app.get('/', async (req, res, next) => {
  const data = [
    "You are logged in"
  ]
  res.json(data)
})

/* user endpoint */
app.get('/user', async (req, res, next) => {
  try {
    const user = await User.find()
    res.json(user)
  } catch (err) {
    next(err)
  }
})

app.get('/users', async (req, res, next) => {
  try {
    // selects name and email to be returned
    const user = await User.find().select("name email")
    res.json(user)
  } catch (err) {
    next(err)
  }
})


app.post('/register', async (req, res, next) => {
  console.log("/register", req.body)
  try {
    let { name, email, password, role } = req.body
    const user = await new User({ name, email, password: bcrypt.hashSync(password), role }).save()
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
})

app.post('/login', async (req, res, next) => {
  console.log("/login", req.body)
  try {
    const { email, password } = req.body
    console.log(res)
    const user = await User.findOne({ email: email })
    if (user && bcrypt.compareSync(password, user.password)) {
      user.password = undefined /* we don't want to send the password hash to the client */
      res.json(user)
    } else {
      throw new Error(`user not found or password doesn't match`)
    }
  } catch (err) {
    next(err)
  }
})

// ------------------ DOG ROUTES ------------------------- //

// Get all dogs
app.get('/dogs', async (req, res, next) => {
  try {
    const dogs = await Dog.find()
    res.json(dogs)
  }
  catch(err) {
    next(err)
  }
})

// Get dog by id
app.get('/dog/:id', async (req, res, next) => {
  try {
    const dog = await Dog.findOne({_id: req.params.id})
    res.json(dog)
  }
  catch(err) {
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





module.exports = app