const Discord = require("discord.js");
const fs = require("fs");
const client = new Discord.Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});
const { TOKEN, PREFIX } = require("./config.json");
let emoji = "🎃";
const MessagesRole = new Map(
  Object.entries(JSON.parse(fs.readFileSync("./Messages.json", "utf-8")))
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", async (message) => {
  // Recuperer uniquement les message commencant par le prefix, ignorer les bots.
  if (!message.content.startsWith(PREFIX) || message.author.bot) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);

  // renvoi le premier element array et le suppr
  const command = args.shift().toLowerCase();

  // Creation de la commande

  // TODO: Example de commande: dodstartregister 🎃 "Pour vous inscrire mettez la reactions ci dessous." @Tournoi
  if (command == "startregister") {
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
    const obj = Object.fromEntries(MessagesRole);
    fs.writeFileSync("./Messages.json", JSON.stringify(obj));
    /* 
     DONE!!! TODO: Stocker l'id du message dans un Set/Map/Collection avec l'id du role et l'emote que l'on veut mettre.
            Reagir avec l'emote choisis.
    */

    // Reagis avec l'emojis choisis.
    messageReaction.react(emoji);
    message.delete();
  }
});

client.on("messageReactionAdd", (reaction, user) => {
  // Verifie qu'il y a bien un user et que le message ne proviens pas des message privé. Ignore les bots.
  if (user && !user.bot && reaction.message.channel.guild) {
    const x = MessagesRole.has(reaction.message.id);
    if (x) {
      const msgData = MessagesRole.get(reaction.message.id);
      if (
        reaction.emoji.name == msgData.emote ||
        reaction.emoji.id == msgData.emote
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
        // Ajoute le role choisis a la personne.
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
  if (old.guild.id != "279999753884794880") return;
  /*console.log("Old roles:");
  old.roles.cache.forEach((role) =>
    role.name != "@everyone" ? console.log(role.name) : ""
  );
  console.log("New roles:");
  newer.roles.cache.forEach((role) =>
    role.name != "@everyone" ? console.log(role.name) : ""
  );*/

  /*
    TODO: Si le nouveau role est rocketLeague alors ajouté un autre role.
    Si le old a deja le role rocketLeague ne rien faire.
    Si il retire le role rocketLeague, retiré la categorie.
  */
});

setInterval(() => {
  if (MessagesRole.size == 0) return;
  MessagesRole.forEach((value, key, map) => {
    var varDate = new Date(value.endDate);
    var today = new Date();

    if (varDate <= today) {
      console.log("La date est passé pour: ", key, value);

      const Guild = client.guilds.cache.get(value.guildId); // Getting the guild.
      Guild.members.cache.forEach((user) => {
        if (user.roles.cache.has(value.role)) user.roles.remove(value.role);
      });

      MessagesRole.delete(key);
      const obj = Object.fromEntries(MessagesRole);
      fs.writeFileSync("./Messages.json", JSON.stringify(obj));
    }
  });
}, 21600000);

/*
      DONE!!! TODO: Enlever tous les roles (le jour choisis dans la commande)? ou a une heure fixe.
    */

client.login(TOKEN);
