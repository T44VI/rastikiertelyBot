import { Entity, Column, ManyToMany, PrimaryColumn } from "typeorm";
import { Group } from "./Group";

@Entity()
export class Person {
  @Column()
  name: string;

  @PrimaryColumn()
  id: number;

  @Column()
  admin: boolean;

  @ManyToMany(
    () => Group,
    group => group.members,
    {
      cascade: true
    }
  )
  groups: Group[];
}
