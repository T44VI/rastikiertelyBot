import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Status } from "./Status";
import { Chat } from "./Chat";

@Entity()
export class Checkpoint {
  @PrimaryGeneratedColumn("uuid")
  uuid: string;

  @Column()
  name: string;

  @Column()
  orderNum: number;

  @OneToMany(
    type => Status,
    status => status.checkpoint
  )
  status: Status[];

  @OneToOne(
    type => Chat,
    chat => chat.checkpoint
  )
  @JoinColumn()
  chat: Chat;
}
