import {
  Association,
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { ALL_CORPORATIONS, Corporation } from "../types/corporations";

export const db = new Sequelize("running-hot", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  // SQLite only
  storage: "running-hot.sqlite",
});

export interface RoleModel
  extends Model<
    InferAttributes<RoleModel>,
    InferCreationAttributes<RoleModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  guildId: string;
  roleId: string;
  corporation: Corporation | "control";
}

export const roles = db.define<RoleModel>("Roles", {
  guildId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  roleId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
  },
  corporation: {
    type: DataTypes.ENUM("control", ...ALL_CORPORATIONS),
    primaryKey: true,
  },
});

export interface FacilityModel
  extends Model<
    InferAttributes<FacilityModel>,
    InferCreationAttributes<FacilityModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  id: CreationOptional<number>;
  guildId: string;
  corporation: Corporation;
  facilityName: string;
  facilityType: string;
  text: string;
  voice: string;
  Runs?: NonAttribute<Run[]>;
}

export const facilities = db.define<FacilityModel>(
  "Facilities",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    corporation: {
      type: DataTypes.ENUM(...ALL_CORPORATIONS),
      allowNull: false,
    },
    facilityName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    facilityType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
    },
    voice: {
      type: DataTypes.STRING,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["guildId", "corporation", "facilityName"],
      },
    ],
  },
);

export class Run extends Model<
  InferAttributes<Run>,
  InferCreationAttributes<Model>
> {
  declare id: CreationOptional<number>;
  declare roleId: string;
  declare Facility?: NonAttribute<FacilityModel>;
  declare FacilityId: ForeignKey<number>;
}

Run.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    roleId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "Runs",
  },
);

facilities.hasMany(Run);
Run.belongsTo(facilities);

export async function runMigrations(): Promise<void> {
  await db.sync();
}
