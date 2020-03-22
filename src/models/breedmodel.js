import mongoose from 'mongoose'


//setup of dogmodel 
const Breed = mongoose.model('Breed', {
  // Properties defined here match the keys from the json file
  name: {
    type: String
  },
  description: {
    type: String
  },
  images: {
    url: {
      type: String
    },
  },
  activity: {
    type: [String],
    enum: ["High", "Medium", "Low"]
  },
  group: {
    type: [String],
    enum: ["Sport", "Working", "Toy", "Herding", "Foundation Stock", "Hound", "Terrier", "Non-sporting", "Miscellaneous", "Mixed breed"]
  },
  size: {
    type: [String],
    enum: ["XLarge", "Large", "Medium", "Small", "XSmall"],
  },
  weight: {
    type: String,
    default: ""
  },
  lifespan: {
    type: String,
    default: ""
  },
  lifespan: {
    type: String,
    default: ""
  },
})




module.exports = Breed

