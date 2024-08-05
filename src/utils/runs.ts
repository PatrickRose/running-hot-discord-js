import {
  Corporation,
  CORPORATION_LOGOS,
  CORPORATION_THUMBNAILS,
} from "../types/corporations";
import {
  Channel,
  EmbedBuilder,
  Guild,
  GuildChannel,
  Message,
  TextChannel,
} from "discord.js";
import { facilities, FacilityModel, Run } from "../db";

export type ActiveRun = {
  alerts: number;
  position: number;
  corporation: Corporation;
  facilityName: string;
};

function strengthFromAlerts(alerts: number): number {
  return Math.floor(-0.5 + Math.sqrt(0.5 * 0.5 - 4 * 0.5 * (0 - alerts)));
}

export function calculateCardBonus({ alerts, position }: ActiveRun) {
  const alertBonus = strengthFromAlerts(alerts);
  const positionBonus = Math.floor(position / 2);

  return `+${alertBonus + positionBonus}`;
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
