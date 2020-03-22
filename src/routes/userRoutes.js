import express from 'express'

import mongoose, { Query } from 'mongoose'



// Encryption
import bcrypt from 'bcrypt-nodejs'

// Models
import User from '../models/usermodel'

import createError from 'http-errors'

const router = express.Router()

// ------------------ USER ROUTES ------------------------- //

/* Authenticate the user, then go to next route */
router.get('/auth', async (req, res, next) => {
  console.log("GET /user/auth")
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken })
    if (user) {
      next()
    } else {
      throw new createError(403, 'You are not authorized to access this')
    }
  } catch (err) {
    next(err)
  }
})

/* Main endpoint for logged in user */
router.get('/auth', async (req, res, next) => {
  console.log("GET /user/auth - OK")

  res.json(true)
})


router.get('/id/:id', async (req, res, next) => {
  console.log("GET /user/id/", req.params.id)
  try {
    const authToken = req.header('Authorization')
    const user = await User.findOne({ accessToken: authToken, _id: req.params.id }).select('name email phone ')
    res.json(user)
  } catch (err) {
    next(err)
  }
})

router.get('/', async (req, res, next) => {
  console.log("GET /user")
  try {
    const user = await User.find().select("name email") // Select only name and email to be returned
    res.json(user)
  } catch (err) {
    next(err)
  }
})


router.post('/register', async (req, res, next) => {
  console.log("GET /user/register ", req.body)
  try {
    let { name, email, password, role } = req.body
    const user = await User.findOne({ email: email })
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

router.post('/login', async (req, res, next) => {
  console.log("GET /user/login", req.body)
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

module.exports = router
