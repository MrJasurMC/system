import { Controller, Get, Param, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/user.entity';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  /** GET /api/inventory */
  @Get()
  findMine(@CurrentUser() user: User) {
    return this.inventory.findForUser(user.id);
  }

  /** GET /api/inventory/exchange */
  @Get('exchange')
  getExchangeItems() {
    return this.inventory.getExchangeItems();
  }

  /** POST /api/inventory/exchange/:id/purchase */
  @Post('exchange/:id/purchase')
  purchaseFromExchange(@Param('id') itemId: string, @CurrentUser() user: User) {
    return this.inventory.purchaseFromExchange(user.id, itemId);
  }

  /** POST /api/inventory/sell/:id */
  @Post('sell/:id')
  sellItem(@Param('id') itemId: string, @CurrentUser() user: User) {
    return this.inventory.sellItem(user.id, itemId);
  }

  /** POST /api/inventory/use/:id */
  @Post('use/:id')
  use(@Param('id') itemId: string, @CurrentUser() user: User) {
    return this.inventory.use(user.id, itemId);
  }

  /** POST /api/inventory/equip/:id — equips a weapon (or cosmetic); swaps out any other equipped weapon. */
  @Post('equip/:id')
  equip(@Param('id') itemId: string, @CurrentUser() user: User) {
    return this.inventory.equip(user.id, itemId);
  }

  /** POST /api/inventory/unequip/:id */
  @Post('unequip/:id')
  unequip(@Param('id') itemId: string, @CurrentUser() user: User) {
    return this.inventory.unequip(user.id, itemId);
  }
}
