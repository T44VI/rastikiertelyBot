import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  PrimaryColumn,
  ManyToMany
} from "typeorm";
import { ChatType } from "../types";
import { Person } from "./Person";
import { Checkpoint } from "./Checkpoint";
import { Group } from "./Group";

@Entity()
export class Chat {
  @PrimaryColumn()
  id: number;

  @Column()
  type: ChatType;

  @OneToOne(
    type => Checkpoint,
    checkpoint => checkpoint.chat,
    {
      cascade: true
    }
  )
  checkpoint: Checkpoint;

  @OneToOne(
    type => Group,
    group => group.chat,
    {
      cascade: true
    }
  )
  group: Group;
}
