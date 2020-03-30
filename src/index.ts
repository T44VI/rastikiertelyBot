import "reflect-metadata";
import { createConnection, getRepository, getConnection } from "typeorm";
import TelegramBot from "node-telegram-bot-api";
import _, { Dictionary } from "lodash";
import { ChatType, Command, StatusType } from "./types";
import groups from "./groups";
import persons from "./persons";
import "reflect-metadata";
import { Chat } from "./entity/Chat";
import chats from "./chats";
import { Group } from "./entity/Group";
import checkpoints from "./checkpoints";
import { Status } from "./entity/Status";
import statuses from "./statuses";
import { token } from "./../token.json";

const connection = createConnection();

const P: ChatType = "P";
const G: ChatType = "G";
const A: ChatType = "A";
const H: ChatType = "H";

const DONE: StatusType = "DONE";
const START: StatusType = "START";
const READY: StatusType = "READY";
const WELCOMETEXT = "WELCOMETEXT";
const ENDTEXT = "Kaikki rastit käyty!";

const LIMBOMESSAGES = ["Limbon aika :DD"];

const getLimboMessage = () =>
  LIMBOMESSAGES[Math.floor(Math.random() * LIMBOMESSAGES.length)];

const bot = new TelegramBot(token, { polling: true });

const chatIds: Dictionary<ChatType> = {
  P,
  A,
  G,
  H
};

