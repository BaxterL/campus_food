import { defineStore } from 'pinia';
import { STORAGE_KEYS } from '@/config';
import type { CartItem } from '@/services/api/types';
import { getJson, setJson } from '@/utils/storage';

interface CartState {
  merchantId: string | null;
  merchantName: string;
  items: CartItem[];
}

function loadCart(): CartState {
  const saved = getJson<CartState>(STORAGE_KEYS.cart);
  return saved ?? { merchantId: null, merchantName: '', items: [] };
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => loadCart(),

  getters: {
    totalQuantity: (state) => state.items.reduce((sum, i) => sum + i.quantity, 0),
    totalCents: (state) => state.items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    isEmpty: (state) => state.items.length === 0,
  },

  actions: {
    persist() {
      setJson(STORAGE_KEYS.cart, {
        merchantId: this.merchantId,
        merchantName: this.merchantName,
        items: this.items,
      });
    },

    clear() {
      this.merchantId = null;
      this.merchantName = '';
      this.items = [];
      this.persist();
    },

    addItem(payload: {
      merchantId: string;
      merchantName: string;
      productId: string;
      skuId?: string;
      productName: string;
      priceCents: number;
      imageUrl?: string;
    }) {
      if (this.merchantId && this.merchantId !== payload.merchantId) {
        uni.showModal({
          title: '提示',
          content: '购物车已有其他店铺商品，是否清空后添加？',
          success: (res) => {
            if (res.confirm) {
              this.clear();
              this._pushItem(payload);
            }
          },
        });
        return;
      }

      this.merchantId = payload.merchantId;
      this.merchantName = payload.merchantName;
      this._pushItem(payload);
    },

    _pushItem(payload: {
      productId: string;
      skuId?: string;
      productName: string;
      priceCents: number;
      imageUrl?: string;
    }) {
      const existing = this.items.find((i) => i.productId === payload.productId && i.skuId === payload.skuId);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.items.push({
          productId: payload.productId,
          skuId: payload.skuId,
          productName: payload.productName,
          priceCents: payload.priceCents,
          quantity: 1,
          imageUrl: payload.imageUrl,
        });
      }
      this.persist();
    },

    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find((i) => i.productId === productId);
      if (!item) return;
      if (quantity <= 0) {
        this.removeItem(productId);
        return;
      }
      item.quantity = quantity;
      this.persist();
    },

    removeItem(productId: string) {
      this.items = this.items.filter((i) => i.productId !== productId);
      if (this.items.length === 0) {
        this.merchantId = null;
        this.merchantName = '';
      }
      this.persist();
    },
  },
});
