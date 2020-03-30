import { getConnection, getRepository } from "typeorm";
import chats from "./chats";
import { Checkpoint } from "./entity/Checkpoint";
import { Status } from "./entity/Status";

const getByParam = (param: string | number, paramName: string) =>
  getRepository(Checkpoint)
    .createQueryBuilder("checkpoint")
    .where(`checkpoint.${paramName} = :param`, { param })
    .getOne();

const getByParamAndJoin = (
  param: string | number,
  paramName: string,
  joinName: string
) =>
  getRepository(Checkpoint)
    .createQueryBuilder("checkpoint")
    .where(`checkpoint.${paramName} = :param`, { param })
    .leftJoinAndSelect(`checkpoint.${joinName}`, joinName)
    .getOne();

const getByParamAndStatusAndGroup = (
  param: string | number,
  paramName: string
) =>
  getRepository(Checkpoint)
    .createQueryBuilder("checkpoint")
    .where(`checkpoint.${paramName} = :param`, { param })
    .leftJoinAndSelect("checkpoint.status", "status")
    .leftJoinAndSelect("status.group", "group")
    .leftJoinAndSelect("checkpoint.chat", "chat")
    .leftJoinAndSelect("group.chat", "groupChat")
    .getOne();

const changeNumber = async (checkpoint: Checkpoint, newNumber: number) => {
  const newCheckpoint = await getByParam(newNumber, "orderNum");
  if (newCheckpoint) {
    await changeNumber(newCheckpoint, newNumber + 1);
  }
  checkpoint.orderNum = newNumber;
  checkpoints.update(checkpoint);
};

const checkpoints = {
  get: () =>
    getRepository(Checkpoint)
      .createQueryBuilder("checkpoint")
      .getMany(),
  getByParam,
  getByParamAndJoin,
  getByParamAndStatusAndGroup,
  getNext: (num: number): Promise<Checkpoint> => {
    const getNum = async (numb: number): Promise<Checkpoint> => {
      if (numb > 100) {
        throw new Error("No next group found");
      }
      return checkpoints.getByParam(numb + 1, "orderNum") || getNum(numb + 1);
    };
    return getNum(num);
  },
  update: (checkpoint: Checkpoint) => getConnection().manager.save(checkpoint),
  createNew: async (
    name: string,
    status: Status[],
    orderNum?: number,
    id?: number
  ) => {
    const cp = new Checkpoint();
    cp.name = name;
    cp.status = status;
    cp.orderNum = orderNum || (await checkpoints.get()).length + 1;
    if (id) {
      cp.chat = await chats.getByParam(id, "id");
    }
    getConnection().manager.save(cp);
    return cp;
  },
  setOrder: async (checkpoint: Checkpoint, newNumber: number) => {
    const amount = (await checkpoints.get()).length;
    if (newNumber <= 0) {
      changeNumber(checkpoint, 1);
    } else if (newNumber < amount) {
      changeNumber(checkpoint, amount);
    } else {
      changeNumber(checkpoint, newNumber);
    }
  },
  removeCheckpoint: (uuid: string) =>
    getConnection()
      .createQueryBuilder()
      .delete()
      .from(Checkpoint)
      .where("uuid = :uuid", { uuid })
      .execute()
};

export default checkpoints;