const commands: Command[] = [
  {
    types: [A, H],
    name: "listGroups",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      _bot.sendMessage(
        msg.chat.id,
        "Kaikki ryhmät:\n" +
          ((await groups.get())
            .sort((a, b) => a.number - b.number)
            .map(group => `${group.number}) ${group.name}`)
            .join("\n") || "Ei ryhmiä")
      );
    },
    desc: ", Listaa kaikki fuksiryhmät"
  },
  {
    types: [A],
    name: "getGroupInfo",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const generateReply = (group: Group): string =>
        `Ryhmä \nNimi: ${group.name}:\nNumero: ${group.number} \n${
          group.members.length
        } jäsentä: \n ${group.members.map(num => String(num)).join(", ")}`;
      const code = msg.text ? p(msg.text) : "";

      const group = await groups.getByGroupNum(Number(code));
      if (!group) {
        throw new Error("Unidentified identifier");
      }

      _bot.sendMessage(msg.chat.id, generateReply(group));
    },
    desc: "[ryhmän numero], Listaa kyseisen ryhmän jäsenet"
  },
  {
    types: [A],
    name: "createNewGroup",
    desc: "[ryhmän nimi], Luo uuden ryhmän",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const params = msg.text ? p(msg.text) : "";
      if (params) {
        groups.createNew(params, 0, []);
      } else {
        throw new Error("Invalid command. Try again");
      }
    }
  },
  {
    types: [A],
    name: "deleteGroup",
    desc: "[ryhmän nimi], Poistaa ryhmän",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const params = msg.text ? p(msg.text) : "";
      if (params) {
        groups.removeGroup((await groups.getByName(params)).uuid);
      } else {
        throw new Error("Invalid command. Try again");
      }
    }
  },
  {
    types: [A],
    name: "calculateGroupNums",
    desc: ", Laskee ryhmien numerot",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      groups.calculateIndexes();
    }
  },
  {
    types: [A, H],
    name: "listCheckpoints",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      _bot.sendMessage(
        msg.chat.id,
        "Kaikki rastit:\n" +
          ((await checkpoints.get())
            .sort((a, b) => a.orderNum - b.orderNum)
            .map(checkpoint => `${checkpoint.orderNum}) ${checkpoint.name}`)
            .join("\n") || "Ei rasteja")
      );
    },
    desc: ", Listaa kaikki rastit"
  },
  {
    types: [A],
    name: "getCheckpointInfo",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const generateReply = (group: Group): string =>
        `Ryhmä \nNimi: ${group.name}:\nNumero: ${group.number} \n${
          group.members.length
        } jäsentä: \n ${group.members.map(num => String(num)).join(", ")}`;
      const code = msg.text ? p(msg.text) : "";

      const group = await groups.getByGroupNum(Number(code));
      if (!group) {
        throw new Error("Unidentified identifier");
      }

      _bot.sendMessage(msg.chat.id, generateReply(group));
    },
    desc: "[rastin numero], Listaa kyseisen rastit statukset"
  },
  {
    types: [A],
    name: "createNewCheckpoint",
    desc: "[rastin nimi], Luo uuden rastin",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const params = msg.text ? p(msg.text) : "";
      if (params) {
        checkpoints.createNew(params, []);
      } else {
        throw new Error("Invalid command. Try again");
      }
    }
  },
  {
    types: [A],
    name: "deleteCheckpoint",
    desc: "[ryhmän nimi], Poistaa ryhmän",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const params = msg.text ? p(msg.text) : "";
      if (params) {
        groups.removeGroup((await groups.getByName(params)).uuid);
      } else {
        throw new Error("Invalid command. Try again");
      }
    }
  },
  {
    types: [G, H],
    hidden: true,
    name: "connect",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      if (msg.from && (await persons.getByParam(msg.from.id, "id")).admin) {
        const code = msg.text ? p(msg.text) : "";
        const chat = await chats.getByParam(msg.chat.id, "id");
        switch (chat.type) {
          case "G":
            {
              const group = await groups.getByGroupNum(Number(code));
              if (!group) {
                throw new Error("Invalid group num");
              } /*
              chat.group = group;
              await chats.update(chat);*/
              group.chat = chat;
              await groups.update(group);
              _bot.sendMessage(msg.chat.id, `${group.name} connected!`);
            }
            break;
          case "H":
            {
              const checkpoint = await checkpoints.getByParam(
                Number(code),
                "orderNum"
              );
              if (!checkpoint) {
                throw new Error("Invalid checkpoint num");
              } /*
              chat.group = group;
              await chats.update(chat);*/
              checkpoint.chat = chat;
              await checkpoints.update(checkpoint);
              _bot.sendMessage(msg.chat.id, `${checkpoint.name} connected!`);
            }
            break;
          default: {
            throw new Error("You can do this only in group chats");
          }
        }
      } else {
        throw new Error("Insufficient permissions.");
      }
    },
    desc:
      "[(ryhmän tai rastin numero)], Asettaa tämän tg-ryhmän ryhmän tai rastin tg-ryhmäksi"
  },
  {
    types: [A],
    name: "sendToGroup",
    desc: "[ryhmän numero] [välitettävä viesti], Välittää viestin ryhmälle",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const params = msg.text ? p(msg.text) : "";
      if (params) {
        const splitted = params.split(" ");
        const group = await groups.getByParamAndJoin(
          Number(splitted.shift()),
          "number",
          "chat"
        );
        const message = splitted.join(" ").trim();
        if (!group) {
          throw new Error(
            "Invalid number, group not connected or empty message. Try again"
          );
        } else {
          _bot.sendMessage(group.chat.id, message);
          _bot.sendMessage(msg.chat.id, `Message sent to group ${group.name}`);
        }
      } else {
        _bot.sendMessage(msg.chat.id, "Invalid command. Try again");
      }
    }
  },
  {
    types: [H],
    name: "ready",
    desc: ", Komento, kun olette valmiit uutta ryhmää varten.",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const chat = await chats.getByParamAndJoin(
        msg.chat.id,
        "id",
        "checkpoint"
      );
      if (chat.checkpoint) {
        const checkpoint = await checkpoints.getByParamAndStatusAndGroup(
          chat.checkpoint.uuid,
          "uuid"
        );
        const sorted = checkpoint.status
          .filter(
            a => a.status === DONE || a.status === READY || a.status === START
          )
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (sorted.length && sorted[0].status !== DONE) {
          throw new Error(
            "You have to be done with previous group first. Your current status is " +
              sorted[0].status
          );
        }
        const status = await statuses.add(READY);
        statuses.connectToCheckpoint(checkpoint.uuid, status);
        try {
          const nextGroup = await groups.getByParamAndStatusAndCheckpoint(
            (await groups.getNext(sorted.length ? sorted[0].group.number : 0))
              .uuid,
            "uuid"
          );
          const sortedStatus = nextGroup.status
            .filter(a => a.status === DONE || a.status === START)
            .sort((a, b) => b.time.getTime() - a.time.getTime());
          if (
            (sortedStatus.length && sortedStatus[0].status === START) ||
            (!sortedStatus.length && checkpoint.orderNum > 1) ||
            _.uniq(sortedStatus.map(sta => sta.checkpoint.orderNum)).length !==
              checkpoint.orderNum - 1
          ) {
            const current =
              sorted.length && sorted[0] && sorted[0].checkpoint
                ? sorted[0].checkpoint
                : {
                    orderNum: 0,
                    name: "Ei vielä aloittanut"
                  };
            _bot.sendMessage(
              msg.chat.id,
              `Selvä homma, seuraava ryhmä on tällä hetkellä rastilla ${current.orderNum}) ${current.name}, odottakaa rauhassa :D`
            );
          } else {
            const welcomeTexts = checkpoint.status
              .filter(a => a.status.includes(WELCOMETEXT))
              .sort((a, b) => b.time.getTime() - a.time.getTime());
            const status = await statuses.add(START);
            statuses.connectToCheckpoint(checkpoint.uuid, status);
            statuses.connectToGroup(nextGroup.uuid, status);
            if (welcomeTexts.length) {
              _bot.sendMessage(
                nextGroup.chat.id,
                welcomeTexts[0].status.split(WELCOMETEXT).join("")
              );
              _bot.sendMessage(
                msg.chat.id,
                `Ryhmä "${nextGroup.name}" on tulossa rastille. Tervetuloteksti lähetettiin ryhmälle, voitte laittaa ryhmälle viestiä käskyllä /broadcast [viesti]. Kun olette valmiit, käyttäkää käskyä /done`
              );
            } else {
              _bot.sendMessage(
                nextGroup.chat.id,
                `Tervetuloa rastille ${checkpoint.name}. Ohjeita seuraa`
              );
              _bot.sendMessage(
                msg.chat.id,
                `Ryhmä "${nextGroup.name}" on tulossa rastille. Tervetulotekstiä ei ole asetettu, joten ryhmä ei ole vielä saanut mitään informaatiota. Kommunikoikaa ryhmälle käskyllä /broadcast [viesti]. Tervetulotekstin voitte asettaa käskyllä /setWelcomeMessage [tervetuloviesti]. Huomatkaa, että nykyinen ryhmä ei kuitenkaan saa kyseistä tekstiä. Kun olette valmiit, käyttäkää käskyä /done`
              );
            }
          }
        } catch (e) {
          console.log(e);
          throw new Error(
            "Seems like all groups have visited your checkpoint. If not, contact @mediakeisari"
          );
        }
      } else {
        throw new Error("Wrong group type");
      }
    }
  },
  {
    types: [H],
    name: "done",
    desc: ", Komento, kun olette valmiit ryhmän kanssa.",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const chat = await chats.getByParamAndJoin(
        msg.chat.id,
        "id",
        "checkpoint"
      );
      if (chat.checkpoint) {
        const checkpoint = await checkpoints.getByParamAndStatusAndGroup(
          chat.checkpoint.uuid,
          "uuid"
        );
        const sorted = checkpoint.status
          .filter(
            a => a.status === DONE || a.status === READY || a.status === START
          )
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (sorted[0].status !== START) {
          throw new Error(
            "You have to have group to be done with it. Your current status is " +
              sorted[0].status
          );
        }
        const status = await statuses.add(DONE);
        statuses.connectToCheckpoint(checkpoint.uuid, status);
        statuses.connectToGroup(sorted[0].group.uuid, status);
        try {
          const nextCheckpoint = await checkpoints.getByParamAndStatusAndGroup(
            (await checkpoints.getNext(checkpoint.orderNum)).uuid,
            "uuid"
          );
          const sortedStatus = nextCheckpoint.status
            .filter(
              a => a.status === START || a.status === DONE || a.status === READY
            )
            .sort((a, b) => b.time.getTime() - a.time.getTime());
          if (!sortedStatus.length || sortedStatus[0].status !== READY) {
            _bot.sendMessage(
              msg.chat.id,
              `Ryhmä sai ohjeet. Kun olette valmiit seuraavaa ryhmää varten, käyttäkää käskyä /ready`
            );
            _bot.sendMessage(
              nextCheckpoint.chat.id,
              sortedStatus.length && sortedStatus[0].status === START
                ? "Seuraava ryhmä jo koputtelee :D. Suorittakaa rasti loppuun, jonka jälkeen käyttäkää käskyä /done"
                : "Seuraava ryhmä jo koputtelee :D. Kun olette valmiit käyttäkää käskyä /ready"
            );
            _bot.sendMessage(sorted[0].group.chat.id, getLimboMessage());
            return;
          } else {
            const welcomeTexts = nextCheckpoint.status
              .filter(a => a.status.includes(WELCOMETEXT))
              .sort((a, b) => b.time.getTime() - a.time.getTime());
            const status = await statuses.add(START);
            statuses.connectToCheckpoint(nextCheckpoint.uuid, status);
            statuses.connectToGroup(sorted[0].group.uuid, status);
            if (welcomeTexts.length) {
              _bot.sendMessage(
                sorted[0].group.chat.id,
                welcomeTexts[0].status.split(WELCOMETEXT).join("")
              );
              _bot.sendMessage(
                nextCheckpoint.chat.id,
                `Ryhmä "${sorted[0].group.name}" on tulossa rastille. Tervetuloteksti lähetettiin ryhmälle, voitte laittaa ryhmälle viestiä käskyllä /broadcast [viesti]. Kun olette valmiit, käyttäkää käskyä /done`
              );
            } else {
              _bot.sendMessage(
                sorted[0].group.chat.id,
                `Tervetuloa rastille ${nextCheckpoint.name}. Ohjeita seuraa`
              );
              _bot.sendMessage(
                nextCheckpoint.chat.id,
                `Ryhmä "${sorted[0].group.name}" on tulossa rastille. Tervetulotekstiä ei ole asetettu, joten ryhmä ei ole vielä saanut mitään informaatiota. Kommunikoikaa ryhmälle käskyllä /broadcast [viesti]. Tervetulotekstin voitte asettaa käskyllä /setWelcomeMessage [tervetuloviesti]. Huomatkaa, että nykyinen ryhmä ei kuitenkaan saa kyseistä tekstiä. Kun olette valmiit, käyttäkää käskyä /done`
              );
            }
          }
        } catch (e) {
          console.log(e);
          _bot.sendMessage(sorted[0].group.chat.id, ENDTEXT);
        }
        _bot.sendMessage(
          msg.chat.id,
          "Ryhmä sai ohjeet. Kun olette valmiit ottamaan seuraavan ryhmän vastaan (eli edellinen ryhmä on poistunut), käyttäkää käskyä /ready "
        );
      } else {
        throw new Error("Wrong group type");
      }
    }
  },
  {
    types: [H],
    name: "broadcast",
    desc: "[välitettävä viesti], Välittää viestin nykyisille rastivieraillenne",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const code = msg.text ? p(msg.text) : "";
      if (!code) {
        throw new Error("There must be text to broadcast");
      }
      const chat = await chats.getByParamAndJoin(
        msg.chat.id,
        "id",
        "checkpoint"
      );
      if (chat.checkpoint) {
        const checkpoint = await checkpoints.getByParamAndStatusAndGroup(
          chat.checkpoint.uuid,
          "uuid"
        );
        const sorted = checkpoint.status
          .filter(
            a => a.status === DONE || a.status === READY || a.status === START
          )
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (!sorted.length || sorted[0].status !== START) {
          throw new Error("You have to have group to broadcast to them");
        }
        _bot.sendMessage(sorted[0].group.chat.id, code);
        _bot.sendMessage(
          msg.chat.id,
          `Viesti "${code}" välitetty ryhmälle ${sorted[0].group.number}) ${sorted[0].group.name}`
        );
      } else {
        throw new Error("Wrong group type");
      }
    }
  },
  {
    types: [G],
    name: "ask",
    desc:
      "[välitettävä viesti], Välittää kysymyksen nykyisille rastinpitäjillenne",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const code = msg.text ? p(msg.text) : "";
      if (!code) {
        throw new Error("Välitettävä viesti unohtui...");
      }
      const chat = await chats.getByParamAndJoin(msg.chat.id, "id", "group");
      if (chat.group) {
        const group = await groups.getByParamAndStatusAndCheckpoint(
          chat.group.uuid,
          "uuid"
        );
        const sorted = group.status
          .filter(
            a => a.status === DONE || a.status === READY || a.status === START
          )
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        if (!sorted.length || sorted[0].status !== START) {
          const admin = await persons.getByParam(true, "admin");
          _bot.sendMessage(
            admin.id,
            `Kysymys ryhmältä ${group.number}) ${group.name}:\n${code}\n\nVastaa käskyllä /sendToGroup ${group.number} [viesti]`
          );
        } else {
          _bot.sendMessage(
            sorted[0].checkpoint.chat.id,
            `Kysymys ryhmältä:\n${code}\n\nVastaa käskyllä /broadcast [viesti]`
          );
          _bot.sendMessage(msg.chat.id, `Kysymys lähetetty.`);
        }
      } else {
        throw new Error("Wrong group type");
      }
    }
  },
  {
    types: [H],
    name: "setWelcomeMessage",
    desc:
      "[tervetuloviesti], Asettaa viestin tervetuloviestiksi eli kaikki liittymislinkit tänne :D",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const code = msg.text ? p(msg.text) : "";
      if (!code) {
        throw new Error("Tervetuloviesti unohtui...");
      }
      const maxLength = 256 - WELCOMETEXT.length;
      if (code.length > maxLength) {
        throw new Error(`Liian pitkä, maksimipituus on ${maxLength} merkkiä`);
      }
      const chat = await chats.getByParamAndJoin(
        msg.chat.id,
        "id",
        "checkpoint"
      );
      if (chat.checkpoint) {
        const newStatus = await statuses.add(WELCOMETEXT + code);
        statuses.connectToCheckpoint(chat.checkpoint.uuid, newStatus);
        _bot.sendMessage(msg.chat.id, "New welcome text set");
      } else {
        throw new Error("Wrong group type");
      }
    }
  },
  {
    types: [H],
    name: "status",
    desc: ", Kertoo rastin statuksen",
    command: async (msg: TelegramBot.Message, _bot: TelegramBot) => {
      const chat = await chats.getByParamAndJoin(
        msg.chat.id,
        "id",
        "checkpoint"
      );
      if (chat.checkpoint) {
        const checkpoint = await checkpoints.getByParamAndStatusAndGroup(
          chat.checkpoint.uuid,
          "uuid"
        );
        const visitedGroups = _.groupBy(
          checkpoint.status.filter(sta => !!sta.group),
          "group.number"
        );
        const otherStatus = checkpoint.status
          .filter(sta => !sta.group)
          .sort((a, b) => b.time.getTime() - a.time.getTime());
        const groupAmount = (await groups.get()).length;

        const groupInfo = Object.keys(visitedGroups)
          .map(a => Number(a))
          .sort((a, b) => a - b)
          .map(a => String(a))
          .map(groupNumber => {
            const mapped = visitedGroups[groupNumber].map(sta => sta.status);
            if (mapped.includes(DONE)) {
              return `${groupNumber}) ${visitedGroups[groupNumber][0].group.name} -- Kävi jo`;
            }
            if (mapped.includes(START)) {
              return `${groupNumber}) ${visitedGroups[groupNumber][0].group.name} -- Tällä hetkellä rastilla`;
            }
          });

        _bot.sendMessage(
          msg.chat.id,
          `${checkpoint.name}:\n\n${groupInfo.join("\n")}\n${groupAmount -
            Object.keys(visitedGroups)
              .length} ryhmää jäljellä\n\nNykyinen tervetuloteksti:\n${otherStatus
            .filter(sta => sta.status.includes(WELCOMETEXT))[0]
            .status.split(WELCOMETEXT)
            .join("")}`
        );
      } else {
        throw new Error("Wrong group type");
      }
    }
  }
];

