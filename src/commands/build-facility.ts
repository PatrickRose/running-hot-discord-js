import {
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
import { roles } from "../db";
import { buildFacility } from "../utils/facilities";

export const data = new SlashCommandBuilder()
  .setName("build-facility")
  .setDescription("Build a facility")
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
      .setRequired(true),
  );

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

  await interaction.reply({
    content: `Building facility ${facilityName} for ${CORPORATION_NAMES[corporation]}...`,
    ephemeral: true,
  });

  const guild = interaction.guild;

  const result = await buildFacility(guild, corporation, facilityName);

  if (result == true) {
    return interaction.followUp(
      `Built ${facilityName} for ${CORPORATION_NAMES[corporation]}`,
    );
  }

  return interaction.followUp({
    content: result,
    ephemeral: true,
  });
}
