import {
  APIInteractionGuildMember,
  Guild,
  GuildMember,
  Snowflake,
} from "discord.js";
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

export async function userIsControl(
  guild: Guild | string,
  member: GuildMember | APIInteractionGuildMember,
): Promise<boolean> {
  const controlRole = await getRoleForGuild(
    typeof guild == "string" ? guild : guild.id,
    "control",
  );

  if (!controlRole) {
    return false;
  }

  const roles = member.roles;

  if (Array.isArray(roles)) {
    return roles.includes(controlRole);
  }

  return roles.cache.has(controlRole);
}
export async function userIsOnRun(
  guild: Guild,
  member: GuildMember | APIInteractionGuildMember,
): Promise<boolean> {
  const roles = member.roles;

  if (Array.isArray(roles)) {
    for (let role of roles) {
      const guildRole = await guild.roles.fetch(role);
      if (!guildRole) {
        continue;
      }

      if (guildRole.name.startsWith("run-")) {
        return true;
      }
    }
    return false;
  }

  return roles.cache.find((val) => val.name.startsWith("run-")) !== undefined;
}
