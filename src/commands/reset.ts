import {
  APIInteractionGuildMember,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { facilities, FacilityModel } from "../db";
import {
  buildFacility,
  destroyFacility,
  makeEmbedsForGuild,
} from "../utils/facilities";
import {
  ALL_CORPORATIONS,
  Corporation,
  CORPORATION_NAMES,
} from "../types/corporations";
import { InferAttributes } from "sequelize";
import { userIsControl } from "../utils/roles";
import { updateFacilityList } from "../utils/channels";

export const data = new SlashCommandBuilder()
  .setName("reset")
  .setDescription("Sets up the discord server from scratch");

const INITIAL_FACILITIES: Record<
  Corporation,
  Omit<
    InferAttributes<FacilityModel>,
    "id" | "corporation" | "guildId" | "text" | "voice"
  >[]
> = {
  ANT: [
    { facilityType: "Corporate", facilityName: "SameignlegurA" },
    { facilityType: "Research", facilityName: "RannsóknirA" },
    { facilityType: "Security", facilityName: "MátturA" },
    { facilityType: "Power", facilityName: "OrkaA" },
  ],
  DTC: [
    { facilityType: "Arms", facilityName: "ArmsA" },
    { facilityType: "Corporate", facilityName: "CorporateA" },
    { facilityType: "Research", facilityName: "ResearchA" },
    { facilityType: "Security", facilityName: "SecurityA" },
    { facilityType: "Security", facilityName: "SecurityB" },
  ],
  GenEq: [
    { facilityType: "Corporate", facilityName: "CorporateA" },
    { facilityType: "Research", facilityName: "ResearchA" },
    { facilityType: "Research", facilityName: "ResearchB" },
    { facilityType: "Research", facilityName: "ResearchC" },
    { facilityType: "Security", facilityName: "SecurityA" },
  ],
  Gordon: [
    { facilityType: "Corporate", facilityName: "CorporateA" },
    { facilityType: "Corporate", facilityName: "CorporateB" },
    { facilityType: "Corporate", facilityName: "CorporateC" },
    { facilityType: "Research", facilityName: "ResearchA" },
    { facilityType: "Security", facilityName: "SecurityA" },
  ],
  MCM: [
    { facilityType: "Corporate", facilityName: "CorporateA" },
    { facilityType: "Factory", facilityName: "FactoryA" },
    { facilityType: "Research", facilityName: "ResearchA" },
    { facilityType: "Research", facilityName: "ResearchB" },
    { facilityType: "Security", facilityName: "SecurityA" },
  ],
};

export async function execute(interaction: CommandInteraction) {
  if (!interaction.inGuild() || interaction.guild === null) {
    return interaction.reply({
      content: "Not run in a discord server",
      ephemeral: true,
    });
  }

  if (await !userIsControl(interaction.guild, interaction.member)) {
    return await interaction.reply("You are not control!");
  }

  await interaction.reply("Resetting server, please wait...");

  // First, get all facilities
  const existing = await facilities.findAll({
    where: {
      guildId: interaction.guild.id,
    },
  });

  await interaction.followUp("Deleting old channels...");

  for (let val of existing) {
    await destroyFacility(interaction.guild, val.corporation, val.facilityName);
  }

  await interaction.followUp("Old channels deleted!");

  for (let corporation of ALL_CORPORATIONS) {
    await interaction.followUp(
      `Setting up ${CORPORATION_NAMES[corporation]}...`,
    );
    for (let { facilityName, facilityType } of INITIAL_FACILITIES[
      corporation
    ]) {
      const result = await buildFacility(
        interaction.guild,
        corporation,
        facilityName,
        facilityType,
      );
      if (result !== true) {
        return interaction.followUp(
          `Failed to create ${facilityName} for ${CORPORATION_NAMES[corporation]}!\n${result}`,
        );
      }
    }
    await interaction.followUp(`Set up ${CORPORATION_NAMES[corporation]}!`);
  }

  await updateFacilityList(interaction.guild);

  await interaction.followUp(`All done!`);
}
