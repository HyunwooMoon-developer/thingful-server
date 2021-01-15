/* eslint-disable no-undef */
const knex = require('knex');
const supertest = require('supertest');
const app =require('../src/app');
const helpers = require('./test-helpers');

describe.only('Protected Endpoints', ()=> {
    let db;

    const{
        testUsers,
        testThings,
        testReviews,
    } = helpers.makeThingsFixtures()
    before('make knex instance' , ()=> {
        db = knex({
            client : 'pg',
            connection : process.env.TEST_DB_URL,
        })
        app.set('db', db)
    })
    after('disconnect from db' , () => db.destroy())
    before('cleanup' , () => helpers.cleanTables(db))
    afterEach('cleanup' , () => helpers.cleanTables(db))

    beforeEach('insert things', ()=> 
        helpers.seedThingsTables(
            db,
            testUsers,
            testThings,
            testReviews
        )
    )
    const protectedEndpoint = [
        {
            name: 'GET /api/things/:thing_id',
            path: '/api/things/1',
            method: supertest(app).get,
        },
        {
            name: 'GET /api/things/:thing_id/reviews',
            path: '/api/things/1/reviews',
            method: supertest(app).get,
        },
        {
            name: 'POST /api/reviews',
            path: '/api/reviews',
            method: supertest(app).post
        }
    ]

    protectedEndpoint.forEach(endpoint => {
        describe(endpoint.name, ()=> {
            it(`Responds 401 'Missing Basic Token' when no bearer token` ,()=> {
                return endpoint.method(endpoint.path)
                    .expect(401, {error: `Missing bearer token`})
            })
            it(`Responds 401 'Unauthorized Request' when invalid JWT secret`, ()=> {
                const validsUser = testUsers[0]
                const invalidUser = 'bad-secret'
                return endpoint.method(endpoint.path)
                .set('Authorization' , helpers.makeAuthHeader(validsUser, invalidUser))
                .expect(401, {error: `Unauthorized Request`})
            })
            it(`Responds 401 'Unauthorized Request' when invalid sub in payload` , ()=> {
                const invalidUser = {user_name : 'user-not-existy' , id : 1}
                return endpoint.method(endpoint.path)
                        .set('Authorization' , helpers.makeAuthHeader(invalidUser))
                        .expect(401, {
                            error: `Unauthorized Request`
                        })
                    })
      
        })
    })

})