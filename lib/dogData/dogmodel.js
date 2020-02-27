import mongoose from 'mongoose'


//setup of dogmodel 
const Dog = mongoose.model('Dog', {
  // Properties defined here match the keys from the json file
  ras: {
    type: String
  },
  age: {
    type: String
  },
  price: {
    type: Number
  },
  sex: {
    type: String
  },
  listed_in: {
    type: String
  },
  description: {
    type: String
  },
  location: {
    type: String
  },
  addedAt: {
    type: String
  },
  seller: {
    type: String
  },
})

module.exports = Dog

