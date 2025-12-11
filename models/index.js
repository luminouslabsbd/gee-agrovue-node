/**
 * Models Index
 * Exports all Sequelize models
 */

const User = require('./User');
const Field = require('./Field');
const FieldAnalysis = require('./FieldAnalysis');

// Define associations if needed
User.hasMany(Field, { foreignKey: 'user_id', sourceKey: 'user_id' });
Field.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

User.hasMany(FieldAnalysis, { foreignKey: 'user_id', sourceKey: 'user_id' });
FieldAnalysis.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });

Field.hasMany(FieldAnalysis, { foreignKey: 'field_id', sourceKey: 'field_id' });
FieldAnalysis.belongsTo(Field, { foreignKey: 'field_id', targetKey: 'field_id' });

module.exports = {
  User,
  Field,
  FieldAnalysis
};
