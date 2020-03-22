import express from 'express'
import mongoose, { Query } from 'mongoose'

// Models
import Dog from '../models/dogmodel'
import Breed from '../models/breedmodel'

import createError from 'http-errors'

const router = express.Router()

// ------------------ BREED ROUTES  ------------------------- //

// Get breed by id
router.get('/id/:id', async (req, res, next) => {
  try {
    const breed = await Breed.findById(req.params.id)
    res.json(breed)
  }
  catch (err) {
    next(err)
  }
})

// Get all breeds
router.get('/', async (req, res, next) => {
  // This is a query object used to query breeds
  let breedQuery = {
    "name": new RegExp(req.query.breed, 'i'),
    "group": req.query.group ? { $in: (req.query.group).split(',') } : undefined,
    "activity": req.query.activity ? { $in: (req.query.activity).split(',') } : undefined,
    "size": req.query.size ? { $in: (req.query.size).split(',') } : undefined,
  }
  Object.keys(breedQuery).forEach(key => breedQuery[key] === undefined ? delete breedQuery[key] : {}) // Removes keys which are undefined (empty)

  try {
    const breeds = await Breed.find(breedQuery).sort('name')
    res.json(breeds)
  }
  catch (err) {
    next(err)
  }
})

module.exports = router
