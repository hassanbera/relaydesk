import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  commentSchema,
  ticketCreateSchema,
  ticketListSchema,
  ticketUpdateSchema,
  TicketCreate,
  TicketUpdate,
  TicketFilters,
} from "@relaydesk/contracts";
import { Actor, uuidPipe, ZodPipe } from "../common/http";
import { User } from "../model/entities";
import { TicketsService } from "./tickets.service";
@Controller("tickets")
export class TicketsController {
  constructor(
    @Inject(TicketsService) private readonly service: TicketsService,
  ) {}
  @Get() list(
    @Actor() u: User,
    @Query(new ZodPipe(ticketListSchema)) q: TicketFilters,
  ) {
    return this.service.list(u, q).then((data) => ({ data }));
  }
  @Get(":id") detail(@Actor() u: User, @Param("id", uuidPipe) id: string) {
    return this.service.detail(u, id).then((data) => ({ data }));
  }
  @Post() create(
    @Actor() u: User,
    @Body(new ZodPipe(ticketCreateSchema)) input: TicketCreate,
  ) {
    return this.service.create(u, input).then((data) => ({ data }));
  }
  @Patch(":id") update(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(ticketUpdateSchema)) input: TicketUpdate,
  ) {
    return this.service.update(u, id, input).then((data) => ({ data }));
  }
  @Post(":id/comments") comment(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(commentSchema))
    input: { body: string; internal: boolean },
  ) {
    return this.service
      .comment(u, id, input.body, input.internal)
      .then((data) => ({ data }));
  }
}
