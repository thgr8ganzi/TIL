import {IQueryHandler, QueryHandler} from "@nestjs/cqrs";
import {GetUserInfoQuery} from "./get-user-info.query";
import {InjectRepository} from "@nestjs/typeorm";
import {UserEntity} from "../entity/user.entity";
import {Repository} from "typeorm";
import {UserInfo} from "../UserInfo";
import {NotFoundException} from "@nestjs/common";

@QueryHandler(GetUserInfoQuery)
export class GetUserInfoQueryHandler implements IQueryHandler<GetUserInfoQuery> {
    constructor(
        @InjectRepository(UserEntity) private usersRepository: Repository<UserEntity>,
    ) {}

    async execute(query: GetUserInfoQuery): Promise<UserInfo> {
        const { userId } = query;
        const user = await this.usersRepository.findOne({
            where: { id: userId }
        });
        if (!user) {
            throw new NotFoundException('유저가 존재하지 않습니다');
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
        };
    }
}