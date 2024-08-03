import { ChannelType, EmbedBuilder, Guild } from "discord.js";
import {
  ALL_CORPORATIONS,
  Corporation,
  CORPORATION_LOGOS,
  CORPORATION_NAMES,
  CORPORATION_THUMBNAILS,
  isCorporation,
} from "../types/corporations";
import { getRoleForGuild } from "./roles";
import { getCategory } from "./channels";
import { facilities, FacilityModel, roles } from "../db";

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

export async function makeEmbedsForGuild(
  guild: Guild,
): Promise<Record<Corporation, EmbedBuilder>> {
  const corpFacilities: Record<Corporation, FacilityModel[]> = {
    ANT: [],
    DTC: [],
    GenEq: [],
    Gordon: [],
    MCM: [],
  };

  const allFacilities = await facilities.findAll({
    where: { guildId: guild.id },
  });

  for (let facility of allFacilities) {
    corpFacilities[facility.corporation].push(facility);
  }

  const allRoles = await roles.findAll({ where: { guildId: guild.id } });

  const toReturn: Record<Corporation, EmbedBuilder> = {
    ANT: new EmbedBuilder().setTitle(`${CORPORATION_NAMES["ANT"]} Facilities`),
    DTC: new EmbedBuilder().setTitle(`${CORPORATION_NAMES["DTC"]} Facilities`),
    GenEq: new EmbedBuilder().setTitle(
      `${CORPORATION_NAMES["GenEq"]} Facilities`,
    ),
    Gordon: new EmbedBuilder().setTitle(
      `${CORPORATION_NAMES["Gordon"]} Facilities`,
    ),
    MCM: new EmbedBuilder().setTitle(`${CORPORATION_NAMES["MCM"]} Facilities`),
  };

  for (let role of allRoles) {
    if (!isCorporation(role.corporation)) {
      continue;
    }

    const guildRoles = await guild.roles.fetch();
    const guildRole = guildRoles.get(role.roleId);

    if (guildRole?.color) {
      toReturn[role.corporation].setColor(guildRole.color);
    }
  }

  for (let corporation of ALL_CORPORATIONS) {
    toReturn[corporation]
      .setThumbnail(CORPORATION_THUMBNAILS[corporation])
      .setImage(CORPORATION_LOGOS[corporation])
      .addFields([
        {
          name: "Facilities",
          value: corpFacilities[corporation]
            .map((val) => `* ${val.facilityName} (${val.facilityType})`)
            .join("\n"),
        },
      ]);
  }

  return toReturn;
}
