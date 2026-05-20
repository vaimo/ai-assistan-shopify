import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Validates that the :shopId URL parameter matches the shop domain extracted
 * from the verified Shopify session JWT by ShopifySessionGuard.
 *
 * Must be applied AFTER ShopifySessionGuard so that request.shopDomain is set.
 */
@Injectable()
export class ShopParamGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { shopDomain?: string }>();

    const shopId = request.params['shopId'];
    const shopDomain = request.shopDomain;

    if (!shopDomain) {
      throw new ForbiddenException('Shop domain not verified');
    }

    if (!shopId || shopId !== shopDomain) {
      throw new ForbiddenException('shopId does not match authenticated shop');
    }

    return true;
  }
}
