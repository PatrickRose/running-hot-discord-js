import {
  CategoryChannel,
  ChannelType,
  Guild,
  PermissionsBitField,
} from "discord.js";
import { makeEmbedsForGuild } from "./facilities";

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

export async function getFacilityList(guild: Guild) {
  const name = "facility-list";

  const channels = await guild.channels.fetch();
  const channel = channels.find((val) => {
    if (val === null) {
      return false;
    }

    return val.type === ChannelType.GuildText && val.name == name;
  });

  if (channel?.type == ChannelType.GuildText) {
    return channel;
  }

  return null;
}

export async function updateFacilityList(guild: Guild) {
  const channel = await getFacilityList(guild);

  if (!channel || channel.type === ChannelType.GuildText) {
    console.error("Did not find facility list");
    return;
  }

  await channel.bulkDelete(await channel.messages.fetch());

  const embeds = await makeEmbedsForGuild(guild);

  return await channel.send({ embeds: Object.values(embeds) });
}
