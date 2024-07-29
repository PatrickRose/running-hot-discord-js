import {
  CategoryChannel,
  ChannelType,
  Guild,
  PermissionsBitField,
} from "discord.js";

export async function getCategory(
  guild: Guild,
  name: string,
  role: string,
  controlRole: string,
): Promise<CategoryChannel> {
  const channels = await guild.channels.fetch();
  const channel = channels.find((val) => {
    if (val === null) {
      return false;
    }

    return val.type === ChannelType.GuildCategory && val.name == name;
  });

  if (channel) {
    return channel as CategoryChannel;
  }

  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: controlRole,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: role,
        allow: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });
}
