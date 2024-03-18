"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new tester",
    salary: 200,
    equity:'1.0',
    company_handle:"c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    newJob['id'] = job.id
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${job.id}`);
  
    expect(result.rows).toEqual([
      {
        id:job.id,
        title: "new tester",
        salary: 200,
        equity:'1.0',
        company_handle:"c1"
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});


/************************************** findAll */

describe("findAll", function () {
  test("work: no filter", async function(){
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id:1,
        title:'tester1',
        salary:100,
        equity:"0.1",
        companyhandle:'c1'
      },
      {
        id:2,
        title:'tester2',
        salary:200,
        equity:"0.1",
        companyhandle:'c1'
      },
      {
        id:3,
        title:'tester3',
        salary:300,
        equity:"0.1",
        companyhandle:'c1'
      }
    ])
  });
  
  test("works: one filter", async function(){
    let jobs = await Job.findAll({title:'tester1'});
    expect(jobs).toEqual([{
      id:1,
      title: "tester1",
      salary: 100,
      equity:'0.1',
      companyhandle:"c1"
    }])
  });

  test("works: two filter", async function(){
    let jobs = await Job.findAll({title:'tester', minSalary:200});
    expect(jobs).toEqual([{
      id:2,
      title: "tester2",
      salary: 200,
      equity:'0.1',
      companyhandle:"c1"
    },
    {
      id:3,
      title: "tester3",
      salary: 300,
      equity:'0.1',
      companyhandle:"c1"
    }])
  });

 
});


/************************************** update */


describe("update", function () {
    const updateData = {
      title: "new tester",
      salary: 200,
      equity:'1.0',
      companyHandle:"c1"
    };
  
    test("works", async function () {
      let job = await Job.update(1, updateData);
    
      expect(job).toEqual({
        id: 1,
        ...updateData,
      });
      const result = await db.query(
        `SELECT id, title, salary, equity, company_handle
         FROM jobs
         WHERE id = 1`);
      expect(result.rows).toEqual([{
        id:1,
        title: "new tester",
        salary: 200,
        equity:'1.0',
        company_handle:"c1"
      }]);
        
    });

    test("works with null field", async function () {
      const updateDataWithNull = {
        title: "new tester",
        salary: null,
        equity:null,
        companyHandle:"c1"
      };
      let job = await Job.update(1, updateDataWithNull);
    
      expect(job).toEqual({
        id: 1,
        ...updateDataWithNull,
      });  
      const result = await db.query(
        `SELECT id, title, salary, equity, company_handle
         FROM jobs
         WHERE id = 1`);
         expect(result.rows).toEqual([{
          id:1,
          title: "new tester",
          salary: null,
          equity:null,
          company_handle:"c1"
        }]);
    });

    test("not found if no such job", async function () {
      try {
        await Job.update(1000000, updateData);
        fail();
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });

    test("bad request with no data", async function () {
      try {
        await Job.update(1, {});
        fail();
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });


});
/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id='1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(100);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});