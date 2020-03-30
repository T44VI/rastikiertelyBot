import { getConnection, getRepository } from "typeorm";
import { Chat } from "./entity/Chat";
import { ChatType } from "./types";

const getByParam = (param: string | number, paramName: string) =>
  getRepository(Chat)
    .createQueryBuilder("chat")
    .where(`chat.${paramName} = :param`, { param })
    .getOne();

const getManyByParam = (param: string | number, paramName: string) =>
  getRepository(Chat)
    .createQueryBuilder("chat")
    .where(`chat.${paramName} = :param`, { param })
    .getMany();

const getByParamAndJoin = (
  param: string | number,
  paramName: string,
  joinName: string
) =>
  getRepository(Chat)
    .createQueryBuilder("chat")
    .where(`chat.${paramName} = :param`, { param })
    .leftJoinAndSelect(`chat.${joinName}`, joinName)
    .getOne();

const chats = {
  get: () =>
    getRepository(Chat)
      .createQueryBuilder("chat")
      .getMany(),
  getByParam,
  getManyByParam,
  getByParamAndJoin,
  update: (chat: Chat) => getConnection().manager.save(chat),
  create: (id: number, type: ChatType) => {
    const chat = new Chat();
    chat.id = id;
    chat.type = type;
    getConnection().manager.save(chat);
    return chat;
  }
};

export default chats;
