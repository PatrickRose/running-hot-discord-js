import { Guild } from "discord.js";
import { RoleModel, roles } from "../db";

export async function getRoleForGuild(
  guild: Guild["id"],
  corporation: RoleModel["corporation"],
): Promise<string | null> {
  const row = await roles.findOne({
    where: {
      guildId: guild,
      corporation: corporation,
    },
  });

  if (row === null) {
    return null;
  }

  return row.roleId;
}
