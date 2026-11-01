import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
} from "@nestjs/common";
import { z } from "zod";
import {
  assetSchema,
  articleSchema,
  changeSchema,
  changeTransitionSchema,
  userCreateSchema,
  userUpdateSchema,
  teamSchema,
  policySchema,
  catalogSchema,
  AssetInput,
  ArticleInput,
  ChangeInput,
  changeStatuses,
} from "@relaydesk/contracts";
import { Actor, Roles, uuidPipe, ZodPipe } from "../common/http";
import { User } from "../model/entities";
import { ResourcesService } from "./resources.service";
const assetUpdate = assetSchema.extend({
  version: z.number().int().positive(),
});
const articleUpdate = articleSchema.extend({
  version: z.number().int().positive(),
});
const changeUpdate = changeSchema.safeExtend({
  version: z.number().int().positive(),
});
@Controller()
export class ResourcesController {
  constructor(@Inject(ResourcesService) private readonly s: ResourcesService) {}
  @Get("reference") reference(@Actor() u: User) {
    return this.s.reference(u).then((data) => ({ data }));
  }
  @Get("assets") assets(@Actor() u: User) {
    return this.s.assets(u).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Post("assets") asset(
    @Actor() u: User,
    @Body(new ZodPipe(assetSchema)) b: AssetInput,
  ) {
    return this.s.saveAsset(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Put("assets/:id") assetPut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(assetUpdate)) b: AssetInput & { version: number },
  ) {
    const { version, ...v } = b;
    return this.s.saveAsset(u, v, id, version).then((data) => ({ data }));
  }
  @Get("articles") articles(@Actor() u: User) {
    return this.s.articles(u).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Post("articles") article(
    @Actor() u: User,
    @Body(new ZodPipe(articleSchema)) b: ArticleInput,
  ) {
    return this.s.saveArticle(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Put("articles/:id") articlePut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(articleUpdate)) b: ArticleInput & { version: number },
  ) {
    const { version, ...v } = b;
    return this.s.saveArticle(u, v, id, version).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Get("changes") changes() {
    return this.s.changes().then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Get("changes/:id") change(
    @Param("id", uuidPipe) id: string,
  ) {
    return this.s.changeDetail(id).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Post("changes") changePost(
    @Actor() u: User,
    @Body(new ZodPipe(changeSchema)) b: ChangeInput,
  ) {
    return this.s.saveChange(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Put("changes/:id") changePut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(changeUpdate)) b: ChangeInput & { version: number },
  ) {
    const { version, ...v } = b;
    return this.s.saveChange(u, v, id, version).then((data) => ({ data }));
  }
  @Roles("ADMIN", "AGENT") @Patch("changes/:id/status") changeStatus(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(changeTransitionSchema))
    b: {
      version: number;
      status: (typeof changeStatuses)[number];
      note: string;
    },
  ) {
    return this.s
      .transition(u, id, b.version, b.status, b.note)
      .then((data) => ({ data }));
  }
  @Roles("ADMIN") @Get("settings") settings() {
    return this.s.settings().then((data) => ({ data }));
  }
  @Roles("ADMIN") @Post("users") user(
    @Actor() u: User,
    @Body(new ZodPipe(userCreateSchema)) b: z.infer<typeof userCreateSchema>,
  ) {
    return this.s.createUser(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Put("users/:id") userPut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(userUpdateSchema)) b: z.infer<typeof userUpdateSchema>,
  ) {
    return this.s.updateUser(u, id, b).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Post("teams") team(
    @Actor() u: User,
    @Body(new ZodPipe(teamSchema)) b: z.infer<typeof teamSchema>,
  ) {
    return this.s.saveTeam(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Put("teams/:id") teamPut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(teamSchema)) b: z.infer<typeof teamSchema>,
  ) {
    return this.s.saveTeam(u, b, id).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Post("catalog") catalog(
    @Actor() u: User,
    @Body(new ZodPipe(catalogSchema)) b: z.infer<typeof catalogSchema>,
  ) {
    return this.s.saveCatalog(u, b).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Put("catalog/:id") catalogPut(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(catalogSchema)) b: z.infer<typeof catalogSchema>,
  ) {
    return this.s.saveCatalog(u, b, id).then((data) => ({ data }));
  }
  @Roles("ADMIN") @Put("policies/:id") policy(
    @Actor() u: User,
    @Param("id", uuidPipe) id: string,
    @Body(new ZodPipe(policySchema)) b: z.infer<typeof policySchema>,
  ) {
    return this.s.policy(u, id, b).then((data) => ({ data }));
  }
}
