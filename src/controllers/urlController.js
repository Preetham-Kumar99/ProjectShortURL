const mongoose = require('mongoose');

const urlModel = require('../models/urlModel');

const { validator, redisClient } = require('../utils')

const { promisify } = require("util");

const shortUrl = async function (req, res) {
    try {
        let long = req.body.url.trim();

        if (!long) {
            res.status(400).send({ Status: false, msg: "Url is Required" })
            return
        }

        if (!(validator.validateUrl(long))) {
            res.status(400).send({ Status: false, msg: "Please enter valid URL" })
            return
        }

        let shortUrl = await redisClient.GET_ASYNC(`${long}`)

        if (shortUrl) {
            let data = { longUrl: long, shortUrl: `localhost:3000/${shortUrl}`, urlCode: shortUrl }
            res.status(303).send({ Status: false, msg: "URL already exist in cache", data: data })
            return
        }



        let ifLongUrlExists = await urlModel.findOne({ longUrl: long }, { __v: 0, _id: 0 })

        if (ifLongUrlExists) {
            res.status(303).send({ Status: false, msg: "Url already exists in DB", data: ifLongUrlExists })
            return
        }

        let temp = true

        while (temp) {
            urlCode = validator.getrandom();
            let ifUrlCodeExists = await urlModel.findOne({ urlCode })
            if (!ifUrlCodeExists) {
                temp = false
            }
        }

        shortUrl = 'localhost:3000/' + urlCode



        let createUrl = {
            longUrl: long,
            shortUrl,
            urlCode
        }

        let newUrl = await urlModel.create(createUrl)

        await redisClient.SETEX_ASYNC(`${urlCode}`,3600, createUrl.longUrl);
        await redisClient.SETEX_ASYNC(`${createUrl.longUrl}`,3600, urlCode);

        let data = {longUrl: newUrl.longUrl, shortUrl: newUrl.shortUrl, urlCode: newUrl.urlCode }

        res.status(201).send({ Status: true, data: data })

    } catch (error) {
        res.status(500).send({ Status: false, msg: error.message })
    }
}



const getUrl = async function (req, res) {
    try {
        let code = req.params.shortUrl;

        if (!code) {
            res.status(400).send({ Status: false, msg: "Short Url is Required" })
            return
        }

        let longUrl = await redisClient.GET_ASYNC(`${code}`)

        if (longUrl) {
            console.log("url found in cache")
            res.status(301).redirect(longUrl)
            return
        }

        let ifUrlExists = await urlModel.findOne({ urlCode: code }, { __v: 0, _id: 0 })


        if (!ifUrlExists) {
            res.status(404).send({ Status: false, msg: "Url does not exists" })
            return
        }

        longUrl = ifUrlExists.longUrl
        await redisClient.SETEX_ASYNC(`${code}`,3600, longUrl);
        await redisClient.SETEX_ASYNC(`${longUrl}`,3600, code);
        res.status(301).redirect(longUrl)

    } catch (error) {
        res.status(500).send({ Status: false, msg: error.message })
    }
}

module.exports = {
    shortUrl,
    getUrl
}