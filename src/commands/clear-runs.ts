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
import { facilities, roles, Run } from "../db";
import { userIsControl } from "../utils/roles";

export const data = new SlashCommandBuilder()
  .setName("clear-runs")
  .setDescription("Clears all of the runs");

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  if (!(await userIsControl(interaction.guild, interaction.member))) {
    return await interaction.reply("You are not control!");
  }

  await interaction.deferReply();

  const guild = interaction.guild;
  const channels = guild.channels;

  const facilityToCheck = await facilities.findAll({
    where: {
      guildId: guild.id,
    },
    include: Run,
  });

  for (let facility of facilityToCheck.filter((facility) => facility.Run)) {
    const channel = await channels.fetch(facility.text);
    if (channel?.type == ChannelType.GuildText) {
      let messages = await channel.messages.fetch();
      while (messages.size > 0) {
        await channel.bulkDelete(messages);
        messages = await channel.messages.fetch();
      }
    }

    let run = facility.Run;
    await guild.roles.delete(run.roleId);
    await run.destroy();
  }

  return interaction.editReply("Runs cleared");
}
