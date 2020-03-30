import { Status } from "./entity/Status";
import { getConnection, getRepository } from "typeorm";
import groups from "./groups";
import checkpoints from "./checkpoints";

const statuses = {
  add: async (status: string) => {
    const newStatus = new Status();
    newStatus.status = status;
    newStatus.time =
      status === "START" ? new Date(Date.now() + 1000) : new Date();
    return getConnection().manager.save(newStatus);
  },
  connectToGroup: async (groupuuid: string, status) => {
    const group = await groups.getByParamAndJoin(groupuuid, "uuid", "status");
    group.status.push(status);
    getConnection().manager.save(group);
  },
  connectToCheckpoint: async (checkpointuuid: string, status: Status) => {
    const checkpoint = await checkpoints.getByParamAndJoin(
      checkpointuuid,
      "uuid",
      "status"
    );
    checkpoint.status.push(status);
    getConnection().manager.save(checkpoint);
  },
  getFullStatusesByUuids: (uuids: string[]) =>
    Promise.all(
      uuids.map(uuid =>
        getRepository(Status)
          .createQueryBuilder("status")
          .where("status.uuid = :uuid", { uuid })
          .leftJoinAndSelect("status.group", "group")
          .leftJoinAndSelect("status.checkpoint", "checkponint")
          .getOne()
      )
    )
};

export default statuses;