const getPayload = (s: string): string =>
  s.indexOf(" ") !== -1 ? s.substring(s.indexOf(" ") + 1) : "";

const p = getPayload;

const authFunction = async (msg: TelegramBot.Message) => {
  const code = msg.text ? p(msg.text) : "";
  const newAuth = code && chatIds[code] ? chatIds[code] : "";
  const isAdmin = (auth: ChatType) => auth === A;
  if (newAuth) {
    const priv = msg.from && msg.chat.id === msg.from.id;
    if (
      (priv && newAuth === A) ||
      (priv && newAuth === P) ||
      (!priv && newAuth === G) ||
      (!priv && newAuth === H)
    ) {
      if (priv) {
        const id = msg.chat.id;
        const person = await persons.getByParam(id, "id");
        if (person) {
          person.admin = isAdmin(newAuth);
          persons.update(person);
        } else {
          persons.create(
            msg.from
              ? `${msg.from.first_name} ${msg.from.last_name}`
              : "unknown",
            msg.chat.id,
            isAdmin(newAuth)
          );
        }
      }
      const chat = await chats.getByParam(msg.chat.id, "id");
      if (chat) {
        chat.type = newAuth;
        chats.update(chat);
      } else {
        chats.create(msg.chat.id, newAuth);
      }
    } else {
      bot.sendMessage(
        msg.chat.id,
        `This command needs a ${priv ? "group" : "private "}chat`
      );
    }
  } else {
    bot.sendMessage(msg.chat.id, "Invalid code. Try again!");
  }
};

