import { ChannelType, Guild } from "discord.js";
import { Corporation, CORPORATION_NAMES } from "../types/corporations";
import { getRoleForGuild } from "./roles";
import { getCategory } from "./channels";
import { facilities } from "../db";

export async function buildFacility(
  guild: Guild,
  corporation: Corporation,
  facilityName: string,
  facilityType: string,
): Promise<true | string> {
  // Get the role for this corporation
  const role = await getRoleForGuild(guild.id, corporation);

  if (role === null) {
    return `Unable to build facility, ${CORPORATION_NAMES[corporation]} does not have a configured role. Use /map-role to correct this`;
  }

  const controlRole = await getRoleForGuild(guild.id, "control");

  if (controlRole === null) {
    return `Unable to build facility, Control does not have a configured role. Use /map-role to correct this`;
  }

  const category = await getCategory(
    guild,
    `runs-${corporation}`,
    role,
    controlRole,
  );

  const textChannel = await category.children.create<ChannelType.GuildText>({
    name: facilityName,
    type: ChannelType.GuildText,
  });
  const voiceChannel = await category.children.create({
    name: facilityName,
    type: ChannelType.GuildVoice,
  });

  await facilities.create({
    guildId: guild.id,
    corporation,
    facilityName,
    facilityType,
    text: textChannel.id,
    voice: voiceChannel.id,
  });

  return true;
}

export async function destroyFacility(
  guild: Guild,
  corporation: Corporation,
  facilityName: string,
): Promise<string | true> {
  const facility = await facilities.findOne({
    where: {
      guildId: guild.id,
      corporation: corporation,
      facilityName: facilityName,
    },
  });

  if (!facility) {
    return `\`${facilityName}\` is not a valid facility name`;
  }

  const { text, voice } = facility;

  const channels = guild.channels;
  await channels.delete(text);
  await channels.delete(voice);
  await facility.destroy();

  return true;
}
