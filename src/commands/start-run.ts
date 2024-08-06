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
  .setName("start-run")
  .setDescription("Starts a run in this channel")
  .addNumberOption((option) =>
    option
      .setName("runners")
      .setDescription("Number of runners")
      .setMinValue(1)
      .setRequired(true),
  );

function getAlertsForRunnerGroup(group: number): number {
  const mapping: Record<number, number> = {
    0: 0,
    1: 0,
    2: 1,
    3: 2,
    4: 4,
    5: 7,
    6: 11,
  };

  if (mapping[group] !== undefined) {
    return mapping[group];
  }

  return (group * (group + 1)) / 2 - 10;
}

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

  const runners = interaction.options.get("runners")?.value;

  if (typeof runners != "number" || runners < 1) {
    return interaction.reply({
      content: `\`${runners}\` is not a valid number of runners`,
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

  if (pinned) {
    return interaction.editReply(
      "There is already a pinned message - has the run already started?",
    );
  }

  const alerts = getAlertsForRunnerGroup(runners);

  run.set({
    alerts: alerts,
    cards: 0,
  });
  await run.save();

  const embed = makeEmbedForRun({
    alerts: alerts,
    corporation: facility.corporation,
    facilityName: facility.facilityName,
    position: 0,
  });

  const message = await interaction.channel.send({ embeds: [embed] });
  await message.pin();

  return interaction.editReply(`Run started. Starting alerts for \`${runners}\` runners is \`${alerts}\`.
Runners should now add their tags using \`/alert <num>\`.
When done, use \`/next-card\` to display first card`);
}
