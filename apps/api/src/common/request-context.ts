import { Role } from '@campus-food/domain';

export interface RequestContext {
  requestId: string;
  userId: string;
  role: Role;
  merchantId?: string;
}
