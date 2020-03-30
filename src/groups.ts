import { getConnection, getRepository, SelectQueryBuilder } from "typeorm";
import { Group } from "./entity/Group";
import chats from "./chats";
import { Person } from "./entity/Person";
import { stringify } from "querystring";

const getByParam = (param: string | number, paramName: string) =>
  getRepository(Group)
    .createQueryBuilder("group")
    .where(`group.${paramName} = :param`, { param })
    .getOne();

const getByParamAndJoin = (
  param: string | number,
  paramName: string,
  joinName: string
) =>
  getRepository(Group)
    .createQueryBuilder("group")
    .where(`group.${paramName} = :param`, { param })
    .leftJoinAndSelect(`group.${joinName}`, joinName)
    .getOne();

const getByParamAndStatusAndCheckpoint = (
  param: string | number,
  paramName: string
) =>
  getRepository(Group)
    .createQueryBuilder("group")
    .where(`group.${paramName} = :param`, { param })
    .leftJoinAndSelect("group.status", "status")
    .leftJoinAndSelect("status.checkpoint", "checkpoint")
    .leftJoinAndSelect("group.chat", "chat")
    .leftJoinAndSelect("checkpoint.chat", "checkpointChat")
    .getOne();

const groups = {
  get: () =>
    getRepository(Group)
      .createQueryBuilder("group")
      .getMany(),
  getByParam,
  getByParamAndJoin,
  getNext: (num: number): Promise<Group> => {
    const getNum = (numb: number): Promise<Group> => {
      if (numb > 100) {
        throw new Error("No next group found");
      }
      try {
        return groups.getByGroupNum(numb + 1);
      } catch {
        return getNum(numb + 1);
      }
    };
    return getNum(num);
  },
  getByUuid: (uuid: string) => getByParam(uuid, "uuid"),
  getByName: (name: string) => getByParam(name, "name"),
  getByGroupNum: (num: number) => getByParam(num, "number"),
  getByChatId: (id: number) => {},
  getByParamAndStatusAndCheckpoint,
  update: (group: Group) => getConnection().manager.save(group),
  createNew: async (
    name: string,
    id: number,
    members: Person[],
    num?: number
  ) => {
    const group = new Group();
    group.name = name;
    group.chat = await chats.getByParam(id, "id");
    group.members = members;
    group.number = num || (await groups.get()).length + 1;
    getConnection().manager.save(group);
    return group;
  },
  calculateIndexes: async () =>
    (await groups.get()).forEach((group, i) => {
      group.number = i;
      getConnection().manager.save(group);
    }),
  removeGroup: (uuid: string) =>
    getConnection()
      .createQueryBuilder()
      .delete()
      .from(Group)
      .where("uuid = :uuid", { uuid })
      .execute()
};

export default groups;
