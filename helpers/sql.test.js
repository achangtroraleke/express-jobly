const {sqlForPartialUpdate} = require('./sql');
const { BadRequestError } = require("../expressError");
describe('sqlForPartialUpdate', () => {
    it('should generate SQL syntax for a partial update operation', () => {
      const dataToUpdate = { firstName: 'John', age: 30 };
      const jsToSql = { firstName: 'first_name' };
      const expectedSql = {
        setCols: '"first_name"=$1, "age"=$2',
        values: ['John', 30]
      };
  
      const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
  
      expect(result).toEqual(expectedSql);
    });
  
    it('should throw BadRequestError if no data is provided', () => {
      const dataToUpdate = {};
      const jsToSql = {};
  
      expect(() => {
        sqlForPartialUpdate(dataToUpdate, jsToSql);
      }).toThrow(BadRequestError);
    });
  });