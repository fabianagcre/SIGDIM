require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../sigdim_dev.sqlite'),
    logging: false,
  },
  test: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../sigdim_test.sqlite'),
    logging: false,
  },
  production: {
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../sigdim_prod.sqlite'),
    logging: false,
  },
};
