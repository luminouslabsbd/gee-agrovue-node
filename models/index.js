/**
 * Models Index
 * Central export for all MongoDB models
 */

const User = require('./User');
const Field = require('./Field');
const FieldAnalysis = require('./FieldAnalysis');

module.exports = {
  User,
  Field,
  FieldAnalysis
};

