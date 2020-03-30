import { getRepository, getConnection } from "typeorm";
import { Person } from "./entity/Person";
import { Chat } from "./entity/Chat";

const getByParam = (param: boolean | string | number, paramName: string) =>
  getRepository(Person)
    .createQueryBuilder("person")
    .where(`person.${paramName} = :param`, { param })
    .getOne();

const getManyByParam = (param: string | number, paramName: string) =>
  getRepository(Person)
    .createQueryBuilder("person")
    .where(`person.${paramName} = :param`, { param })
    .getMany();

const persons = {
  get: () =>
    getRepository(Person)
      .createQueryBuilder("person")
      .getMany(),
  getByParam,
  getManyByParam,
  create: (name: string, id: number, admin: boolean) => {
    const person = new Person();
    person.name = name;
    person.admin = admin;
    person.id = id;
    getConnection().manager.save(person);
    return person;
  },
  update: (person: Person) => getConnection().manager.save(person)
};

export default persons;
