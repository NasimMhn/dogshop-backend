import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose, { Query } from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import createError from 'http-errors'

// Models
import User from './models/usermodel'
import Dog from './models/dogmodel'
import DogRace from './models/dogracemodel'

// JSON data
import dogData from './data/dogs.json'
import dograceData from './data/dograces.json'
import userData from './data/users.json'

const app = express()

console.log(`\nRESET_DB: ${process.env.RESET_DB} \n`)

if (process.env.RESET_DB) {

  // Populating database with test data
  const seedDatabase = async () => {

    // Removing and repopulating dog races
    await DogRace.deleteMany({})
    dograceData.forEach((race) => {
      new DogRace(race).save()
    })

    // Removing and repopulating users
    await User.deleteMany({})
    userData.forEach((user) => {
      new User(user).save()
    })

    // Removing and repopulating dogs
    await Dog.deleteMany({})
    dogData.forEach((dog) => {
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
/* Authenticate the user, then go to next route */
app.get('/', async (req, res, next) => {
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken })
    if (user) {
      next()
    } else {
      throw new createError(403, 'you are not authorized to access this')
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
    const user = await User.find().select("name email") // Select only name and email to be returned
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
    const user = await User.findOne({ email: email })
    if (user && bcrypt.compareSync(password, user.password)) {
      user.password = undefined // we don't want to send the password hash to the client
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
    const dogs = await Dog.find().populate('race owner')

    // Removing sensitive user info
    dogs.map(dog => {
      dog.owner.password = undefined
      dog.owner.accessToken = undefined
    })

    res.json(dogs)
  }
  catch (err) {
    next(err)
  }
})

// Get dog by id
app.get('/dog/id/:id', async (req, res, next) => {
  try {
    const dog = await Dog.findById(req.params.id).populate('race owner')
    // Removing sensitive user info
    dog.owner.password = undefined
    dog.owner.accessToken = undefined


    res.json(dog)
  }
  catch (err) {
    next(err)
  }
})

app.post('/dog', async (req, res, next) => {

  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken, _id: req.body.owner })
    console.log(user)
    if (user === null || user.role !== 'Seller') {
      throw createError(403, 'You are not authorized')
    }
    const dog = await new Dog(req.body).save()
    res.json(dog)
  }
  catch (err) {
    next(err)
  }
})

app.delete('/dog/id/:id', async (req, res, next) => {
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken })
    const dog = await Dog.findById(req.params.id)

    // If no dog found
    if (dog == null) {
      throw createError(404, 'No dog with this id found')
    }
    // If no user found, or id from user object and owner does not match
    // N.B. object id's must be compared as strings
    if (user === null || String(user._id) !== String(dog.owner._id)) {
      throw createError(403, 'You are not authorized')
    }
    dog.deleteOne()
    res.json(dog).status(204)
  }
  catch (err) {
    next(err)
  }
})


// Get all dog races
app.get('/dograces', async (req, res, next) => {

  let queryObj = {}
  if (req.query.name) { queryObj['name'] = new RegExp(req.query.name, 'i') }
  if (req.query.group) { queryObj['group'] = req.query.group } // fix so can query multiple groups
  if (req.query.activity) { queryObj['activity'] = req.query.activity } // fix so can query multiple activities
  if (req.query.size) { queryObj['size'] = req.query.size } // fix so can query multiple sizes

  console.log("req.body", req.query)
  console.log("queryObj", queryObj)

  try {
    const dograces = await DogRace.find(queryObj).sort('name')
    res.json(dograces)
  }
  catch (err) {
    next(err)
  }
})

// Get dog by id
app.get('/dograce/id/:id', async (req, res, next) => {
  try {
    const dograce = await DogRace.findById(req.params.id)
    res.json(dograce)
  }
  catch (err) {
    next(err)
  }
})


// ------------------ ERROR HANDLING ROUTES ------------------------- //
app.use((req, res) => {
  res.status(404).json({ error: `route ${req.originalUrl} doesn't exist` })
})
app.use((err, res) => {
  const status = err.status || 500
  res.status(status).json({ error: err.message })
})

module.exports = app