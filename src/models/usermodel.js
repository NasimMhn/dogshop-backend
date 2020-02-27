import mongoose from 'mongoose'
import crypto from 'crypto'

const User = mongoose.model('User', {
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  },
  role: {
    type: String,
    required: true,
    enum: ["admin", "buyer", "seller"],
    default: "buyer"
  },
  details: {
    type: Object,
    default: UserDetail

  }
})

const UserDetail = mongoose.model('UserDetail', {
  phone: {
    type: String,
    default: ""
  },
  street: {
    type: String,
    default: ""
  },
  postalcode: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  }
})

module.exports = User