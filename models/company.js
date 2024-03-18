"use strict";


const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(paramsObj=undefined) {
    let cond_string = '';
    if(paramsObj){
      const {name, minEmployees, maxEmployees} = paramsObj
      if(minEmployees > maxEmployees){
        throw new BadRequestError("minEmployees parameter cannot be greater than maxEmployees parameter")
      }
      
      if(name || minEmployees || maxEmployees){
        cond_string += 'WHERE ';
      
        for(const props in paramsObj){
          if(props==='name' && cond_string.length === 6){
            cond_string += `UPPER(${props}) LIKE UPPER('%${paramsObj[props]}%')`
          }else if(props==='name'){
            cond_string += ` AND UPPER(${props}) LIKE UPPER('%${paramsObj[props]}%')`

          }
          if(props==='minEmployees' && cond_string.length ===6){
            cond_string += `num_employees >= ${minEmployees}`
          }else if(props==='minEmployees'){
            cond_string += ` AND num_employees >= ${minEmployees}`

          }
          if(props==='maxEmployees' && cond_string.length === 6){
            cond_string += `num_employees <= ${maxEmployees}`
          }else if(props==='maxEmployees'){
            cond_string += ` AND num_employees <= ${maxEmployees}`

          }
        }
      }
    }
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies ${cond_string}
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const jobRes = await db.query(
      `SELECT *
      FROM jobs
      WHERE company_handle = $1`,
      [handle]
    )
    
    const job = jobRes.rows
    const company = companyRes.rows[0];
    
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    company['jobs'] = job;
    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
  
  
}


module.exports = Company;
