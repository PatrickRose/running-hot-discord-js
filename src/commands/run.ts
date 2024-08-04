import {
  AutocompleteInteraction,
  ChannelType,
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { CORPORATION_NAMES, isCorporation } from "../types/corporations";
import { db, facilities, FacilityModel, Run } from "../db";
import { getRoleForGuild, userIsOnRun } from "../utils/roles";

export const data = new SlashCommandBuilder()
  .setName("run")
  .setDescription("Run against a facility")
  .addStringOption((option) =>
    option
      .setName("corporation")
      .setDescription("Corporation Name")
      .addChoices([
        ...Object.entries(CORPORATION_NAMES).map(([key, value]) => {
          return {
            name: value,
            value: key,
          };
        }),
      ])
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

  if (await userIsOnRun(interaction.guild, interaction.member)) {
    return interaction.reply({
      content: `You are already on a run! If that's not true, ping Control to fix it`,
      ephemeral: true,
    });
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

  const transaction = await db.transaction(
    async (
      t,
    ): Promise<
      | { error: true; msg: string }
      | { error: false; result: Run; created: boolean; facility: FacilityModel }
    > => {
      if (!interaction.guild) {
        // Should never happen
        return {
          error: true,
          msg: "Apparently not in a guild????",
        };
      }

      const facility = await facilities.findOne({
        where: {
          guildId: interaction.guildId,
          corporation: corporation,
          facilityName,
        },
        include: Run,
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!facility) {
        return {
          error: true,
          msg: `\`${facilityName}\` is not a valid facility name`,
        };
      }

      const textChannel = await interaction.guild.channels.fetch(facility.text);
      const voiceChannel = await interaction.guild.channels.fetch(
        facility.voice,
      );

      if (
        !textChannel ||
        textChannel.type !== ChannelType.GuildText ||
        !voiceChannel ||
        voiceChannel.type !== ChannelType.GuildVoice
      ) {
        return {
          error: true,
          msg: `\`${facilityName}\` is not a valid facility name`,
        };
      }

      if (facility.Runs && facility.Runs.length > 0) {
        return {
          error: false,
          facility,
          result: facility.Runs[0],
          created: false,
        };
      }

      const role = await interaction.guild.roles.create({
        name: `run-${facility.id}`,
      });

      await textChannel.permissionOverwrites.edit(role, { ViewChannel: true });
      await voiceChannel.permissionOverwrites.edit(role, { ViewChannel: true });

      const run = await Run.create(
        {
          roleId: role.id,
          FacilityId: facility.id,
        },
        {
          transaction: t,
        },
      );

      return {
        error: false,
        result: run,
        facility,
        created: true,
      };
    },
  );

  if (transaction.error) {
    return interaction.reply({
      content: transaction.msg,
      ephemeral: true,
    });
  }

  const run = transaction.result;
  await interaction.guild.members.addRole({
    user: interaction.user,
    role: run.roleId,
  });

  await interaction.reply({
    content: `${(interaction.member as GuildMember).displayName} runs against \`${corporation}\`: \`${facilityName}\` `,
  });

  const runChannel = await interaction.guild.channels.fetch(
    transaction.facility.text,
  );
  if (runChannel?.type != ChannelType.GuildText) {
    return;
  }

  if (transaction.created) {
    const role = await getRoleForGuild(interaction.guildId, corporation);

    if (!role) {
      return;
    }

    await runChannel.send(`🚨🚨 **WARNING! RUN DETECTED!** 🚨🚨
<@&${role}>, please send a representative to defend the facility.
If you are unable to send a representative, please ping Control to handle on your behalf
Once all attackers are here, use \`/start-run\` to begin run resolution`);

    await runChannel.send(`As a reminder:
* Use \`/roll\` to roll dice
* Use \`/play\` to play cards (using the card ID)`);
  }

  await runChannel.send(`
<@${interaction.member.user.id}> has joined the run`);
}
