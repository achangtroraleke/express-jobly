"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related funcitons for jobs */

class Job{

    static async create({title, salary, equity, company_handle}){

          /** Create a job (from data), update db, return new company data.
         *
         * data should be {title, salary, equity, company_handle}
         *
         * Returns {id, title, salary, equity, company_handle}
         *
         * Throws BadRequestError if company already in database.
         * */
        const duplicateCheck = await db.query(
            `SELECT id
            FROM jobs
            WHERE title = $1`,
            [title]);
        
        if(duplicateCheck.rows[0]){
            throw new BadRequestError(`Duplicate job: ${title}`)
        }

        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle`,
            [
                title,
                salary,
                equity,
                company_handle
            ],
        );
        const job = result.rows[0];
       
        return job;
    }
    
    /** Find all jobs.
     *
     * Allows filtering of title, minSalary, equity
     * Returns [{id, title, salary, equity, company_handle}, ...]
     * */
    static async findAll(paramsObj=undefined){
        let cond_string = '';
        if(paramsObj){

            const {title, minSalary, hasEquity} = paramsObj;

            if(title || minSalary || hasEquity){
                cond_string += 'WHERE ';
                for(const props in paramsObj){
                    
                    if(props ==='title'){
                        if(cond_string.length > 6){
                            cond_string += 'AND '
                        }
                        cond_string += `UPPER(${props}) LIKE UPPER('%${paramsObj[props]}%') `
                    }
                    else if(props==='minSalary'){
                        if(cond_string.length > 6){
                            cond_string += 'AND '
                        }
                        cond_string += `salary >= ${paramsObj[props]} `
                    }else if(props==='hasEquity' && paramsObj['hasEquity']==='true'){
                        if(cond_string.length > 6){
                            cond_string += 'AND '
                        }
                        if(paramsObj['hasEquity']==='true'){
                            cond_string += 'equity > 0';
                           
                        }
                    }
                }
            }  
       
        }
        
        const jobRes = await db.query(
            `SELECT title,
            id,
            salary,
            equity,
            company_handle AS companyHandle
            FROM jobs
            ${cond_string}
            `
        )
        return jobRes.rows;
    }


    /** Given a jobs id, return data about job.
     *
     * Returns {id, title, salary, equity, company_handle}
     
     *
     * Throws NotFoundError if not found.
     **/
    static async get(id){
 
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS companyHandle
            FROM jobs
            WHERE id = $1;`,
            [id]);
        const job = jobRes.rows[0]
  
        if(!job) throw new NotFoundError(`No job with the id ${id}`)
        return job;
    }

    /** Update company data with `data`.
     *
     * This is a "partial update" --- it's fine if data doesn't contain all the
     * fields; this only changes provided ones.
     *
     * Data can include: { title, salary, equity, company_handle}
     *
     * Returns {id, title, salary, equity, company_handle}
     *
     * Throws NotFoundError if not found.
     */

    static async update(id, data){
        const {setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle:'company_handle'
            }
        );
        const handleVarIdx =  "$" + (values.length +1);
        
        const querySql = `UPDATE jobs
                          SET ${setCols}
                          WHERE id = ${handleVarIdx}
                          RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle AS "companyHandle"`;
        
        const result = await db.query(querySql, [...values, id]);
     
        const job = result.rows[0];
        if(!job) throw new NotFoundError(`No job with id: ${id}`);
        return job
    }
    /** Delete given job from database; returns undefined.
     *
     * Throws NotFoundError if company not found.
     **/
    static async remove(id){
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id=$1
            RETURNING id`,
            [id]
        );
        const job = result.rows[0];
        if(!job) throw new NotFoundError(`No job with id: ${id}`);
    }
}


module.exports = Job;