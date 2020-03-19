import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose, { Query } from 'mongoose'
import bcrypt from 'bcrypt-nodejs'
import createError from 'http-errors'
import fileUpload from 'express-fileUpload'

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
app.use(fileUpload())
app.use(bodyParser.json())
app.use(express.static('public'))
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavailabale' })
  }
})

// ------------------ FILE UPLOAD ------------------------- //
app.post('/upload', async (req, res) => {
  console.log("\nreq.files", req.files)
  if (req.files === null) {
    console.log("\nno file uploaded\n")
    return res.status(400).json({ msg: 'No file uploaded' })
  }

  const file = req.files.file
  console.log("\nreq.files", req.files.file)
  file.mv(`${__dirname}/../public/uploads/${file.name}`, err => {
    console.log("\n file.mv \n")
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }
  })
  console.log("\nreq.files", req.files.file)
  res.json({ fileName: file.name, filePath: `/uploads/${file.name}` })
})

// ------------------ USER ROUTES ------------------------- //
/* Authenticate the user, then go to next route */
app.get('/auth', async (req, res, next) => {
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
app.get('/auth', async (req, res, next) => {
  const data = [
    "You are logged in"
  ]
  res.json(true)
})


app.get('/user', async (req, res, next) => {
  try {
    const user = await User.find()
    res.json(user)
  } catch (err) {
    next(err)
  }
})

app.get('/user/id/:id', async (req, res, next) => {
  console.log("req.params.id", req.params.id)
  try {
    const authToken = req.header('Authorization')
    console.log("req.authToken.id", authToken)
    const user = await User.findOne({ accessToken: authToken, _id: req.params.id }).select('name email phone ')
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
    console.log("email", email)
    const user = await User.findOne({ email: email })
    console.log("\n\n USER:", user)
    if (user === null) {
      const user = await new User({ name, email, password: bcrypt.hashSync(password), role }).save()
      res.status(201).json(user)
    } else {
      res.status(303).json("User already exist")
    }
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
      throw new Error(`User not found or password doesn't match`)
    }
  } catch (err) {
    next(err)
  }
})

// ------------------ DOG ROUTES ------------------------- //

// Get dog by id
app.get('/dog/id/:id', async (req, res, next) => {
  try {
    const dog = await Dog.findById(req.params.id)
      .populate({ path: 'owner', select: '-password -accessToken' }) // Removing sensitive user info
      .populate('race')


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
    console.log("user", user)
    if (user === null || user.role !== 'Seller') {
      throw createError(403, 'You are not authorized')
    }
    console.log("before creating dog")
    const dog = await new Dog(req.body).save()
    console.log("after saving dog: ", dog)
    res.json(dog)
  }
  catch (err) {
    console.log("error in POST: ", err)

    next(err)
  }
})

app.delete('/dog/:id', async (req, res, next) => {
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

// Get dog by id
app.get('/dogbreed/:id', async (req, res, next) => {
  try {
    const dograce = await DogRace.findById(req.params.id)
    res.json(dograce)
  }
  catch (err) {
    next(err)
  }
})


// /dogs?name=&group=&activity=&size=&sex=&minPrice=&maxPrice=&minAge=&maxAge=&location=
app.get('/dogs', async (req, res, next) => {

  // This is a query object used to query the dog races
  let raceQuery = {
    "name": new RegExp(req.query.race, 'i'),
    "group": req.query.group ? { $in: (req.query.group).split(',') } : undefined,
    "activity": req.query.activity ? { $in: (req.query.activity).split(',') } : undefined,
    "size": req.query.size ? { $in: (req.query.size).split(',') } : undefined,
  }
  Object.keys(raceQuery).forEach(key => raceQuery[key] === undefined ? delete raceQuery[key] : {}) // Removes keys which are undefined (empty)

  const dograces = await DogRace.find(raceQuery).select('_id')
  let race_ids = dograces.map(({ _id }) => (new mongoose.Types.ObjectId(_id))) // array with id's of filtered dog races

  // This is a query object used to query the dogs
  let dogQuery = {
    "owner": req.query.userId || undefined,
    "sex": req.query.sex ? req.query.sex : undefined,
    "price": { $gte: req.query.minPrice || 0, $lte: req.query.maxPrice || 9999999 },
    "location": req.query.location ? req.query.location : undefined,
  }
  Object.keys(dogQuery).forEach(key => dogQuery[key] === undefined ? delete dogQuery[key] : {}) // Removes keys which are undefined (empty)

  try {
    const dogs = await Dog.find(dogQuery).where('race').in(race_ids)
      .populate({ path: 'owner', select: '-password -accessToken' }) // Removing sensitive user info
      .populate('race')

    res.json(dogs)
  }
  catch (err) {
    next(err)
  }
})


// Get all dog races
app.get('/dogbreeds', async (req, res, next) => {

  // This is a query object used to query the dog races
  let raceQuery = {
    "name": new RegExp(req.query.race, 'i'),
    "group": req.query.group ? { $in: (req.query.group).split(',') } : undefined,
    "activity": req.query.activity ? { $in: (req.query.activity).split(',') } : undefined,
    "size": req.query.size ? { $in: (req.query.size).split(',') } : undefined,
  }
  Object.keys(raceQuery).forEach(key => raceQuery[key] === undefined ? delete raceQuery[key] : {}) // Removes keys which are undefined (empty)

  try {
    const dograces = await DogRace.find(raceQuery).sort('name')
    res.json(dograces)
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