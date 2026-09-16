import type { WechatPayParams } from '@/services/api/types';

export interface WechatLoginResult {
  code: string;
}

/** 微信登录，仅小程序端可用 */
export async function wechatLogin(): Promise<WechatLoginResult> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => {
        if (!res.code) {
          reject(new Error('未获取到微信登录 code'));
          return;
        }
        resolve({ code: res.code });
      },
      fail: (err) => reject(new Error(err.errMsg || '微信登录失败')),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('微信登录仅支持微信小程序'));
  // #endif
}

/** 调起微信支付；success 仅表示用户完成支付界面操作，不代表到账 */
export async function requestWechatPayment(params: WechatPayParams): Promise<void> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: params.timeStamp,
      nonceStr: params.nonceStr,
      package: params.package,
      signType: params.signType,
      paySign: params.paySign,
      success: () => resolve(),
      fail: (err) => reject(new Error(err.errMsg || '支付取消或失败')),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('微信支付仅支持微信小程序'));
  // #endif
}

/** 扫码，用于骑手/商家核销场景 */
export async function scanCode(): Promise<string> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.scanCode({
      onlyFromCamera: false,
      success: (res) => resolve(res.result),
      fail: (err) => reject(new Error(err.errMsg || '扫码失败')),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('扫码仅支持微信小程序'));
  // #endif
}

/** 订阅消息（占位封装，需在后端配置模板 ID） */
export async function requestSubscribeMessage(tmplIds: string[]): Promise<Record<string, string>> {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.requestSubscribeMessage({
      tmplIds,
      success: (res) => resolve(res as Record<string, string>),
      fail: (err) => reject(new Error(err.errMsg || '订阅失败')),
    });
  });
  // #endif

  // #ifndef MP-WEIXIN
  return Promise.resolve({});
  // #endif
}
