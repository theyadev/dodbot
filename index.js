const Discord = require("discord.js");
const fs = require("fs");
const dotenv = require("dotenv");
const monk = require("monk");
const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
const { TOKEN, PREFIX } = require("./config.json");
let emoji = "🎃";
dotenv.config();

const db = monk(process.env.MONGO_URI);
const Messages = db.get("messages");

let MessagesRole = new Map();

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const x = await Messages.find();
  if (x.length > 0) {
    const y = {};
    for (let i = 0; i < x.length; i++) {
      y[x[i].messageId] = x[i];
    }

    MessagesRole = new Map(Object.entries(y));
  } else MessagesRole = new Map();
});

client.on("message", async (message) => {
  // Recuperer uniquement les message commencant par le prefix, ignorer les bots.
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);

  // renvoi le premier element array et le suppr
  const command = args.shift().toLowerCase();

  // Creation de la commande

  // TODO: Example de commande: dodstartregister 🎃 "Pour vous inscrire mettez la reactions ci dessous." @Tournoi
  if (
    command == "startregister" &&
    message.guild.member(message.author).hasPermission("ADMINISTRATOR")
  ) {
    // TODO: Faire en sorte que la commande soit utilisable uniquement par les Administrateurs.
    function stopError() {
      message.reply(
        "le bot a besoin des arguments suivants: " +
          ' EMOJI - "TEXTE" - @ROLE - JOUR/MOIS'
      );
    }
    if (!args[0]) return stopError();

    const emojiRegExp = /\p{Extended_Pictographic}/u;
    if (emojiRegExp.test(args[0])) emoji = args[0];
    else if (args[0].startsWith("<:") || args[0].startsWith("<a:")) {
      let emojiId = args[0].slice(2);
      emojiId = emojiId.slice(0, -1);
      emojiId = emojiId.split(":")[1];

      emoji = client.emojis.cache.get(emojiId);

      if (!emoji)
        return message.reply("l'emoji vient d'un autre serveur !!!!!");
    } else return stopError();

    // DONE!!! TODO: Faire en sorte que "emoji" sois une variable choisis par la commande.

    // DONE!!! TODO: Faire en sorte que "messageReaction" envoie un message choisis par la commande ?

    if (!args[1]) return stopError();

    const newArgs = message.content.split('"');
    const messageToSend = newArgs[1];
    if (!messageToSend) return stopError();

    if (!newArgs[2]) return stopError();
    const newNewArgs = newArgs[2].slice(1).split(" ");

    let role = newNewArgs[0];
    if (!role.startsWith("<@&")) return stopError();

    role = role.slice(3);
    role = role.slice(0, -1);

    if (!newNewArgs[1]) return stopError();

    try {
      const day = newNewArgs[1].split("/")[0];
      const month = newNewArgs[1].split("/")[1];
      const year = newNewArgs[1].split("/")[2] || new Date().getFullYear();
      var fullDate = `${month}/${day}/${year}`;
    } catch (error) {
      return stopError();
    }

    const endDate = new Date(fullDate);
    var today = new Date();

    if (endDate <= today)
      return message.reply("la date ne doit pas se situé dans le passé !!");

    function isValidDate(d) {
      return d instanceof Date && !isNaN(d);
    }

    if (isValidDate(endDate) == false) return stopError();

    // Envoie le message sur lequel le bot va reagir.
    const messageReaction = await message.channel.send(messageToSend);

    MessagesRole.set(messageReaction.id, {
      emote: emoji.id || emoji,
      role: role,
      endDate: endDate,
      guildId: messageReaction.guild.id,
    });

    const created = await Messages.insert({
      emote: emoji.id || emoji,
      role: role,
      endDate: endDate,
      guildId: messageReaction.guild.id,
      messageId: messageReaction.id,
    });
    console.log(created);
    //fs.writeFileSync("./Messages.json", JSON.stringify(obj));
    /* 
     DONE!!! TODO: Stocker l'id du message dans un Set/Map/Collection avec l'id du role et l'emote que l'on veut mettre.
            Reagir avec l'emote choisis.
    */

    // Reagis avec l'emojis choisis.
    messageReaction.react(emoji);
    message.delete();
  }
  if (
    command == "stopregister" &&
    message.guild.member(message.author).hasPermission("ADMINISTRATOR")
  ) {
    function stopError() {
      message.reply("le bot a besoin des arguments suivants: " + " MESSAGE ID");
    }
    console.log(args);
    if (args.length == 0) return stopError();

    if (!MessagesRole.has(args[0]))
      return message.reply(
        "l'id indiqué n'est pas valide, ou alors n'appartient pas a un message tracké par le bot."
      );

    const x = MessagesRole.get(args[0]);
    const Guild = client.guilds.cache.get(message.guild.id); // Getting the guild.
    Guild.members.cache.forEach((user) => {
      if (user.roles.cache.has(x.role)) user.roles.remove(x.role);
    });

    await Messages.remove({ messageId: x.messageId });

    MessagesRole.delete(args[0]);

    message.channel.send(
      "__**LES INSCRIPTIONS POUR LE TOURNOI SONT TERMINÉES !**__"
    );
    message.delete();
  }
});

