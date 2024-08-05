import {
  CategoryChannel,
  CategoryChannelType,
  ChannelType,
  CommandInteraction,
  GuildChannel,
  GuildChannelTypes,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { CORPORATION_NAMES, isCorporation } from "../types/corporations";
import { getCategory } from "../utils/channels";
import { roles } from "../db";
import { userIsControl } from "../utils/roles";

export const data = new SlashCommandBuilder()
  .setName("map-roles")
  .setDescription("Map the discord role to the corporation name")
  .addStringOption((option) =>
    option
      .setName("corporation")
      .setDescription("Corporation Name")
      .addChoices([
        {
          name: "Control",
          value: "control",
        },
        ...Object.entries(CORPORATION_NAMES).map(([key, value]) => {
          return {
            name: value,
            value: key,
          };
        }),
      ])
      .setRequired(true),
  )
  .addRoleOption((option) =>
    option
      .setName("role-name")
      .setDescription("The role to map")
      .setRequired(true),
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  if ((await userIsControl(interaction.guild, interaction.member)) === false) {
    return await interaction.reply("You are not control!");
  }

  const corporation = interaction.options.get("corporation")?.value;

  if (!isCorporation(corporation) && corporation != "control") {
    return interaction.reply({
      content: `\`${corporation}\` is not a corporation`,
      ephemeral: true,
    });
  }

  const roleName = interaction.options.get("role-name")?.value;

  if (typeof roleName != "string") {
    return interaction.reply({
      content: `\`${roleName}\` is not a valid facility name`,
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `Setting ${roleName} as the role for ${isCorporation(corporation) ? CORPORATION_NAMES[corporation] : "control"}`,
    ephemeral: true,
  });

  const guild = interaction.guild;

  await roles.create({
    guildId: guild.id,
    roleId: roleName,
    corporation,
  });
}
