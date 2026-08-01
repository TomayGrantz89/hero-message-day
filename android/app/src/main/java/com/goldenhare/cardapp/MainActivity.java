package com.goldenhare.cardapp;

import android.content.Intent;
import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

import ru.rustore.sdk.core.tasks.OnCompleteListener;
import ru.rustore.sdk.core.tasks.OnSuccessListener;
import ru.rustore.sdk.pay.RuStorePayClient;
import ru.rustore.sdk.pay.interactor.purchase.PurchaseInteractor;
import ru.rustore.sdk.pay.interactor.purchase.model.AcknowledgementState;
import ru.rustore.sdk.pay.interactor.purchase.model.ProductPurchaseParams;
import ru.rustore.sdk.pay.interactor.purchase.model.ProductPurchaseResult;
import ru.rustore.sdk.pay.interactor.purchase.model.Purchase;
import ru.rustore.sdk.pay.interactor.purchase.model.PurchaseStatus;
import ru.rustore.sdk.pay.model.RuStorePaymentException;
import ru.rustore.sdk.pay.model.product.ProductId;
import ru.rustore.sdk.pay.theme.SdkTheme;

public class MainActivity extends BridgeActivity {

    private static final String PREMIUM_PRODUCT_ID = "premium_unlock";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RuStorePayBridge.class);
        super.onCreate(savedInstanceState);

        // Обработка deeplink при возврате из банковского приложения
        RuStorePayClient.Companion.getInstance()
                .getIntentInteractor()
                .proceedIntent(getIntent(), SdkTheme.LIGHT);
    }

    @Override
    protected void onNewIntent(@NonNull Intent intent) {
        super.onNewIntent(intent);

        // Обработка deeplink при возврате из банковского приложения
        RuStorePayClient.Companion.getInstance()
                .getIntentInteractor()
                .proceedIntent(intent, SdkTheme.LIGHT);
    }

    @CapacitorPlugin(name = "RuStorePayBridge")
    public static class RuStorePayBridge extends Plugin {

        /**
         * Проверяет, куплен ли премиум-доступ.
         * Вызывается из Angular при старте приложения.
         */
        @PluginMethod
        public void checkPremiumStatus(PluginCall call) {
            PurchaseInteractor purchaseInteractor = RuStorePayClient.Companion.getInstance()
                    .getPurchaseInteractor();

            purchaseInteractor.getPurchases(null, null, null)
                    .addOnSuccessListener(new OnSuccessListener<List<Purchase>>() {
                        @Override
                        public void onSuccess(List<Purchase> purchases) {
                            boolean isPurchased = false;

                            for (Purchase purchase : purchases) {
                                if (PREMIUM_PRODUCT_ID.equals(purchase.getProductId().getValue())) {
                                    PurchaseStatus status = purchase.getPurchaseStatus();
                                    if (status == PurchaseStatus.PAID || status == PurchaseStatus.CONFIRMED) {
                                        isPurchased = true;
                                        break;
                                    }
                                }
                            }

                            JSObject ret = new JSObject();
                            ret.put("isPurchased", isPurchased);
                            call.resolve(ret);
                        }
                    })
                    .addOnCompleteListener(new OnCompleteListener<List<Purchase>>() {
                        @Override
                        public void onComplete(@Nullable List<Purchase> purchases, @Nullable Throwable throwable) {
                            if (throwable != null) {
                                // Если SDK недоступен (нет RuStore на устройстве), возвращаем false
                                JSObject ret = new JSObject();
                                ret.put("isPurchased", false);
                                ret.put("error", throwable.getMessage());
                                call.resolve(ret);
                            }
                        }
                    });
        }

        /**
         * Запускает платёжную шторку RuStore для покупки премиума.
         * Вызывается из Angular при клике на "Купить премиум".
         */
        @PluginMethod
        public void startPaymentFlow(PluginCall call) {
            String productId = call.getString("productId", PREMIUM_PRODUCT_ID);

            ProductPurchaseParams params = new ProductPurchaseParams(
                    new ProductId(productId),
                    null,  // quantity — null для непотребляемого товара
                    null,  // orderId
                    null,  // developerPayload
                    null,  // appUserId
                    null   // appUserEmail
            );

            PurchaseInteractor purchaseInteractor = RuStorePayClient.Companion.getInstance()
                    .getPurchaseInteractor();

            purchaseInteractor.purchase(
                    params,
                    ru.rustore.sdk.pay.interactor.purchase.model.PreferredPurchaseType.ONE_STEP,
                    SdkTheme.LIGHT,
                    null  // purchaseEventListener
            ).addOnSuccessListener(new OnSuccessListener<ProductPurchaseResult>() {
                        @Override
                        public void onSuccess(ProductPurchaseResult result) {
                            // Покупка успешна — подтверждаем выдачу товара
                            acknowledgePurchase(result.getPurchaseId().getValue());

                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            ret.put("purchaseId", result.getPurchaseId().getValue());
                            ret.put("invoiceId", result.getInvoiceId().getValue());
                            call.resolve(ret);
                        }
                    })
                    .addOnCompleteListener(new OnCompleteListener<ProductPurchaseResult>() {
                        @Override
                        public void onComplete(@Nullable ProductPurchaseResult result, @Nullable Throwable throwable) {
                            if (throwable != null) {
                                JSObject ret = new JSObject();
                                ret.put("success", false);

                                if (throwable instanceof RuStorePaymentException.ProductPurchaseCancelled) {
                                    ret.put("cancelled", true);
                                    ret.put("error", "Покупка отменена пользователем");
                                } else if (throwable instanceof RuStorePaymentException.ProductPurchaseException) {
                                    ret.put("cancelled", false);
                                    ret.put("error", throwable.getMessage() != null
                                            ? throwable.getMessage() : "Ошибка при покупке");
                                } else {
                                    ret.put("cancelled", false);
                                    ret.put("error", throwable.getMessage() != null
                                            ? throwable.getMessage() : "Неизвестная ошибка");
                                }

                                call.resolve(ret);
                            }
                        }
                    });
        }

        /**
         * Подтверждает выдачу товара после успешной покупки.
         * Это важно для непотребляемых товаров — RuStore ждёт подтверждения.
         */
        private void acknowledgePurchase(String purchaseId) {
            PurchaseInteractor purchaseInteractor = RuStorePayClient.Companion.getInstance()
                    .getPurchaseInteractor();

            purchaseInteractor.updateAcknowledgementState(
                    new ru.rustore.sdk.pay.interactor.purchase.model.PurchaseId(purchaseId),
                    AcknowledgementState.ACKNOWLEDGED,
                    null  // developerPayload
            );
        }
    }
}
