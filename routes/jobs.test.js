"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");
const Test = require("supertest/lib/test");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function(){
   
    test("ok for users", async function(){
        const newJob = {
            title:"newest job",
            salary:100,
            equity:'0.1',
            company_handle:'c1'
        };
        const  resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        newJob['id'] = resp.body.job.id
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job:newJob,
        });
    });

    test("bad request with missing data", async function(){
        const newJob = {
            title:"newest job",
            salary:100,
            equity:'0.1',
            company_handle:'c1'
        };
        const resp = await request(app)
            .post("/jobs")
            .send({...newJob, salary:"str",})
            .set("authorization", `Bearer ${u1Token}`);
         
        expect(resp.statusCode).toEqual(400)
    })
})

/************************************** GET /jobs */

describe("GET /jobs", function(){
    test("ok for anon", async function(){
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs:
            [
                {
                    id: 1,
                    title:"tester1",
                    salary:100,
                    equity:'0.1',
                    companyhandle:'c1'
                }
            ]
        });
    });

    test("fails: test next() id", async function(){
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function(){
    test("works for anon", async function(){
        const resp = await request(app)
        .get("/jobs/1");
        expect(resp.body).toEqual({
            job:{
                id: 1,
                title:"tester1",
                salary:100,
                equity:'0.1',
                companyhandle:'c1'
            }
        })
    });

    test("not found for no job at id", async function(){
        const resp = await request(app).get(`/jobs/100`);
        expect(resp.statusCode).toEqual(404);
    })
})

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id",function(){
    test("works for admin", async function(){
        const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            salary:0
        })
        .set("authorization", `Bearer ${u1Token}`);
        
        expect(resp.body).toEqual({
            job:{
                id: 1,
                title:"tester1",
                salary:0,
                equity:'0.1',
                companyHandle:'c1'
            }
        })
        
    });

    test("unauth for anon", async function(){
        const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            salary:0
        })
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function(){
        const resp = await request(app)
            .patch("/jobs/900")
            .send({
                salary:0
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
        
    });

    test("bad request on id change attempt", async function(){
        const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            id:2
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function(){
        const resp = await request(app)
        .patch(`/jobs/1`)
        .send({
            salary:'test'
        })
        .set('authorization', `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    })
})

describe("DELETE /jobs/id", function(){
    test("works for admin", async function (){
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({'deleted':'1'});
    });

    test("unauth for anon", async function(){
        const resp = await request(app)
            .delete(`/jobs/1`);
        expect(resp.statusCode).toEqual(401)
    });

    test("not found for no such job", async function(){
        const resp = await request(app)
            .delete(`/jobs/100`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    })
})