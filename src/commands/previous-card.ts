import {
  ButtonStyle,
  ChannelType,
  CommandInteraction,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { getFacilityForChannel, handleCard } from "../utils/runs";
import { Card } from "../db";
import { CARD_LIST } from "../cards";

export const data = new SlashCommandBuilder()
  .setName("previous-card")
  .setDescription("Goes to the previous card in the facility");

export async function execute(interaction: CommandInteraction) {
  if (
    !interaction.inGuild() ||
    !interaction.guild ||
    interaction.channel?.type != ChannelType.GuildText
  ) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const guild = interaction.guild;

  const result = await getFacilityForChannel(
    interaction.guild,
    interaction.channel,
  );

  if (result.error) {
    return interaction.editReply(result.msg);
  }

  const { run, facility, pinned } = result;

  if (!pinned) {
    return interaction.editReply(
      "There is not a pinned message - has the run started?",
    );
  }

  const newPosition = (run.cards ?? 0) - 1;

  let card = await Card.findOne({
    where: {
      RunId: run.id,
      position: newPosition,
    },
  });

  if (!card) {
    return interaction.editReply(
      `There is no card. Either you've gone back to the beginning or you've hit a bug. Contact Control if needed`,
    );
  }

  await handleCard(run, newPosition, facility, pinned, card, interaction);
}
