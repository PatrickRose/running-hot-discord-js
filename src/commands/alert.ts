import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import {
  ActiveRun,
  getFacilityForChannel,
  makeEmbedForRun,
} from "../utils/runs";

export const data = new SlashCommandBuilder()
  .setName("alert")
  .setDescription("Adds alerts to the current run")
  .addNumberOption((option) =>
    option
      .setName("alerts")
      .setDescription(
        "Number of alerts (use minus numbers to reduce the amounts)",
      )
      .setRequired(true),
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

  const alerts = interaction.options.get("alerts")?.value;

  if (typeof alerts != "number") {
    return interaction.editReply({
      content: `\`${alerts}\` is not a valid number of alerts`,
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
      "There is no pinned message, has the run started?",
    );
  }

  run.alerts = Math.max((run.alerts ?? 0) + alerts, 0);
  await run.save();

  const embed = makeEmbedForRun({
    alerts: run.alerts,
    corporation: facility.corporation,
    facilityName: facility.facilityName,
    position: run.cards ?? 0,
  });

  await pinned.edit({ embeds: [embed] });

  return interaction.editReply(`\`${Math.abs(alerts)}\` alerts ${alerts < 0 ? "removed" : "added"}.
New alert count is \`${run.alerts}\`
If you have an active card, click "Refresh" to update the bonus strength!`);
}
