import {DataTypes, InferAttributes, InferCreationAttributes, Model, Sequelize} from "sequelize";
import {ALL_CORPORATIONS, Corporation} from "../types/corporations";

export const db = new Sequelize(
    'running-hot',
    'user',
    'password',
    {
        host: 'localhost',
        dialect: 'sqlite',
        logging: false,
        // SQLite only
        storage: 'running-hot.sqlite',
    }
);

export interface RoleModel extends Model<InferAttributes<RoleModel>, InferCreationAttributes<RoleModel>> {
    // Some fields are optional when calling UserModel.create() or UserModel.build()
    guildId: string,
    roleId: string,
    corporation: Corporation|'control'
}

export const roles = db.define<RoleModel>(
    'Roles',
    {
        guildId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        roleId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        corporation: {
            type: DataTypes.ENUM('control', ...ALL_CORPORATIONS),
            primaryKey: true,
        }
    }
);



export async function runMigrations(): Promise<void> {
    const models = [
        roles
    ];

    for (let model of models) {
        await model.sync();
    }
}
