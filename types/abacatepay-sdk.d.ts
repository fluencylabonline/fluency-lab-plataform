declare module "@abacatepay/sdk" {
  export enum PaymentMethod {
    Pix = "PIX",
    Card = "CARD"
  }

  export enum PaymentStatus {
    Pending = "PENDING",
    Expired = "EXPIRED",
    Cancelled = "CANCELLED",
    Paid = "PAID",
    Refunded = "REFUNDED"
  }

  export enum SubscriptionStatus {
    Pending = "PENDING",
    Active = "ACTIVE",
    Cancelled = "CANCELLED",
    Expired = "EXPIRED",
    Failed = "FAILED"
  }

  export interface AbacatePayOptions {
    secret?: string;
    rest?: unknown;
  }

  export type AbacatePayMetadata = Record<string, string | number | boolean | null | undefined>;
  
  export const AbacatePay: (options: AbacatePayOptions) => {
    customers: {
      get(id: string): Promise<import("@abacatepay/types/v2").APICustomer>;
      delete(id: string): Promise<import("@abacatepay/types/v2").APICustomer>;
      create(body: Omit<import("@abacatepay/types/v2").RESTPostCreateCustomerBody, 'metadata'> & { metadata?: AbacatePayMetadata }): Promise<import("@abacatepay/types/v2").APICustomer>;
      list(query?: import("@abacatepay/types/v2").RESTGetListCustomersQueryParams): Promise<import("@abacatepay/types/v2").RESTGetListCustomersData>;
    };
    checkouts: {
      create(body: Omit<import("@abacatepay/types/v2").RESTPostCreateNewCheckoutBody, 'metadata'> & { metadata?: AbacatePayMetadata }): Promise<import("@abacatepay/types/v2").APICheckout>;
      list(): Promise<import("@abacatepay/types/v2").RESTGetListCheckoutsData>;
      get(id: string): Promise<import("@abacatepay/types/v2").APICheckout>;
    };
    pix: {
      create(body: Omit<import("@abacatepay/types/v2").RESTPostCreateQRCodePixBody, 'metadata'> & { metadata?: AbacatePayMetadata }): Promise<import("@abacatepay/types/v2").APIQRCodePIX>;
      simulate(id: string, metadata?: AbacatePayMetadata): Promise<import("@abacatepay/types/v2").APIQRCodePIX>;
      status(id: string): Promise<import("@abacatepay/types/v2").RESTGetCheckQRCodePixStatusData>;
    };
    coupons: {
      create(body: import("@abacatepay/types/v2").RESTPostCreateCouponBody): Promise<import("@abacatepay/types/v2").APICoupon>;
      delete(id: string): Promise<import("@abacatepay/types/v2").APICoupon>;
      get(id: string): Promise<import("@abacatepay/types/v2").APICoupon>;
      list(query?: import("@abacatepay/types/v2").RESTGetListCouponsQueryParams): Promise<import("@abacatepay/types/v2").RESTGetListCouponsData>;
      toggleStatus(id: string): Promise<import("@abacatepay/types/v2").APICoupon>;
    };
    store: {
      get(): Promise<import("@abacatepay/types/v2").APIStore>;
    };
    mrr: {
      get(): Promise<import("@abacatepay/types/v2").RESTGetMRRData>;
      revenue(params: import("@abacatepay/types/v2").RESTGetRevenueByPeriodQueryParams): Promise<import("@abacatepay/types/v2").RESTGetRevenueByPeriodData>;
      merchant(): Promise<import("@abacatepay/types/v2").RESTGetMerchantData>;
    };
    payouts: {
      create(body: import("@abacatepay/types/v2").RESTPostCreateNewPayoutBody): Promise<import("@abacatepay/types/v2").APIPayout>;
      get(id: string): Promise<import("@abacatepay/types/v2").APIPayout>;
      list(query?: import("@abacatepay/types/v2").RESTGetListPayoutsQueryParams): Promise<import("@abacatepay/types/v2").RESTGetListPayoutsData>;
    };
    subscriptions: {
      create(body: import("@abacatepay/types/v2").RESTPostCreateSubscriptionBody): Promise<import("@abacatepay/types/v2").APISubscription>;
      list(query?: import("@abacatepay/types/v2").RESTGetListSubscriptionsQueryParams): Promise<import("@abacatepay/types/v2").RESTGetListSubscriptionsData>;
    };
    products: {
      create(body: import("@abacatepay/types/v2").RESTPostCreateProductBody): Promise<import("@abacatepay/types/v2").APIProduct>;
      get(query: import("@abacatepay/types/v2").RESTGetProductQueryParams): Promise<import("@abacatepay/types/v2").APIProduct>;
      list(query?: import("@abacatepay/types/v2").RESTGetListProductsQueryParams): Promise<import("@abacatepay/types/v2").RESTGetListProductsData>;
    };
  };

  export class HTTPError extends Error {
    constructor(message: string, route: string, status: number, method: string);
  }

  export class AbacatePayError extends Error {
    constructor(message: string);
  }
}
