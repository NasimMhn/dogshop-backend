


// Models
import User from './models/usermodel'
import Dog from './models/dogmodel'
import Breed from './models/breedmodel'

// JSON data
import dogData from './data/dogs.json'
import breedData from './data/breeds.json'
import userData from './data/users.json'

// Populating database with test data
const ResetDB = async () => {

  // Removing and repopulating breeds
  await Breed.deleteMany({})
  breedData.forEach((breed) => {
    new Breed(breed).save()
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
  console.log("Database is now reset")
}

export default ResetDB