const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member for a specified duration')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Timeout duration (e.g., 1m, 1h, 1d)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for the timeout')),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const durationString = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the target is valid
        if (!target) {
            return interaction.reply({ 
                content: 'Please specify a valid member to timeout!', 
                ephemeral: true 
            });
        }

        // Parse duration string to milliseconds
        const durationMs = parseDuration(durationString);
        if (durationMs === null) {
            return interaction.reply({
                content: 'Invalid duration format. Please use formats like 1m, 1h, 1d, etc.',
                ephemeral: true
            });
        }

        // Check if the bot can timeout the target
        if (!target.moderatable) {
            return interaction.reply({ 
                content: 'I cannot timeout this user! Check if they have a higher role than me or if I have timeout permissions.', 
                ephemeral: true 
            });
        }

        // Attempt to timeout the member
        try {
            await target.timeout(durationMs, reason);
            return interaction.reply(`Successfully timed out ${target.user.tag} for ${durationString} with reason: ${reason}`);
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error trying to timeout this user!', 
                ephemeral: true 
            });
        }
    },
};

// Helper function to parse duration string to milliseconds
function parseDuration(durationString) {
    const regex = /^(\d+)([mhd])$/;
    const match = durationString.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'm': return value * 60 * 1000; // minutes to milliseconds
        case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
        case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
        default: return null;
    }
}