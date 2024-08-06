import {
  ActionRow,
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ChannelType,
  CommandInteraction,
  ComponentBuilder,
  SlashCommandBuilder,
  ButtonInteraction,
  GuildMember,
} from "discord.js";
import {
  calculateCardBonus,
  getFacilityForChannel,
  handleCard,
  makeCollectorListener,
  makeEmbedForCard,
  makeEmbedForRun,
} from "../utils/runs";
import { Card, Run } from "../db";
import { CARD_LIST } from "../cards";

export const data = new SlashCommandBuilder()
  .setName("next-card")
  .setDescription("Goes to the next card in the facility")
  .addStringOption((option) =>
    option.setName("card-id").setDescription("The Card ID"),
  );

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

  const cardId = interaction.options.get("card-id")?.value;
  if (
    cardId !== undefined &&
    (typeof cardId != "string" || CARD_LIST[cardId] == undefined)
  ) {
    return interaction.reply({
      content: `\`${cardId}\` is not a valid card ID`,
    });
  }

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

  const newPosition = (run.cards ?? 0) + 1;

  let card = await Card.findOne({
    where: {
      RunId: run.id,
      position: newPosition,
    },
  });

  if (card && cardId) {
    return interaction.editReply(
      `You have already played a card for position ${newPosition} - re-run without an argument for cardId`,
    );
  } else if (!card) {
    if (!cardId) {
      return interaction.editReply(
        `You haven't played a card for position ${newPosition} yet. Run again with an argument for cardId`,
      );
    }

    card = await Card.create({
      RunId: run.id,
      position: newPosition,
      boost: 0,
      cardId: cardId,
    });
  }
  await handleCard(run, newPosition, facility, pinned, card, interaction);
}
