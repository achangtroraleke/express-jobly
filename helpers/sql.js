const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
 
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']

  // dataToUpdate: An object containing the data to be updated. The keys of this object represent the column names, and the values represent the new values to be set in those columns.
  
  // jsToSql: An object representing a mapping from JavaScript object keys to SQL column names. This is useful when the keys in the dataToUpdate object do not match the column names in the database exactly. If a key in dataToUpdate matches a key in jsToSql, its corresponding value will be used as the column name in the SQL update statement. If no mapping is found, the original key will be used.
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // setCols: A string representing the SET clause in the SQL update statement. Each column to be updated is represented as "column_name"=$n, where n is the index of the parameter (starting from 1).
  
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
