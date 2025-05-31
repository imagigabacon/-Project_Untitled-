const {Client, GatewayIntentBits, Collection} = require('discord.js');
const fs = require('fs');
const path = require('path');
const {token, prefix} = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();

// Load commands dynamically from the commands directory
try {
    const commandsPath = path.join(__dirname, 'commands');
    if (fs.existsSync(commandsPath)) {
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            client.commands.set(command.data.name, command);
        }
    }
} catch (error) {
    console.error('Error loading commands:', error);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Event handler for slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    }
});

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

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    try {
        // Command handling logic will go here
        if (command === 'ping') {
            message.reply('Pong!');
        } else if (command === 'test') {
            // Check if the user has Administrator permissions
            if (message.member && message.member.permissions.has('Administrator')) {
                message.reply('Test Success');
            } else {
                message.reply('This is Administrator only command!');
            }
        } else if (command === 'kick') {
            // Check if the user has Administrator permissions
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('This is Administrator only command!');
            }

            // Check if a user was mentioned
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply('Please mention a user to kick!');
            }

            // Get the reason (everything after the mention)
            const reason = args.slice(0).join(' ') || 'No reason provided';

            // Check if the bot can kick the target
            if (!target.kickable) {
                return message.reply('I cannot kick this user! Check if they have a higher role than me or if I have kick permissions.');
            }

            // Attempt to kick the member
            try {
                await target.kick(reason);
                message.reply(`Successfully kicked ${target.user.tag} for reason: ${reason}`);
            } catch (error) {
                console.error(error);
                message.reply('There was an error trying to kick this user!');
            }
        } else if (command === 'timeout') {
            // Check if the user has Administrator permissions
            if (!message.member.permissions.has('Administrator')) {
                return message.reply('This is Administrator only command!');
            }

            // Check if a user was mentioned
            const target = message.mentions.members.first();
            if (!target) {
                return message.reply('Please mention a user to timeout!');
            }

            // Get the duration and reason
            if (args.length < 1) {
                return message.reply('Please provide a duration for the timeout (e.g., 1m, 1h, 1d)');
            }

            const durationString = args[0];
            const reason = args.slice(1).join(' ') || 'No reason provided';

            // Parse duration string to milliseconds
            const durationMs = parseDuration(durationString);
            if (durationMs === null) {
                return message.reply('Invalid duration format. Please use formats like 1m, 1h, 1d, etc.');
            }

            // Check if the bot can timeout the target
            if (!target.moderatable) {
                return message.reply('I cannot timeout this user! Check if they have a higher role than me or if I have timeout permissions.');
            }

            // Attempt to timeout the member
            try {
                await target.timeout(durationMs, reason);
                message.reply(`Successfully timed out ${target.user.tag} for ${durationString} with reason: ${reason}`);
            } catch (error) {
                console.error(error);
                message.reply('There was an error trying to timeout this user!');
            }
        }
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command!');
    }
});

client.login(token);
