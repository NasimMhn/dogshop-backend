import express from 'express'
import mongoose, { Query } from 'mongoose'


// Models
import Dog from '../models/dogmodel'
import Breed from '../models/breedmodel'
import User from '../models/usermodel'

import createError from 'http-errors'


const router = express.Router()

// ------------------ DOG ROUTES ------------------------- //

// Get dog by id
router.get('/id/:id', async (req, res, next) => {
  try {
    const dog = await Dog.findById(req.params.id)
      .populate({ path: 'owner', select: '-password -accessToken' }) // Removing sensitive user info
      .populate('breed')


    res.json(dog)
  }
  catch (err) {
    next(err)
  }
})

// POST
router.post('/', async (req, res, next) => {
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken, _id: req.body.owner })
    if (user === null || user.role !== 'Seller') {
      throw createError(403, 'You are not authorized')
    }
    const dog = await new Dog(req.body).save()
    res.json(dog)
  }
  catch (err) {
    console.error("Error:", err)

    next(err)
  }
})

// DELETE
router.delete('/id/:id', async (req, res, next) => {
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


// GET dogs with query
// /dogs?name=&group=&activity=&size=&sex=&minPrice=&maxPrice=&minAge=&maxAge=&location=
router.get('/', async (req, res, next) => {
  console.log("Query: ", req.query)
  console.log("TEST")
  // This is a query object used to query breeds
  let breedQuery = {
    "name": new RegExp(req.query.breed, 'i'),
    "group": req.query.group ? { $in: (req.query.group).split(',') } : undefined,
    "activity": req.query.activity ? { $in: (req.query.activity).split(',') } : undefined,
    "size": req.query.size ? { $in: (req.query.size).split(',') } : undefined,
  }
  Object.keys(breedQuery).forEach(key => breedQuery[key] === undefined ? delete breedQuery[key] : {}) // Removes keys which are undefined (empty)

  const breeds = await Breed.find(breedQuery).select('_id')
  let breed_ids = breeds.map(({ _id }) => (new mongoose.Types.ObjectId(_id))) // array with id's of filtered breeds

  // This is a query object used to query the dogs
  let dogQuery = {
    "owner": req.query.userId || undefined,
    "sex": req.query.sex ? req.query.sex : undefined,
    "price": { $gte: req.query.minPrice || 0, $lte: req.query.maxPrice || 9999999 },
    "location": req.query.location ? req.query.location : undefined,
  }
  Object.keys(dogQuery).forEach(key => dogQuery[key] === undefined ? delete dogQuery[key] : {}) // Removes keys which are undefined (empty)

  try {
    const dogs = await Dog.find(dogQuery).where('breed').in(breed_ids)
      .populate({ path: 'owner', select: '-password -accessToken' }) // Removing sensitive user info
      .populate('breed')

    res.json(dogs)
  }
  catch (err) {
    next(err)
  }
})

module.exports = router
