import mongoose from 'mongoose'
import app from './src/app.js'

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/dogShopAPI"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

//   PORT=9000 npm start
const port = process.env.PORT || 8080

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
