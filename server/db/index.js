const mongoose = require('mongoose')

mongoose
    .connect('mongodb://campos:campos1234@mongo-container:27017/cinema')
    .then(() => {
        console.log('Connected to the database')
    })
    .catch(e => {
        console.error('Connection error', e.message)
    })

const db = mongoose.connection

module.exports = db
