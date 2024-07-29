import {
    CategoryChannel,
    CategoryChannelType, ChannelType,
    CommandInteraction,
    GuildChannel,
    GuildChannelTypes,
    GuildMember,
    SlashCommandBuilder
} from "discord.js";
import {CORPORATION_NAMES, isCorporation} from "../types/corporations";
import {getCategory} from "../utils/channels";


export const data = new SlashCommandBuilder()
    .setName("build-facility")
    .setDescription("Build a facility")
    .addStringOption((option) =>
        option
            .setName("corporation")
            .setDescription("Corporation Name")
            .addChoices(Object.entries(CORPORATION_NAMES).map(([key, value]) => {
                    return {
                        name: value,
                        value: key
                    }
                })
            )
            .setRequired(true),
    )
    .addStringOption((option) =>
        option.setName("facility-name")
            .setDescription("Name of facility")
            .setRequired(true),
    );

export async function execute(interaction: CommandInteraction) {
    if (!interaction.inGuild() || !interaction.guild) {
        return interaction.reply({
            content: "Not run in a discord server",
            ephemeral: true,
        });
    }

    const corporation = interaction.options.get("corporation")?.value;

    if (!isCorporation(corporation)) {
        return interaction.reply({content: `\`${corporation}\` is not a corporation`, ephemeral: true});
    }

    const facilityName = interaction.options.get("facility-name")?.value;

    if (typeof facilityName != 'string') {
        return interaction.reply({content: `\`${facilityName}\` is not a valid facility name`, ephemeral: true});
    }

    await interaction.reply({content:`Building facility ${facilityName} for ${CORPORATION_NAMES[corporation]}...`, ephemeral: true});

    const guild = interaction.guild;

    const category = await getCategory(guild, `runs-${corporation}`);

    await category.children.create<ChannelType.GuildText>({
        name: facilityName,
        type: ChannelType.GuildText,
    })
    await category.children.create({
        name: facilityName,
        type: ChannelType.GuildVoice
    })

    return interaction.followUp(`Built ${facilityName} for ${CORPORATION_NAMES[corporation]}`);
}