client.on("messageReactionAdd", (reaction, user) => {
  // Verifie qu'il y a bien un user et que le message ne proviens pas des message privé. Ignore les bots.
  if (
    user &&
    !user.bot &&
    reaction.message.channel.guild &&
    MessagesRole.has(reaction.message.id)
  ) {
    const msgData = MessagesRole.get(reaction.message.id);
    if (
      reaction.emoji.name == msgData.emote ||
      reaction.emoji.id == msgData.emote
    ) {
      /*
     DONE!!! TODO: Check si l'id du message correspond a un id stocker.
            Si l'id correspond, check si c'est bien la bonne emote.
            Si l'emote correspond mettre le role a la personne.
    */

      const role = reaction.message.guild.roles.cache.get(msgData.role);

      /*console.log(reaction.count);
      if (reaction.count >= 1 && reaction.users.cache.has(client.user.id)) {
        console.log("OUI");
      }*/
      // Regarde si l'utilisateur a deja le role
      if (reaction.message.guild.member(user).roles.cache.has(role.id))
        return reaction.message.guild
          .member(user)
          .roles.remove(role)
          .then(user.send(`Le role "${role.name}" vous a été supprimé !`));
      // Ajoute le role choisis a la personne.
      else
        return reaction.message.guild
          .member(user)
          .roles.add(role)
          .then(user.send(`Le role "${role.name}" vous a été ajouté !`));
      // TODO: Envoyer un message privé comme quoi le role a bien été ajouté.
    }
  }
});

client.on("messageReactionRemove", (reaction, user) => {
  // Verifie qu'il y a bien un user et que le message ne proviens pas des message privé. Ignore les bots.
  if (user && !user.bot && reaction.message.channel.guild) {
    const x = MessagesRole.has(reaction.message.id);
    if (x) {
      const msgData = MessagesRole.get(reaction.message.id);
      if (
        reaction.emoji.name == msgData.emote ||
        reaction.emoji == msgData.emote
      ) {
        console.log("WORKING BITCH");
        /*
     DONE!!! TODO: Check si l'id du message correspond a un id stocker.
            Si l'id correspond, check si c'est bien la bonne emote.
            Si l'emote correspond mettre le role a la personne.
    */

        const role = reaction.message.guild.roles.cache.get(msgData.role);

        // Regarde si l'utilisateur a deja le role
        if (reaction.message.guild.member(user).roles.cache.has(role.id))
          return reaction.message.guild
            .member(user)
            .roles.remove(role)
            .then(user.send(`Le role "${role.name}" vous a été supprimé !`));
        else
          return reaction.message.guild
            .member(user)
            .roles.add(role)
            .then(user.send(`Le role "${role.name}" vous a été ajouté !`));
        // TODO: Envoyer un message privé comme quoi le role a bien été ajouté.
      }
    }
  }
});

client.on("guildMemberUpdate", (old, newer) => {
  if (old.guild.id != "279999753884794880") return; // Serveur de Dios
  //if (old.guild.id != "470335219128336385") return; // Serveur de Test

  /*const roleId = "470335809019707393"
  const channel = client.guilds.cache.get(old.guild.id).channels.cache.get("789245103864545311")*/ 
  // Serveur de Test

  const roleId = "782612409806356491"
  const channel = client.guilds.cache.get(old.guild.id).channels.cache.get("475969379947773962")
  // Serveur de Dios

  // Creation de l'embed a envoyé
  const embed = new Discord.MessageEmbed()
  .setTimestamp(new Date())
  .setAuthor(newer.user.tag, newer.user.avatarURL())

  if (old.roles.cache.has(roleId) == true && newer.roles.cache.has(roleId) == false) {
    embed.setColor(15158332)
    embed.setDescription(`🔴 <@${newer.user.id}> à quitté le tournoi !`)
    channel.send(embed)
  } else if (old.roles.cache.has(roleId) == false && newer.roles.cache.has(roleId) == true) {
    embed.setColor(3066993)
    embed.setDescription(`🟢 <@${newer.user.id}> à rejoins le tournoi !`)
    channel.send(embed)
  }
});

setInterval(() => {
  if (MessagesRole.size == 0) return;
  MessagesRole.forEach(async (value, key, map) => {
    var varDate = new Date(value.endDate);
    var today = new Date();

    if (varDate <= today) {
      console.log("La date est passé pour: ", key, value);

      const Guild = client.guilds.cache.get(value.guildId); // Getting the guild.
      Guild.members.cache.forEach((user) => {
        if (user.roles.cache.has(value.role)) user.roles.remove(value.role);
      });

      await Messages.remove({ messageId: value.messageId });

      MessagesRole.delete(key);
    }
  });
}, 21600000);

/*
      DONE!!! TODO: Enlever tous les roles (le jour choisis dans la commande)? ou a une heure fixe.
    */

client.login(TOKEN);
