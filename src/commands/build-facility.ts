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

  // Get the role for this corporation
  const role = await getRoleForGuild(guild.id, corporation);

  if (role === null) {
    return await interaction.reply({
      content: `Unable to build facility, ${CORPORATION_NAMES[corporation]} does not have a configured role. Use /map-role to correct this`,
      ephemeral: true,
    });
  }

  const controlRole = await getRoleForGuild(guild.id, "control");

  if (controlRole === null) {
    return await interaction.reply({
      content: `Unable to build facility, Control does not have a configured role. Use /map-role to correct this`,
      ephemeral: true,
    });
  }

  const category = await getCategory(
    guild,
    `runs-${corporation}`,
    role,
    controlRole,
  );

  await category.children.create<ChannelType.GuildText>({
    name: facilityName,
    type: ChannelType.GuildText,
  });
  await category.children.create({
    name: facilityName,
    type: ChannelType.GuildVoice,
  });

  return interaction.followUp(
    `Built ${facilityName} for ${CORPORATION_NAMES[corporation]}`,
  );
}
