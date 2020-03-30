import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  OneToMany
} from "typeorm";
import { Group } from "./Group";
import { Checkpoint } from "./Checkpoint";

@Entity()
export class Status {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column()
  status: string;

  @Column("timestamp")
  time: Date;

  @ManyToOne(
    type => Checkpoint,
    checkpoint => checkpoint.status
  )
  checkpoint: Checkpoint;
  @ManyToOne(
    type => Group,
    group => group.status
  )
  group: Group;
}
