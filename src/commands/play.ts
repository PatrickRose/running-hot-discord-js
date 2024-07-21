import {AttachmentBuilder, CommandInteraction, GuildMember, SlashCommandBuilder} from "discord.js";
import {CARD_LIST} from "../cards";

export const data = new SlashCommandBuilder()
    .setName("play")
    .setDescription("Plays a specific command")
    .addStringOption(option =>
        option.setName('card')
            .setDescription('The card name')
            .setRequired(true)
    );

export async function execute(interaction: CommandInteraction) {
    const card = interaction.options.get('card');

    if (!card) {
        return interaction.reply({content: "No card specified", ephemeral: true});
    }

    const cardId = card.value;

    if (typeof cardId != "string") {
        return interaction.reply({content: "Card type was incorrect specified", ephemeral: true});
    }

    const playedCard = CARD_LIST[cardId];

    if (!playedCard) {
        return interaction.reply({content: `Unknown card ${cardId}`, ephemeral: true});
    }

    return interaction.reply({
        content: `${(interaction.member as GuildMember).displayName} played ${cardId} (${playedCard})`,
    });
}
