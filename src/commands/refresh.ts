import {
  CommandInteraction,
  DiscordAPIError,
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
    return await interaction.reply("You are not control!");
  }

  await interaction.deferReply();

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

    return interaction.editReply("Successfully reloaded application commands.");
  } catch (error) {
    console.error(error);
    return interaction.editReply("Unable to refresh");
  }
}
