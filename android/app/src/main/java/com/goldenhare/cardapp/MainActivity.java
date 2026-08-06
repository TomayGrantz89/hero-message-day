package com.goldenhare.cardapp;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.List;

import ru.rustore.sdk.core.tasks.OnFailureListener;
import ru.rustore.sdk.core.tasks.OnSuccessListener;
import ru.rustore.sdk.core.tasks.Task;
import ru.rustore.sdk.pay.PurchaseInteractor;
import ru.rustore.sdk.pay.RuStorePayClient;
import ru.rustore.sdk.pay.callback.PurchaseEventListener;
import ru.rustore.sdk.pay.model.AcknowledgementState;
import ru.rustore.sdk.pay.model.AppUserEmail;
import ru.rustore.sdk.pay.model.AppUserId;
import ru.rustore.sdk.pay.model.DeveloperPayload;
import ru.rustore.sdk.pay.model.OrderId;
import ru.rustore.sdk.pay.model.PreferredPurchaseType;
import ru.rustore.sdk.pay.model.ProductId;
import ru.rustore.sdk.pay.model.ProductPurchaseParams;
import ru.rustore.sdk.pay.model.ProductPurchaseResult;
import ru.rustore.sdk.pay.model.ProductPurchaseStatus;
import ru.rustore.sdk.pay.model.ProductType;
import ru.rustore.sdk.pay.model.Purchase;
import ru.rustore.sdk.pay.model.PurchaseId;
import ru.rustore.sdk.pay.model.PurchaseStatus;
import ru.rustore.sdk.pay.model.Quantity;
import ru.rustore.sdk.pay.model.RuStorePaymentException;
import ru.rustore.sdk.pay.model.SdkTheme;

public class MainActivity extends BridgeActivity {

  private static final String PRODUCT_ID = "premium_unlock";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(RuStorePayBridge.class);
    super.onCreate(savedInstanceState);

    // Обрабатываем deeplink от RuStore (возврат после оплаты)
    try {
      RuStorePayClient.Companion.getInstance().getIntentInteractor().proceedIntent(getIntent(), SdkTheme.LIGHT);
    } catch (Exception e) {
      // SDK ещё не инициализирован — пропускаем, deeplink обработается в onNewIntent
    }
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    try {
      RuStorePayClient.Companion.getInstance().getIntentInteractor().proceedIntent(intent, SdkTheme.LIGHT);
    } catch (Exception e) {
      // ignore
    }
  }

  @CapacitorPlugin(name = "RuStorePayBridge")
  public static class RuStorePayBridge extends Plugin {

    private PurchaseInteractor getPurchaseInteractor() {
      return RuStorePayClient.Companion.getInstance().getPurchaseInteractor();
    }

    /**
     * Проверяет, куплен ли премиум (непотребляемый товар premium_unlock).
     * Возвращает { isPurchased: true/false }.
     */
    @PluginMethod
    public void checkPremiumStatus(PluginCall call) {
      try {
        PurchaseInteractor interactor = getPurchaseInteractor();
        Task<List<Purchase>> task = interactor.getPurchases(
            ProductType.NON_CONSUMABLE_PRODUCT,
            null,
            null
        );

        task.addOnSuccessListener(new OnSuccessListener<List<Purchase>>() {
          @Override
          public void onSuccess(List<Purchase> purchases) {
            boolean isPurchased = false;
            if (purchases != null) {
              for (Purchase purchase : purchases) {
                PurchaseStatus status = purchase.getStatus();
                if (status == ProductPurchaseStatus.PAID || status == ProductPurchaseStatus.CONFIRMED) {
                  isPurchased = true;
                  break;
                }
              }
            }
            JSObject ret = new JSObject();
            ret.put("isPurchased", isPurchased);
            call.resolve(ret);
          }
        });

        task.addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(Throwable throwable) {
            JSObject ret = new JSObject();
            ret.put("isPurchased", false);
            ret.put("error", throwable != null ? throwable.getMessage() : "unknown");
            call.resolve(ret);
          }
        });
      } catch (Exception e) {
        JSObject ret = new JSObject();
        ret.put("isPurchased", false);
        ret.put("error", e.getMessage());
        call.resolve(ret);
      }
    }

    /**
     * Запускает шторку оплаты RuStore для товара premium_unlock.
     * Возвращает { success: true, purchaseId: "..." } или { success: false, cancelled: true/false, error: "..." }.
     */
    @PluginMethod
    public void startPaymentFlow(PluginCall call) {
      String productId = call.getString("productId", PRODUCT_ID);

      try {
        ProductPurchaseParams params = new ProductPurchaseParams(
            new ProductId(productId),
            new Quantity(1),
            new OrderId(""),
            new DeveloperPayload(""),
            new AppUserId(""),
            new AppUserEmail("")
        );

        PurchaseInteractor interactor = getPurchaseInteractor();
        Task<ProductPurchaseResult> task = interactor.purchase(
            params,
            PreferredPurchaseType.ONE_STEP,
            SdkTheme.LIGHT,
            new PurchaseEventListener() {
              @Override
              public void onPurchaseCreated(PurchaseId purchaseId, ru.rustore.sdk.pay.model.InvoiceId invoiceId) {
                // no-op
              }

              @Override
              public void onPaymentStarted(PurchaseId purchaseId, ru.rustore.sdk.pay.model.InvoiceId invoiceId) {
                // no-op
              }

              @Override
              public void onPaymentCompleted(PurchaseId purchaseId, ru.rustore.sdk.pay.model.InvoiceId invoiceId) {
                // no-op
              }

              @Override
              public void onPaymentFailed(PurchaseId purchaseId, ru.rustore.sdk.pay.model.InvoiceId invoiceId) {
                // no-op
              }

              @Override
              public void onPurchaseCancelled(PurchaseId purchaseId, ru.rustore.sdk.pay.model.InvoiceId invoiceId) {
                // no-op
              }
            }
        );

        task.addOnSuccessListener(new OnSuccessListener<ProductPurchaseResult>() {
          @Override
          public void onSuccess(ProductPurchaseResult result) {
            // Подтверждаем выдачу товара (acknowledgement), чтобы RuStore не считал покупку невыданной
            if (result != null && result.getPurchaseId() != null) {
              acknowledgePurchase(result.getPurchaseId());
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("purchaseId", result != null && result.getPurchaseId() != null
                ? result.getPurchaseId().getValue() : "");
            call.resolve(ret);
          }
        });

        task.addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(Throwable throwable) {
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("cancelled", throwable instanceof RuStorePaymentException.ProductPurchaseCancelled);
            ret.put("error", throwable != null ? throwable.getMessage() : "unknown");
            call.resolve(ret);
          }
        });
      } catch (Exception e) {
        JSObject ret = new JSObject();
        ret.put("success", false);
        ret.put("cancelled", false);
        ret.put("error", e.getMessage());
        call.resolve(ret);
      }
    }

    /**
     * Подтверждает выдачу непотребляемого товара, чтобы покупка считалась завершённой.
     */
    private void acknowledgePurchase(PurchaseId purchaseId) {
      try {
        Task<AcknowledgementState> task = getPurchaseInteractor().updateAcknowledgementState(
            purchaseId,
            AcknowledgementState.ACKNOWLEDGED,
            new DeveloperPayload("")
        );
        task.addOnFailureListener(new OnFailureListener() {
          @Override
          public void onFailure(Throwable throwable) {
            // Не критично — покупка уже прошла, acknowledgement можно повторить позже
          }
        });
      } catch (Exception e) {
        // ignore
      }
    }
  }
}
