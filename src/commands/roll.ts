import { CARD_LIST } from "../cards";
import {CommandInteraction, GuildMember, SlashCommandBuilder} from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Plays a specific command")
    .addNumberOption((option) =>
        option.setName("dice")
            .setDescription("Type of dice")
            .addChoices([
                {name: 'D6', value: 6},
                {name: 'D8', value: 8},
                {name: 'D10', value: 10},
                {name: 'D12', value: 12},
            ])
            .setRequired(true),
    )
    .addNumberOption((option) =>
        option.setName("amount")
            .setDescription("Number of dice (defaults to 1)")
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.inGuild()) {
        return interaction.reply({ content: "Not run in a discord server", ephemeral: true });
    }

    const diceIn = interaction.options.get("dice");

    if (!diceIn) {
        return interaction.reply({ content: "No dice specified", ephemeral: true });
    }

    const dice = diceIn.value;

    if (typeof dice != "number") {
        return interaction.reply({
            content: "Incorrect dice type",
            ephemeral: true,
        });
    }

    const amount = interaction.options.get("amount")?.value ?? 1;

    if (typeof amount != 'number') {
        return interaction.reply({
            content: `Amount \`${amount}\` was not a number`,
            ephemeral: true,
        });
    }

    const results: number[] = [];

    for (let i =0; i< amount; i++) {
        const result = Math.ceil(Math.random() * dice);
        results.push(result);
    }

    return interaction.reply(`${(interaction.member as GuildMember).displayName} rolled ${amount}d${dice} and scored ${results.filter(val => val >= 5).length} successes
Results were:
${results.map(val => val >= 5 ? `**${val}**` : `${val}`).join(', ')}`);
}
