const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

const User = require('./User')(sequelize);

const Routine = sequelize.define('Routine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('morning', 'night', 'weekly'),
    allowNull: false
  },
  products: {
    type: DataTypes.JSON,
    allowNull: false
  },
  dietPlan: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

const Progress = sequelize.define('Progress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  morningDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  nightDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  weeklyDone: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

const AnalysisRecord = sequelize.define('AnalysisRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  skinType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  markers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
});

// Associations
User.hasMany(Routine, { foreignKey: 'userId', onDelete: 'CASCADE' });
Routine.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Progress, { foreignKey: 'userId', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(AnalysisRecord, { foreignKey: 'userId', onDelete: 'CASCADE' });
AnalysisRecord.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, Routine, Progress, AnalysisRecord };
