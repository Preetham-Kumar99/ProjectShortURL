const mongoose = require('mongoose');
const validator = require('../utils/validator')

const UrlSchema = new mongoose.Schema({ 
    urlCode: { 
        type: String,
        required: true, 
        unique: true,
        lowercase: true, 
        trim: true 
    }, 
    longUrl: {
        type: String,
        required: "Long url is required", 
        validate: {
            validator: validator.validateUrl,
            message: "Please fill a valid URL",
            isAsync: false,
          }
    }, 
    shortUrl: {
        type: String,
        required: "shorturl is required", 
        unique:true
    }
})

module.exports = mongoose.model('Url', UrlSchema, "url")