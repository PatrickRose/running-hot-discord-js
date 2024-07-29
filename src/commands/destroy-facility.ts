import {
  AutocompleteInteraction,
  CategoryChannel,
  CategoryChannelType,
  ChannelType,
  CommandInteraction,
  GuildChannel,
  GuildChannelTypes,
  GuildMember,
  PermissionsBitField,
  SlashCommandBuilder,
} from "discord.js";
import { CORPORATION_NAMES, isCorporation } from "../types/corporations";
import { getCategory } from "../utils/channels";
import { getRoleForGuild } from "../utils/roles";
import { facilities, roles } from "../db";
import { buildFacility } from "../utils/facilities";

export const data = new SlashCommandBuilder()
  .setName("destroy-facility")
  .setDescription("Destroy a facility")
  .addStringOption((option) =>
    option
      .setName("corporation")
      .setDescription("Corporation Name")
      .addChoices(
        Object.entries(CORPORATION_NAMES).map(([key, value]) => {
          return {
            name: value,
            value: key,
          };
        }),
      )
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName("facility-name")
      .setDescription("Name of facility")
      .setAutocomplete(true)
      .setRequired(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (!interaction.inGuild()) {
    return interaction.respond([]);
  }

  const results = await facilities.findAll({
    where: {
      guildId: interaction.guildId,
      corporation: interaction.options.getString("corporation") ?? "",
    },
  });

  return interaction.respond(
    results.map((row) => {
      return {
        name: row.facilityName,
        value: row.facilityName,
      };
    }),
  );
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  const corporation = interaction.options.get("corporation")?.value;

  if (!isCorporation(corporation)) {
    return interaction.reply({
      content: `\`${corporation}\` is not a corporation`,
      ephemeral: true,
    });
  }

  const facilityName = interaction.options.get("facility-name")?.value;

  if (typeof facilityName != "string") {
    return interaction.reply({
      content: `\`${facilityName}\` is not a valid facility name`,
      ephemeral: true,
    });
  }

  const facility = await facilities.findOne({
    where: {
      guildId: interaction.guildId,
      corporation: corporation,
      facilityName: facilityName,
    },
  });

  if (!facility) {
    return interaction.reply({
      content: `\`${facilityName}\` is not a valid facility name`,
      ephemeral: true,
    });
  }

  const { text, voice } = facility;

  const channels = interaction.guild.channels;
  await channels.delete(text);
  await channels.delete(voice);
  await facility.destroy();

  return await interaction.reply(`Destroyed ${facilityName}`);
}