const listCommands = async (msg: TelegramBot.Message) => {
  const chat = await chats.getByParam(msg.chat.id, "id");
  if (chat) {
    const auth = chat.type;
    bot.sendMessage(
      msg.chat.id,
      commands
        .filter(command => command.types.includes(auth) && !command.hidden)
        .map(command => `/${command.name} ${command.desc}`)
        .join("\n")
    );
  } else {
    bot.sendMessage(msg.chat.id, "Invalid authentication. Use command /auth");
  }
};

bot.onText(/\/auth/, authFunction);

bot.onText(/\/start/, msg => {
  bot.sendMessage(
    msg.chat.id,
    "Tervetuloa! Syötä saamasi koodi komennolla /auth [koodi]"
  );
});

bot.onText(/\/commands/, listCommands);

bot.onText(/\/help/, listCommands);

commands.forEach(async (command: Command) => {
  bot.onText(
    new RegExp("/" + command.name),
    async (msg: TelegramBot.Message) => {
      const chat = await chats.getByParam(msg.chat.id, "id");
      if (chat) {
        const perm = command.types.includes(chat.type);
        if (perm) {
          command.command(msg, bot).catch(error => {
            bot.sendMessage(msg.chat.id, error.message || "Unidentified error");
          });
        } else {
          bot.sendMessage(
            msg.chat.id,
            "Invalid permissions. Use command /auth to reset permissions"
          );
        }
      } else {
        bot.sendMessage(
          msg.chat.id,
          "Invalid authentication. Use command /auth"
        );
      }
    }
  );
  console.log(`${command.types} - /${command.name} ${command.desc}`);
});
