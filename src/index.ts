import express from 'express'
import 'dotenv/config'

const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('My API is alive! 😍')
})

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`)
})
