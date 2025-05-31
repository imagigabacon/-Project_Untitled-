const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a member from the server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for kicking')),
    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the target is valid
        if (!target) {
            return interaction.reply({ 
                content: 'Please specify a valid member to kick!', 
                ephemeral: true 
            });
        }

        // Check if the bot can kick the target
        if (!target.kickable) {
            return interaction.reply({ 
                content: 'I cannot kick this user! Check if they have a higher role than me or if I have kick permissions.', 
                ephemeral: true 
            });
        }

        // Attempt to kick the member
        try {
            await target.kick(reason);
            return interaction.reply(`Successfully kicked ${target.user.tag} for reason: ${reason}`);
        } catch (error) {
            console.error(error);
            return interaction.reply({ 
                content: 'There was an error trying to kick this user!', 
                ephemeral: true 
            });
        }
    },
};
