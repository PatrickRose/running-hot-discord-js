import {
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { CORPORATION_NAMES, isCorporation } from "../types/corporations";
import { facilities } from "../db";
import { destroyFacility, makeEmbedsForGuild } from "../utils/facilities";
import { userIsControl } from "../utils/roles";
import { updateFacilityList } from "../utils/channels";

export const data = new SlashCommandBuilder()
  .setName("destroy-facility")
  .setDescription("Destroy a facility")
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
      .setAutocomplete(true)
      .setRequired(true),
  );

export async function autocomplete(interaction: AutocompleteInteraction) {
  if (!interaction.inGuild()) {
    return interaction.respond([]);
  }

  const results = await facilities.findAll({
    where: {
      guildId: interaction.guildId,
      corporation: interaction.options.getString("corporation") ?? "",
    },
  });

  return interaction.respond(
    results.map((row) => {
      return {
        name: row.facilityName,
        value: row.facilityName,
      };
    }),
  );
}

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild() || !interaction.guild) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  if (await !userIsControl(interaction.guild, interaction.member)) {
    await interaction.reply("Resetting server, please wait...");
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

  const result = await destroyFacility(
    interaction.guild,
    corporation,
    facilityName,
  );

  if (result === true) {
    await updateFacilityList(interaction.guild);

    return await interaction.reply(`Destroyed ${facilityName}`);
  }

  return await interaction.reply({ content: result, ephemeral: true });
}
