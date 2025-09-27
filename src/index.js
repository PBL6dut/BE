const express = require('express')
const app = express()
const port = 3000
const cors = require('cors')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use('/public', express.static('public')) // Cho phép truy cập tệp tĩnh trong thư mục 'public'

app.use('/api', require('./routes/index'))

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})