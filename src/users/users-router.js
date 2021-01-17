/* eslint-disable no-undef */
const express = require('express');
const path = require('path');
const { hashPassword } = require('./users-service');
const UsersService = require('./users-service');

const usersRouter = express.Router();
const jsonParser = express.json();

usersRouter
.post('/', jsonParser, (req, res, next)=> {
    const {password , user_name, full_name, nickname}  = req.body

    for(const field of ['full_name', 'user_name' , 'password'])
    if(!req.body[field])
        return res.status(400).json({
            error: `Missing '${field}' in request body`
        })

    const passwordError = UsersService.validatePassword(password)

    if(passwordError)
        return res.status(400).json({error : passwordError})

    UsersService.hasUserWithUsername(
        req.app.get('db'),
        user_name
    )
    .then(hasUserWithUsername => {
        if(hasUserWithUsername)
        return res.status(400).json({error: `Username already taken`})
        
        return UsersService.hashPassword(password)
        .then(hashPassword=> {

        const newUser = {
            user_name,
            password : hashPassword,
            full_name,
            nickname,
            date_created : 'now()',
        }
        return UsersService.insertUser(
            req.app.get('db'),
            newUser
        )
        .then(user => {
            res.status(201)
                .location(path.posix.join(req.originalUrl, `/${user.id}`))
                .json(UsersService.serializeUser(user))
        })
      })
    })
    .catch(next)

})

module.exports = usersRouter;