import type { Services } from "@/services/core/types";

export abstract class BaseBrowserApi {
  protected services: Services | null | undefined;

  abstract initialize(): void;
  abstract openOptionsPageListener(): void;
  abstract setupNavigationListener(): void;

  init(services: Services): void {
    this.services = services;
  }

}
