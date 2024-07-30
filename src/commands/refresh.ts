import {
  CommandInteraction,
  REST,
  Routes,
  SlashCommandBuilder,
} from "discord.js";
import { config } from "../config";
import { commands } from "./index";
import { userIsControl } from "../utils/roles";

export const data = new SlashCommandBuilder()
  .setName("refresh")
  .setDescription("Refreshes commands");

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild()) {
    return interaction.reply("Unable to refresh");
  }

  if (await !userIsControl(interaction.guildId, interaction.member)) {
    await interaction.reply("Resetting server, please wait...");
  }

  const guildId = interaction.guildId;

  const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

  const commandsData = Object.values(commands).map((command) => command.data);

  try {
    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      },
    );

    return interaction.reply("Successfully reloaded application commands.");
  } catch (error) {
    console.error(error);
    return interaction.reply("Unable to refresh");
  }
}
