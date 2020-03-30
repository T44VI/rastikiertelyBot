import TelegramBot from "node-telegram-bot-api";

export type ChatType = "P" | "G" | "A" | "H"; // Person, Group, Admin, PersonAdmin, Hosts

export type StatusType = "DONE" | "START" | "READY";

export type Chat = {
  type: ChatType;
};

export type Person = {
  name: string;
  admin: boolean;
};

export type Command = {
  types: ChatType[];
  command: (msg: TelegramBot.Message, _bot: TelegramBot) => Promise<void>;
  name: string;
  desc: string;
  hidden?: boolean;
};

export type Checkpoint = {
  name: string;
  groupOnNumber?: number;
  id: number;
  limbo?: boolean;
  number: number;
};

export type Group = {
  name: string;
  id: number;
  members: number[];
  number: number;
  uuid: string;
};
