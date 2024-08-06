import {
  Corporation,
  CORPORATION_LOGOS,
  CORPORATION_THUMBNAILS,
} from "../types/corporations";
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  EmbedBuilder,
  Guild,
  GuildMember,
  Message,
  TextChannel,
} from "discord.js";
import { Card, facilities, FacilityModel, Run } from "../db";
import { CARD_LIST } from "../cards";

export type ActiveRun = {
  alerts: number;
  position: number;
  corporation: Corporation;
  facilityName: string;
};

function strengthFromAlerts(alerts: number): number {
  return Math.floor(-0.5 + Math.sqrt(0.5 * 0.5 - 4 * 0.5 * (0 - alerts)));
}

export function calculateCardBonus(
  { alerts, position }: Pick<ActiveRun, "alerts" | "position">,
  bonus: number = 0,
) {
  const alertBonus = strengthFromAlerts(alerts);
  const positionBonus = Math.floor(position / 2);

  return `+${alertBonus + positionBonus + bonus}`;
}

export function makeEmbedForRun(run: ActiveRun) {
  return new EmbedBuilder()
    .setTitle(`Run against ${run.facilityName}`)
    .setFields([
      {
        name: "Alerts",
        value: `${run.alerts}`,
      },
      {
        name: "Position",
        value: `${run.position}`,
      },
      {
        name: "Card Strength Bonus",
        value: calculateCardBonus(run),
      },
    ])
    .setThumbnail(CORPORATION_THUMBNAILS[run.corporation])
    .setImage(CORPORATION_LOGOS[run.corporation]);
}

export async function getFacilityForChannel(
  guild: Guild,
  channel: TextChannel,
): Promise<
  | { error: true; msg: string }
  | { error: false; facility: FacilityModel; run: Run; pinned?: Message }
> {
  const facilityToCheck = await facilities.findOne({
    where: {
      guildId: guild.id,
      text: channel.id,
    },
    include: Run,
  });

  if (!facilityToCheck) {
    return {
      error: true,
      msg: "Could not find this facility, contact control",
    };
  }

  const runModel = facilityToCheck.Run;
  if (!runModel) {
    return {
      error: true,
      msg: "This facility does not have any active runs against it",
    };
  }

  const pinned = (await channel.messages.fetchPinned()).first();

  return { error: false, facility: facilityToCheck, run: runModel, pinned };
}

export function makeEmbedForCard(card: Card, run: Run) {
  const cardId = card.cardId;

  return new EmbedBuilder()
    .setTitle(`Defence ${card.position}: ${CARD_LIST[cardId]}`)
    .setFields([
      {
        name: "Boost count",
        value: `${card.boost}`,
        inline: true,
      },
      {
        name: "Bonus strength",
        value: calculateCardBonus(
          { alerts: run.alerts ?? 0, position: card.position },
          card.boost,
        ),
        inline: true,
      },
    ])
    .setImage(`attachment://${cardId}.png`);
}

export function makeCollectorListener(
  run: Run,
  card: Card,
): (i: ButtonInteraction) => Promise<void> {
  const currentPosition = run.cards;

  return async (i) => {
    await run.reload();
    await card.reload();

    if (run.cards != currentPosition) {
      await i.reply({
        content: "This is no longer the active card!",
        ephemeral: true,
      });
      return;
    }

    if (i.customId == "refresh") {
      await i.update({ embeds: [makeEmbedForCard(card, run)] });
      return;
    }

    const boostAmount = i.customId == "boost" ? 1 : -1;

    card.boost = Math.max(0, card.boost + boostAmount);
    await card.save();
    await i.update({ embeds: [makeEmbedForCard(card, run)] });

    if (boostAmount > 0) {
      await i.followUp({
        content: `Card boosted increased to ${card.boost} - make sure you pay the boost cost (in either alerts or credits)`,
      });
    } else {
      await i.followUp({ content: `Card boost undone` });
    }
  };
}

export async function handleCard(
  run: Run,
  newPosition: number,
  facility: FacilityModel,
  pinned: Message<boolean>,
  card: Card,
  interaction: CommandInteraction,
) {
  run.set({ cards: newPosition });
  await run.save();

  const embed = makeEmbedForRun({
    alerts: run.alerts ?? 0,
    corporation: facility.corporation,
    facilityName: facility.facilityName,
    position: newPosition,
  });

  await pinned.edit({ embeds: [embed] });

  const cardEmbed = makeEmbedForCard(card, run);

  const boostButton = new ButtonBuilder()
    .setCustomId("boost")
    .setLabel("Boost card")
    .setStyle(ButtonStyle.Primary);

  const undoBoostButton = new ButtonBuilder()
    .setCustomId("boost-undo")
    .setLabel("Undo a boost")
    .setStyle(ButtonStyle.Danger);

  const refresh = new ButtonBuilder()
    .setCustomId("refresh")
    .setLabel("Refresh strength")
    .setStyle(ButtonStyle.Primary);

  const attachmentBuilder = new AttachmentBuilder(
    `src/cards/images/${card.cardId}.jpg`,
  );

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
    boostButton,
    undoBoostButton,
    refresh,
  ]);

  const reply = await interaction.editReply({
    content: `${(interaction.member as GuildMember).displayName} plays ${CARD_LIST[card.cardId]}`,
    embeds: [cardEmbed],
    files: [attachmentBuilder],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    filter: (i) => i.user.id == interaction.user.id,
    componentType: ComponentType.Button,
    time: 20 * 60 * 60,
  });

  collector.on("collect", makeCollectorListener(run, card));
}
