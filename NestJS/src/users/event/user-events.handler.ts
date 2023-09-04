import {EventsHandler, IEventHandler} from "@nestjs/cqrs";
import {UserCreatedEvent} from "./user-created.event";
import {TestEvent} from "./test.event";
import {EmailService} from "../../email/email.service";

@EventsHandler(UserCreatedEvent, TestEvent)
export class UserEventsHandler implements IEventHandler<UserCreatedEvent | TestEvent> {
    constructor(
        private emailService: EmailService,
    ) {}
    async handle(event: UserCreatedEvent | TestEvent) {
        switch (event.name) {
            case UserCreatedEvent.name: {
                console.log('UserCreatedEvent!');
                const { email, signupVerifyToken } = event as UserCreatedEvent;
                await this.emailService.sendMemberJoinVerification(email, signupVerifyToken);
                break;
            }
            case TestEvent.name: {
                console.log('TestEvent!');
                break;
            }
            default:
                break;
        }
    }
}